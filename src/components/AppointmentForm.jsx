import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../utils/api.js'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateRequired,
  validateNotPastDate,
} from '../utils/validators.js'

const TIME_SLOTS = ['09:00', '10:30', '11:00', '13:00', '15:00', '17:00']
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function availableTimes(doctor, date) {
  if (!doctor?.availabilitySchedule?.length || !date) return TIME_SLOTS
  const day = WEEK_DAYS[new Date(`${date}T00:00:00`).getDay()]
  const entry = doctor.availabilitySchedule.find((item) => item.day === day)
  if (!entry) return []

  return entry.slots.flatMap((slot) => {
    const [startHour, startMinute] = slot.start.split(':').map(Number)
    const [endHour, endMinute] = slot.end.split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute
    const times = []
    for (let value = start; value < end; value += 30) {
      times.push(`${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`)
    }
    return times
  })
}

export default function AppointmentForm({ doctors, preselectedDoctorId, onBooked }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({
    patientName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    doctorId: preselectedDoctorId || '',
    date: '', time: '', reason: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookedTimes, setBookedTimes] = useState({ key: '', values: [] })
  const [loadingTimes, setLoadingTimes] = useState(false)

  useEffect(() => {
    if (!form.doctorId || !form.date) {
      return
    }

    let active = true
    const requestKey = `${form.doctorId}:${form.date}`
    apiRequest(`/doctors/${form.doctorId}/availability?date=${encodeURIComponent(form.date)}`)
      .then((data) => {
        if (active) setBookedTimes({ key: requestKey, values: data.bookedTimes || [] })
      })
      .catch(() => {
        if (active) setBookedTimes({ key: requestKey, values: [] })
      })
      .finally(() => {
        if (active) setLoadingTimes(false)
      })

    return () => {
      active = false
    }
  }, [form.doctorId, form.date])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'doctorId' || name === 'date') {
      const nextDoctorId = name === 'doctorId' ? value : form.doctorId
      const nextDate = name === 'date' ? value : form.date
      setLoadingTimes(Boolean(nextDoctorId && nextDate))
    }
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'doctorId' || name === 'date' ? { time: '' } : {}),
    }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setSubmitError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {
      patientName: validateName(form.patientName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      doctorId: validateRequired(form.doctorId, 'Doctor'),
      date: validateNotPastDate(form.date),
      time: validateRequired(form.time, 'Time'),
      reason: validateRequired(form.reason, 'Reason for visit'),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return
    if (!currentUser) return setSubmitError('Please log in before booking an appointment.')

    const doctor = doctors.find((item) => String(item._id || item.legacyId || item.id) === String(form.doctorId))
    if (doctor?.isAvailable === false) return setSubmitError('This doctor is currently unavailable.')
    if (!availableTimes(doctor, form.date).includes(form.time)) {
      return setSubmitError('Please choose a time within the doctor availability schedule.')
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const { appointment } = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: form.doctorId,
          date: form.date,
          time: form.time,
          reason: form.reason.trim(),
        }),
      })
      onBooked(appointment)
      setLoadingTimes(false)
      setForm((previous) => ({ ...previous, doctorId: '', date: '', time: '', reason: '' }))
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDoctor = doctors.find((item) => String(item._id || item.legacyId || item.id) === String(form.doctorId))
  const bookedTimeValues = bookedTimes.key === `${form.doctorId}:${form.date}` ? bookedTimes.values : []
  const timeSlots = availableTimes(selectedDoctor, form.date)
    .filter((slot) => !bookedTimeValues.includes(slot))

  return (
    <form className="card p-4 shadow-sm" noValidate onSubmit={handleSubmit}>
      <h5 className="fw-bold mb-3">Book Appointment</h5>
      {!currentUser && <div className="alert alert-warning small">Please log in before booking an appointment.</div>}
      {submitError && <div className="alert alert-danger small">{submitError}</div>}
      {[
        ['patientName', 'Patient Name', 'text', 'Your name'],
        ['email', 'Email', 'email', 'you@example.com'],
        ['phone', 'Phone Number', 'tel', '9876543210'],
      ].map(([name, label, type, placeholder]) => (
        <div className="mb-3" key={name}>
          <label className="form-label small fw-bold">{label}</label>
          <input type={type} name={name} className={`form-control ${errors[name] ? 'is-invalid' : ''}`} value={form[name]} onChange={handleChange} placeholder={placeholder} />
          {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
        </div>
      ))}
      <div className="mb-3">
        <label className="form-label small fw-bold">Select Doctor</label>
        <select name="doctorId" className={`form-select ${errors.doctorId ? 'is-invalid' : ''}`} value={form.doctorId} onChange={handleChange}>
          <option value="">-- Choose a doctor --</option>
          {doctors.map((doctor) => (
            <option key={doctor._id || doctor.legacyId || doctor.id} value={doctor._id || doctor.legacyId || doctor.id} disabled={doctor.isAvailable === false}>
              {doctor.name} ({doctor.specialization}){doctor.isAvailable === false ? ' - Unavailable' : ''}
            </option>
          ))}
        </select>
        {errors.doctorId && <div className="invalid-feedback">{errors.doctorId}</div>}
      </div>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">Date</label>
          <input type="date" name="date" className={`form-control ${errors.date ? 'is-invalid' : ''}`} value={form.date} onChange={handleChange} />
          {errors.date && <div className="invalid-feedback">{errors.date}</div>}
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">Time</label>
          <select name="time" className={`form-select ${errors.time ? 'is-invalid' : ''}`} value={form.time} onChange={handleChange}>
            <option value="">
              {loadingTimes
                ? 'Loading available slots...'
                : form.date && selectedDoctor?.availabilitySchedule?.length && timeSlots.length === 0
                ? 'No slots on this day'
                : '-- Choose a slot --'}
            </option>
            {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          {errors.time && <div className="invalid-feedback">{errors.time}</div>}
          {selectedDoctor?.availabilitySchedule?.length > 0 && form.date && timeSlots.length > 0 && (
            <div className="form-text">Times shown are based on the doctor&apos;s schedule.</div>
          )}
          {form.date && !loadingTimes && bookedTimeValues.length > 0 && timeSlots.length > 0 && (
            <div className="form-text">{bookedTimeValues.length} booked slot{bookedTimeValues.length === 1 ? '' : 's'} hidden.</div>
          )}
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label small fw-bold">Reason for Visit</label>
        <textarea name="reason" rows="3" className={`form-control ${errors.reason ? 'is-invalid' : ''}`} value={form.reason} onChange={handleChange} />
        {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={!currentUser || submitting}>
        {submitting ? 'Submitting...' : 'Request Appointment'}
      </button>
    </form>
  )
}
