import mongoose from 'mongoose'
import Doctor from '../models/Doctor.js'

const doctorFields = [
  'legacyId',
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

function doctorPayload(body) {
  return Object.fromEntries(
    doctorFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  )
}

function createHttpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function getDoctorFilter(id) {
  if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
    return { _id: id }
  }

  const legacyId = Number(id)
  if (Number.isSafeInteger(legacyId) && legacyId > 0) {
    return { legacyId }
  }

  throw createHttpError(400, 'Doctor id must be a valid MongoDB ObjectId or positive numeric id.')
}

export async function listDoctors(req, res, next) {
  try {
    const doctors = await Doctor.find().select('-user').sort({ legacyId: 1, name: 1 })
    res.json(doctors)
  } catch (error) {
    next(error)
  }
}

export async function getDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findOne(getDoctorFilter(req.params.id)).select('-user')
    if (!doctor) throw createHttpError(404, 'Doctor not found.')
    res.json(doctor)
  } catch (error) {
    next(error)
  }
}

export async function getMyDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('-user')
    if (!doctor) throw createHttpError(409, 'Your account is not linked to a doctor profile yet.')
    res.json({ doctor })
  } catch (error) {
    next(error)
  }
}

export async function createDoctor(req, res, next) {
  try {
    const existingDoctor = await Doctor.exists({ user: req.user._id })
    if (existingDoctor) throw createHttpError(409, 'Your account is already linked to a doctor profile.')
    const doctor = await Doctor.create({ ...doctorPayload(req.body), user: req.user._id })
    res.status(201).json(doctor)
  } catch (error) {
    next(error)
  }
}

export async function updateDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { ...getDoctorFilter(req.params.id), user: req.user._id },
      doctorPayload(req.body),
      { new: true, runValidators: true },
    )
    if (!doctor) throw createHttpError(404, 'Doctor not found.')
    res.json(doctor)
  } catch (error) {
    next(error)
  }
}

export async function deleteDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findOneAndDelete({
      ...getDoctorFilter(req.params.id),
      user: req.user._id,
    })
    if (!doctor) throw createHttpError(404, 'Doctor not found.')
    res.json({ message: 'Doctor deleted.', id: doctor._id })
  } catch (error) {
    next(error)
  }
}
