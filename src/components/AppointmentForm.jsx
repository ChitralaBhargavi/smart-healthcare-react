import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateRequired,
  validateNotPastDate,
} from '../utils/validators.js'

const TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '11:00 AM',
  '01:00 PM',
  '03:00 PM',
  '05:00 PM',
]

const APPOINTMENTS_KEY = 'smartcare_appointments'

export default function AppointmentForm({
  doctors,
  preselectedDoctorId,
  onBooked,
}) {
  const { currentUser } = useAuth()

  const [form, setForm] = useState({
    patientName: '',
    email: '',
    phone: '',
    doctorId: preselectedDoctorId || '',
    date: '',
    time: '',
    reason: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (preselectedDoctorId) {
      setForm((prev) => ({
        ...prev,
        doctorId: preselectedDoctorId,
      }))
    }
  }, [preselectedDoctorId])

  // Fill patient details from logged-in account
  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        patientName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      }))
    }
  }, [currentUser])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  function validate() {
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

    return Object.values(newErrors).every((msg) => msg === '')
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!currentUser) {
      alert('Please log in before booking an appointment.')
      return
    }

    if (!validate()) return

    const doctor = doctors.find(
      (d) => String(d.id) === String(form.doctorId)
    )

    const appointment = {
      id: Date.now(),

      // Logged-in user's account information
      userEmail: currentUser.email.toLowerCase(),

      patientName: form.patientName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),

      doctorId: form.doctorId,
      doctorName: doctor ? doctor.name : 'Unknown',
      specialization: doctor ? doctor.specialization : '',

      date: form.date,
      time: form.time,
      reason: form.reason.trim(),

      status: 'Confirmed',
    }

    // Get existing appointments
    let appointments = []

    try {
      appointments =
        JSON.parse(localStorage.getItem(APPOINTMENTS_KEY)) || []
    } catch {
      appointments = []
    }

    // Add new appointment
    appointments.push(appointment)

    // Save all appointments
    localStorage.setItem(
      APPOINTMENTS_KEY,
      JSON.stringify(appointments)
    )

    // Send appointment to parent component
    onBooked(appointment)

    // Clear appointment-specific fields
    setForm((prev) => ({
      ...prev,
      doctorId: '',
      date: '',
      time: '',
      reason: '',
    }))
  }

  return (
    <form
      className="card p-4 shadow-sm"
      noValidate
      onSubmit={handleSubmit}
    >
      <h5 className="fw-bold mb-3">
        Book Appointment
      </h5>

      {!currentUser && (
        <div className="alert alert-warning small">
          Please log in before booking an appointment.
        </div>
      )}

      <div className="mb-3">
        <label className="form-label small fw-bold">
          Patient Name
        </label>

        <input
          type="text"
          name="patientName"
          className={`form-control ${
            errors.patientName ? 'is-invalid' : ''
          }`}
          value={form.patientName}
          onChange={handleChange}
          placeholder="Your name"
        />

        {errors.patientName && (
          <div className="invalid-feedback">
            {errors.patientName}
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">
            Email
          </label>

          <input
            type="email"
            name="email"
            className={`form-control ${
              errors.email ? 'is-invalid' : ''
            }`}
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />

          {errors.email && (
            <div className="invalid-feedback">
              {errors.email}
            </div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            className={`form-control ${
              errors.phone ? 'is-invalid' : ''
            }`}
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
          />

          {errors.phone && (
            <div className="invalid-feedback">
              {errors.phone}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-bold">
          Select Doctor
        </label>

        <select
          name="doctorId"
          className={`form-select ${
            errors.doctorId ? 'is-invalid' : ''
          }`}
          value={form.doctorId}
          onChange={handleChange}
        >
          <option value="">
            -- Choose a doctor --
          </option>

          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} ({doc.specialization})
            </option>
          ))}
        </select>

        {errors.doctorId && (
          <div className="invalid-feedback">
            {errors.doctorId}
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">
            Date
          </label>

          <input
            type="date"
            name="date"
            className={`form-control ${
              errors.date ? 'is-invalid' : ''
            }`}
            value={form.date}
            onChange={handleChange}
          />

          {errors.date && (
            <div className="invalid-feedback">
              {errors.date}
            </div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label small fw-bold">
            Time
          </label>

          <select
            name="time"
            className={`form-select ${
              errors.time ? 'is-invalid' : ''
            }`}
            value={form.time}
            onChange={handleChange}
          >
            <option value="">
              -- Choose a slot --
            </option>

            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>

          {errors.time && (
            <div className="invalid-feedback">
              {errors.time}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-bold">
          Reason for Visit
        </label>

        <textarea
          name="reason"
          rows="3"
          className={`form-control ${
            errors.reason ? 'is-invalid' : ''
          }`}
          value={form.reason}
          onChange={handleChange}
          placeholder="Regular check-up and consultation"
        ></textarea>

        {errors.reason && (
          <div className="invalid-feedback">
            {errors.reason}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={!currentUser}
      >
        Confirm Appointment
      </button>
    </form>
  )
}