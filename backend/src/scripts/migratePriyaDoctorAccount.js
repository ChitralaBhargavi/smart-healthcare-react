import { closeDatabase, connectDatabase } from '../config/db.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'

const targetEmail = 'priyasharma@gmail.com'
const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=')]
  }),
)

function fail(message) {
  const error = new Error(message)
  error.code = 'MIGRATION_BLOCKED'
  throw error
}

async function inspect() {
  const doctor = await Doctor.findOne({ legacyId: 1, name: 'Dr. Priya Sharma' })
  if (!doctor) fail('Dr. Priya Sharma profile with legacyId 1 was not found.')
  if (!doctor.user) fail('Dr. Priya Sharma is not linked to a user account.')

  const linkedUser = await User.findById(doctor.user).select('+passwordHash')
  if (!linkedUser) fail('The linked Priya user account was not found.')
  if (linkedUser.role !== 'doctor') fail('The linked Priya account is not a doctor account.')

  const targetMatches = await User.find({ email: targetEmail }).select('_id email role')
  if (targetMatches.some((user) => String(user._id) !== String(linkedUser._id))) {
    fail(`The target email ${targetEmail} belongs to another account.`)
  }
  if (targetMatches.length > 1) fail(`The target email ${targetEmail} is duplicated.`)

  const doctorLinks = await Doctor.countDocuments({ user: linkedUser._id })
  if (doctorLinks !== 1) fail('The linked user is associated with an unexpected number of Doctor profiles.')

  return {
    doctor,
    linkedUser,
    targetMatches,
    status: linkedUser.email === targetEmail ? 'already-migrated' : 'migration-needed',
  }
}

function report({ doctor, linkedUser, targetMatches, status }) {
  console.log(`Doctor profile: ${doctor.name} (legacyId=${doctor.legacyId}, id=${doctor._id})`)
  console.log(`Existing user: ${linkedUser.email} (id=${linkedUser._id}, role=${linkedUser.role})`)
  console.log(`Target email: ${targetEmail} (${targetMatches.length ? 'already belongs to linked user' : 'available'})`)
  console.log(`Migration status: ${status}`)
  console.log('Preserved: Doctor _id, legacyId, user _id, availability, appointments, and notifications.')
  console.log('Migration action: normalize target email, require password setup, and remove the old password hash.')
}

async function apply(snapshot) {
  if (snapshot.status === 'already-migrated') {
    console.log('Migration already completed. No database changes were made.')
    return
  }
  const { doctor, linkedUser } = snapshot
  const original = {
    email: linkedUser.email,
    fullName: linkedUser.fullName,
    passwordHash: linkedUser.passwordHash,
    doctorSetupRequired: linkedUser.doctorSetupRequired,
    doctorEmailVerifiedAt: linkedUser.doctorEmailVerifiedAt,
  }

  try {
    linkedUser.email = targetEmail
    linkedUser.fullName = doctor.name
    linkedUser.passwordHash = undefined
    linkedUser.doctorSetupRequired = true
    linkedUser.doctorEmailVerifiedAt = undefined
    await linkedUser.save()
    console.log(`Migrated existing user ${linkedUser._id} to ${targetEmail}.`)
    console.log('No Doctor, Appointment, or Notification documents were rewritten.')
  } catch (error) {
    await User.updateOne(
      { _id: linkedUser._id },
      {
        $set: {
          email: original.email,
          fullName: original.fullName,
          doctorSetupRequired: original.doctorSetupRequired,
        },
        $unset: {
          passwordHash: 1,
          doctorEmailVerifiedAt: 1,
        },
      },
    )
    if (original.passwordHash) {
      await User.updateOne({ _id: linkedUser._id }, { $set: { passwordHash: original.passwordHash } })
    }
    if (original.doctorEmailVerifiedAt) {
      await User.updateOne({ _id: linkedUser._id }, { $set: { doctorEmailVerifiedAt: original.doctorEmailVerifiedAt } })
    }
    throw new Error(`Migration failed and the user record was restored: ${error.message}`)
  }
}

try {
  await connectDatabase()
  const snapshot = await inspect()
  report(snapshot)
  if (args.apply !== 'true' || args.confirm !== 'MIGRATE_PRIYA_DOCTOR') {
    console.log('Dry run only. No database changes were made.')
  } else {
    await apply(snapshot)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
