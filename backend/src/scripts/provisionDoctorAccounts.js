import { closeDatabase, connectDatabase } from '../config/db.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'

const doctorAccounts = [
  { legacyId: 1, email: 'priyasharma@gmail.com' },
  { legacyId: 2, email: 'rahulverma@gmail.com' },
  { legacyId: 3, email: 'ananyasingh@gmail.com' },
  { legacyId: 4, email: 'amitpatel@gmail.com' },
  { legacyId: 5, email: 'nehagupta@gmail.com' },
  { legacyId: 6, email: 'sureshiyer@gmail.com' },
]

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=')]
  }),
)

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

async function inspectAccount(account) {
  const doctor = await Doctor.findOne({ legacyId: account.legacyId })
  if (!doctor) return { ...account, status: 'missing-profile' }

  const targetEmail = normalizeEmail(account.email)
  const linkedUser = doctor.user ? await User.findById(doctor.user) : null
  if (linkedUser) {
    if (linkedUser.role !== 'doctor' || linkedUser.email !== targetEmail) {
      return {
        ...account,
        doctor,
        linkedUser,
        status: 'conflict-linked-account',
      }
    }
    return { ...account, doctor, linkedUser, status: 'already-linked' }
  }

  const matches = await User.find({ email: targetEmail })
  if (matches.length > 1) return { ...account, doctor, status: 'conflict-duplicate-email' }
  if (matches.length === 1) {
    const existingDoctor = await Doctor.findOne({ user: matches[0]._id })
    return {
      ...account,
      doctor,
      linkedUser: matches[0],
      status: existingDoctor ? 'conflict-email-linked-elsewhere' : 'conflict-email-exists',
    }
  }
  return { ...account, doctor, status: 'ready-to-create' }
}

function report(records) {
  for (const record of records) {
    const detail = record.status === 'conflict-linked-account'
      ? `existing email ${record.linkedUser.email}`
      : ''
    console.log(`${record.legacyId}: ${record.doctor?.name || 'profile missing'} <${record.email}> - ${record.status}${detail ? ` (${detail})` : ''}`)
  }
}

async function apply(records) {
  const createdUsers = []
  const linkedDoctors = []
  try {
    for (const record of records.filter((item) => item.status === 'ready-to-create')) {
      const user = await User.create({
        fullName: record.doctor.name,
        email: normalizeEmail(record.email),
        role: 'doctor',
        doctorSetupRequired: true,
      })
      createdUsers.push(user._id)
      record.doctor.user = user._id
      await record.doctor.save()
      linkedDoctors.push(record.doctor._id)
    }
    console.log(`Applied ${createdUsers.length} new doctor account link(s).`)
  } catch (error) {
    for (const doctorId of linkedDoctors) {
      await Doctor.updateOne({ _id: doctorId }, { $unset: { user: 1 } })
    }
    if (createdUsers.length) await User.deleteMany({ _id: { $in: createdUsers } })
    throw new Error(`Provisioning rolled back after failure: ${error.message}`)
  }
}

try {
  await connectDatabase()
  const records = []
  for (const account of doctorAccounts) records.push(await inspectAccount(account))
  report(records)

  const hasConflicts = records.some((record) => record.status.startsWith('conflict') || record.status === 'missing-profile')
  if (hasConflicts) {
    console.log('No conflicting account was changed.')
  }

  if (args.apply !== 'true' || args.confirm !== 'PROVISION_DOCTORS') {
    console.log('Dry run only. To apply only ready actions, rerun with --apply=true --confirm=PROVISION_DOCTORS.')
  } else {
    await apply(records)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
