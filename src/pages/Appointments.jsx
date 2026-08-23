import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppointmentForm from '../components/AppointmentForm.jsx'
import AppointmentConfirmation from '../components/AppointmentConfirmation.jsx'

const STORAGE_KEY = 'smartcare_appointments'

export default function Appointments() {
  const [doctors, setDoctors] = useState([])
  const [searchParams] = useSearchParams()
  const preselectedDoctorId = searchParams.get('doctorId')

  const [appointments, setAppointments] = useState([])
  const [justBooked, setJustBooked] = useState(null)

  useEffect(() => {
    fetch('/doctors.json')
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error('Failed to load doctors:', err))
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setAppointments(JSON.parse(saved))
      } catch {
        setAppointments([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  }, [appointments])

  function handleBooked(newAppointment) {
    setAppointments((prev) => [newAppointment, ...prev])
    setJustBooked(newAppointment)
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6">
            <AppointmentForm
              doctors={doctors}
              preselectedDoctorId={preselectedDoctorId}
              onBooked={handleBooked}
            />
          </div>

          <div className="col-lg-6">
            <div className="card p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">My Appointments</h5>

              {appointments.length === 0 ? (
                <p className="text-secondary small">
                  You have no appointments yet. Book one using the form.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td>{appt.doctorName}</td>
                          <td>{appt.specialization}</td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td><span className="badge bg-success">{appt.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AppointmentConfirmation
        appointment={justBooked}
        onClose={() => setJustBooked(null)}
      />
    </section>
  )
}