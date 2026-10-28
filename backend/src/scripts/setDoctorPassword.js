import bcrypt from 'bcryptjs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { closeDatabase, connectDatabase } from '../config/db.js'
import { config } from '../config.js'
import Doctor from '../models/Doctor.js'
import DoctorSetupToken from '../models/DoctorSetupToken.js'
import User from '../models/User.js'
import { validateSetupPassword } from '../utils/doctorSetup.js'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=')]
  }),
)

function usageError(message) {
  return new Error(`${message}\nUsage: npm.cmd run set:doctor-password -- --doctorEmail=doctor@example.com --apply=true --confirm=SET_DOCTOR_PASSWORD`)
}

function validateEnvironment() {
  if (config.isProduction) {
    throw new Error('This local-development password utility cannot run in production.')
  }
  if (!config.mongodbUri || !config.dbName) {
    throw new Error('Database configuration is incomplete. Set MONGODB_URI and DB_NAME explicitly.')
  }
  if (args.apply !== 'true' || args.confirm !== 'SET_DOCTOR_PASSWORD') {
    throw usageError('Explicit --apply=true and --confirm=SET_DOCTOR_PASSWORD are required.')
  }
  const identifiers = [args.doctorEmail, args.legacyId].filter(Boolean)
  if (identifiers.length !== 1) {
    throw usageError('Provide exactly one existing doctor identifier: --doctorEmail or --legacyId.')
  }
}

async function findTarget() {
  let doctor
  let user

  if (args.legacyId) {
    const legacyId = Number(args.legacyId)
    if (!Number.isSafeInteger(legacyId) || legacyId < 1) {
      throw usageError('--legacyId must be a positive integer.')
    }
    doctor = await Doctor.findOne({ legacyId })
    if (!doctor) throw new Error('No existing doctor profile matched the supplied legacy ID.')
    if (!doctor.user) throw new Error('The selected doctor profile is not linked to a user account.')
    user = await User.findById(doctor.user).select('+passwordHash')
  } else {
    const email = args.doctorEmail.trim().toLowerCase()
    if (!email) throw usageError('--doctorEmail must not be empty.')
    user = await User.findOne({ email }).select('+passwordHash')
    if (!user) throw new Error('No existing user account matched the supplied doctor email.')
    doctor = await Doctor.findOne({ user: user._id })
  }

  if (!user || !doctor) {
    throw new Error('The selected doctor does not have a complete linked account.')
  }
  if (user.role !== 'doctor') {
    throw new Error('The selected account is not a doctor account; no changes were made.')
  }
  if (doctor.user.toString() !== user._id.toString()) {
    throw new Error('Doctor and user linkage is inconsistent; no changes were made.')
  }
  return { doctor, user }
}

async function promptForPassword() {
  if (!input.isTTY || !output.isTTY) {
    throw new Error('A secure interactive terminal is required; password input was not accepted.')
  }

  const readline = createInterface({ input, output })
  const password = await readline.question('New password (input will be hidden): ', { hideEchoBack: true })
  const confirmation = await readline.question('Confirm new password (input will be hidden): ', { hideEchoBack: true })
  readline.close()

  if (password !== confirmation) throw new Error('Passwords do not match.')
  const passwordError = validateSetupPassword(password)
  if (passwordError) throw new Error(passwordError)
  return password
}

async function main() {
  validateEnvironment()
  await connectDatabase()
  const { doctor, user } = await findTarget()

  console.log(`Database: ${config.dbName}`)
  console.log(`Selected doctor: ${doctor.name} (legacy ID ${doctor.legacyId})`)
  console.log('Only the existing linked doctor account will be updated.')

  const password = await promptForPassword()
  user.passwordHash = await bcrypt.hash(password, 12)
  user.doctorSetupRequired = false
  // This local tool does not assert ownership of the doctor's email address.
  await user.save()
  await DoctorSetupToken.deleteMany({ user: user._id })

  console.log('Doctor password updated. Existing profile, IDs, appointments, notifications, and email verification state were preserved.')
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
