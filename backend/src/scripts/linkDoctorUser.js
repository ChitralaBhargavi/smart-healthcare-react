import { connectDatabase, closeDatabase } from '../config/db.js'
import User from '../models/User.js'
import Doctor from '../models/Doctor.js'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=')]
  }),
)

try {
  if (!args.email || !args.doctorId) {
    throw new Error('Usage: npm run link:doctor -- --email=doctor@example.com --doctorId=1')
  }
  await connectDatabase()
  const user = await User.findOne({ email: args.email.trim().toLowerCase(), role: 'doctor' })
  const doctor = await Doctor.findOne({ legacyId: Number(args.doctorId) })
  if (!user || !doctor) throw new Error('Doctor user or doctor profile was not found.')
  doctor.user = user._id
  await doctor.save()
  console.log(`Linked doctor profile ${doctor.legacyId} to the doctor account.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
