import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { connectDatabase, closeDatabase } from '../config/db.js'
import Doctor from '../models/Doctor.js'

const doctorsFilePath = fileURLToPath(
  new URL('../../../public/doctors.json', import.meta.url),
)

const doctorFields = [
  'name',
  'specialization',
  'experience',
  'qualification',
  'hospital',
  'fee',
  'rating',
  'availableDays',
  'availableTime',
  'about',
  'image',
]

function mapDoctor(record) {
  if (
    !record
    || !Number.isSafeInteger(record.id)
    || record.id < 1
    || doctorFields.some((field) => record[field] === undefined)
  ) {
    return null
  }

  return {
    legacyId: record.id,
    ...Object.fromEntries(doctorFields.map((field) => [field, record[field]])),
  }
}

async function seedDoctors() {
  const records = JSON.parse(await readFile(doctorsFilePath, 'utf8'))
  if (!Array.isArray(records)) {
    throw new Error('public/doctors.json must contain an array.')
  }

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const record of records) {
    const doctor = mapDoctor(record)
    if (!doctor) {
      skipped += 1
      continue
    }

    const result = await Doctor.updateOne(
      { legacyId: doctor.legacyId },
      { $set: doctor },
      { upsert: true, runValidators: true },
    )

    if (result.upsertedCount > 0) {
      inserted += 1
    } else if (result.modifiedCount > 0) {
      updated += 1
    }
  }

  console.log(`Doctor seed complete: inserted=${inserted}, updated=${updated}, skipped=${skipped}.`)
}

try {
  await connectDatabase()
  await seedDoctors()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (mongoose.connection.readyState !== 0) {
    await closeDatabase()
  }
}
