import mongoose from 'mongoose'
import Doctor from '../models/Doctor.js'

export function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export async function resolveDoctor(id) {
  if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
    return Doctor.findById(id)
  }

  const legacyId = Number(id)
  if (Number.isSafeInteger(legacyId) && legacyId > 0) {
    return Doctor.findOne({ legacyId })
  }

  throw httpError(400, 'Doctor id must be a valid MongoDB ObjectId or positive numeric id.')
}

export function parseAppointmentDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, 'Appointment date must use YYYY-MM-DD format.')
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw httpError(400, 'Appointment date is invalid.')
  }

  if (date < new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)) {
    throw httpError(400, 'Appointment date cannot be in the past.')
  }

  return date
}

export function isValidAppointmentTime(time) {
  return typeof time === 'string'
    && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
    && Number(time.slice(3)) % 30 === 0
}

export function isValidStatusTransition(currentStatus, nextStatus) {
  const transitions = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    rejected: [],
    cancelled: [],
    completed: [],
  }

  return transitions[currentStatus]?.includes(nextStatus) || false
}

export function isWithinAvailability(doctor, date, time) {
  if (!doctor.isAvailable) return false
  if (!doctor.availabilitySchedule.length) return true

  const day = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const schedule = doctor.availabilitySchedule.find((entry) => entry.day === day)
  if (!schedule) return false

  const [hours, minutes] = time.split(':').map(Number)
  const value = hours * 60 + minutes
  return schedule.slots.some((slot) => {
    const [startHour, startMinute] = slot.start.split(':').map(Number)
    const [endHour, endMinute] = slot.end.split(':').map(Number)
    return value >= startHour * 60 + startMinute && value < endHour * 60 + endMinute
  })
}

export function validateAvailabilitySchedule(schedule) {
  const days = new Set()
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/

  if (!Array.isArray(schedule)) {
    throw httpError(400, 'availabilitySchedule must be an array.')
  }

  schedule.forEach((entry) => {
    if (!entry || typeof entry.day !== 'string' || days.has(entry.day)) {
      throw httpError(400, 'Each availability day must be valid and appear only once.')
    }
    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(entry.day)) {
      throw httpError(400, 'Availability contains an invalid day.')
    }
    days.add(entry.day)
    if (!Array.isArray(entry.slots) || entry.slots.length < 1) {
      throw httpError(400, `Availability for ${entry.day} must include a time slot.`)
    }
    entry.slots.forEach((slot) => {
      if (!slot || !timePattern.test(slot.start) || !timePattern.test(slot.end)) {
        throw httpError(400, `Availability for ${entry.day} must use valid HH:MM times.`)
      }
      if (slot.start >= slot.end) {
        throw httpError(400, `Availability for ${entry.day} must end after it starts.`)
      }
    })
  })

  return schedule
}
