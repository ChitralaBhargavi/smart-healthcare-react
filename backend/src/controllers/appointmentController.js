import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import Notification from '../models/Notification.js'
import {
  httpError,
  isValidAppointmentTime,
  isValidStatusTransition,
  isWithinAvailability,
  parseAppointmentDate,
  resolveDoctor,
} from '../utils/appointment.js'

function publicAppointment(appointment) {
  return {
    id: appointment._id,
    date: appointment.appointmentDate.toISOString().slice(0, 10),
    time: appointment.appointmentTime,
    reason: appointment.reason,
    status: appointment.status,
    patient: appointment.user ? {
      id: appointment.user._id,
      fullName: appointment.user.fullName,
      email: appointment.user.email,
      phone: appointment.user.phone,
    } : undefined,
    doctor: appointment.doctor ? {
      id: appointment.doctor._id,
      name: appointment.doctor.name,
      specialization: appointment.doctor.specialization,
    } : undefined,
  }
}

export async function createAppointment(req, res, next) {
  try {
    const { doctorId, date, time, reason } = req.body
    const doctor = await resolveDoctor(doctorId)
    if (!doctor) throw httpError(404, 'Doctor not found.')
    const appointmentDate = parseAppointmentDate(date)

    if (!isValidAppointmentTime(time)) {
      throw httpError(400, 'Appointment time must use a valid 30-minute slot in HH:MM format.')
    }
    if (!reason?.trim()) throw httpError(400, 'Reason for visit is required.')
    if (!isWithinAvailability(doctor, appointmentDate, time)) {
      throw httpError(409, 'The doctor is unavailable for this date and time.')
    }

    const appointment = await Appointment.create({
      user: req.user._id,
      doctor: doctor._id,
      appointmentDate,
      appointmentTime: time,
      reason: reason.trim(),
      status: 'pending',
    })

    await Notification.create([
      {
        recipient: req.user._id,
        recipientRole: 'patient',
        type: 'appointment_created',
        title: 'Appointment requested',
        message: `Your appointment request with ${doctor.name} was submitted.`,
        relatedAppointment: appointment._id,
      },
      ...(doctor.user ? [{
        recipient: doctor.user,
        recipientRole: 'doctor',
        type: 'appointment_created',
        title: 'New appointment request',
        message: `A patient requested an appointment on ${date} at ${time}.`,
        relatedAppointment: appointment._id,
      }] : []),
    ])

    const populated = await appointment.populate([
      { path: 'user', select: 'fullName email phone' },
      { path: 'doctor', select: 'name specialization' },
    ])
    return res.status(201).json({ appointment: publicAppointment(populated) })
  } catch (error) {
    if (error.code === 11000) {
      return next(httpError(409, 'That doctor time slot is already booked.'))
    }
    return next(error)
  }
}

export async function listMyAppointments(req, res, next) {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1, appointmentTime: 1 })
    res.json({ appointments: appointments.map(publicAppointment) })
  } catch (error) {
    next(error)
  }
}

async function doctorForUser(userId) {
  const doctor = await Doctor.findOne({ user: userId })
  if (!doctor) throw httpError(409, 'Your account is not linked to a doctor profile yet.')
  return doctor
}

export async function listDoctorAppointments(req, res, next) {
  try {
    const doctor = await doctorForUser(req.user._id)
    const appointments = await Appointment.find({ doctor: doctor._id })
      .populate('user', 'fullName email phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
    res.json({ appointments: appointments.map(publicAppointment) })
  } catch (error) {
    next(error)
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const doctor = await doctorForUser(req.user._id)
    const allowed = ['confirmed', 'rejected', 'completed']
    const { status } = req.body
    if (!allowed.includes(status)) throw httpError(400, 'Status must be confirmed, rejected, or completed.')

    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor._id })
      .populate('user', 'fullName email phone')
      .populate('doctor', 'name specialization')
    if (!appointment) throw httpError(404, 'Appointment not found.')
    if (!isValidStatusTransition(appointment.status, status)) {
      throw httpError(409, `An appointment cannot change from ${appointment.status} to ${status}.`)
    }

    appointment.status = status
    await appointment.save()
    await Notification.create({
      recipient: appointment.user._id,
      recipientRole: 'patient',
      type: 'appointment_status',
      title: 'Appointment status updated',
      message: `Your appointment is now ${status}.`,
      relatedAppointment: appointment._id,
    })
    return res.json({ appointment: publicAppointment(appointment) })
  } catch (error) {
    next(error)
  }
}

export async function cancelMyAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('doctor', 'name specialization user')
    if (!appointment) throw httpError(404, 'Appointment not found.')
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      throw httpError(409, 'This appointment can no longer be cancelled.')
    }
    appointment.status = 'cancelled'
    await appointment.save()
    if (appointment.doctor.user) {
      await Notification.create({
        recipient: appointment.doctor.user,
        recipientRole: 'doctor',
        type: 'appointment_status',
        title: 'Appointment cancelled',
        message: 'A patient cancelled an appointment.',
        relatedAppointment: appointment._id,
      })
    }
    return res.json({ message: 'Appointment cancelled.' })
  } catch (error) {
    next(error)
  }
}
