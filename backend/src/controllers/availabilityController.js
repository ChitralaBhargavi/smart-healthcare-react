import Doctor from '../models/Doctor.js'
import Appointment from '../models/Appointment.js'
import Notification from '../models/Notification.js'
import { httpError, parseAppointmentDate, validateAvailabilitySchedule } from '../utils/appointment.js'

export async function getAvailability(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id).select('isAvailable availabilitySchedule')
    if (!doctor) throw httpError(404, 'Doctor not found.')
    let bookedTimes = []
    if (req.query.date) {
      const appointmentDate = parseAppointmentDate(req.query.date)
      const appointments = await Appointment.find({
        doctor: doctor._id,
        appointmentDate,
        status: { $in: ['pending', 'confirmed'] },
      }).select('appointmentTime -_id')
      bookedTimes = appointments.map((appointment) => appointment.appointmentTime)
    }
    res.json({
      isAvailable: doctor.isAvailable,
      availabilitySchedule: doctor.availabilitySchedule,
      bookedTimes,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, user: req.user._id })
    if (!doctor) throw httpError(404, 'Your doctor profile was not found.')
    const { isAvailable, availabilitySchedule } = req.body
    if (typeof isAvailable !== 'boolean') {
      throw httpError(400, 'isAvailable and availabilitySchedule are required.')
    }
    validateAvailabilitySchedule(availabilitySchedule)
    doctor.isAvailable = isAvailable
    doctor.availabilitySchedule = availabilitySchedule
    await doctor.save()

    if (doctor.user) {
      await Notification.create({
        recipient: doctor.user,
        recipientRole: 'doctor',
        type: 'availability_changed',
        title: 'Availability updated',
        message: `Your profile is now ${isAvailable ? 'available' : 'unavailable'} for appointments.`,
      })
    }
    res.json({ isAvailable: doctor.isAvailable, availabilitySchedule: doctor.availabilitySchedule })
  } catch (error) {
    next(error)
  }
}
