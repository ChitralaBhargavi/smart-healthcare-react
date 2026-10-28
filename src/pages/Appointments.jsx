import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppointmentForm from '../components/AppointmentForm.jsx'
import AppointmentConfirmation from '../components/AppointmentConfirmation.jsx'
import { apiRequest } from '../utils/api.js'
import { useAuth } from '../context/useAuth.js'

export default function Appointments() {
  const [doctors, setDoctors] = useState([])
  const [searchParams] = useSearchParams()
  const preselectedDoctorId = searchParams.get('doctorId')

  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [justBooked, setJustBooked] = useState(null)
  const [appointmentMessage, setAppointmentMessage] = useState({ type: '', text: '' })
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' })
  const [busyAppointmentId, setBusyAppointmentId] = useState('')
  const [busyNotificationId, setBusyNotificationId] = useState('')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    apiRequest('/doctors')
      .then((data) => setDoctors(data.doctors || data))
      .catch((err) => console.error('Failed to load doctors:', err))
  }, [])

  async function fetchAppointments() {
    const data = await apiRequest('/appointments/my')
    return data.appointments || []
  }

  async function fetchNotifications() {
    const data = await apiRequest('/notifications')
    return data.notifications || []
  }

  async function loadAppointments() {
    setAppointments(await fetchAppointments())
  }

  async function loadNotifications() {
    setNotifications(await fetchNotifications())
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'patient') return

    let active = true
    async function loadPatientData() {
      const [appointmentsResult, notificationsResult] = await Promise.allSettled([
        fetchAppointments(),
        fetchNotifications(),
      ])
      if (!active) return
      setAppointments(appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [])
      setNotifications(notificationsResult.status === 'fulfilled' ? notificationsResult.value : [])
    }

    loadPatientData()
    return () => {
      active = false
    }
  }, [currentUser])

  function handleBooked(newAppointment) {
    setAppointments((prev) => [newAppointment, ...prev])
    setJustBooked(newAppointment)
  }

  async function cancelAppointment(appointmentId) {
    setBusyAppointmentId(appointmentId)
    setAppointmentMessage({ type: '', text: '' })
    try {
      await apiRequest(`/appointments/${appointmentId}/cancel`, { method: 'PATCH' })
      await loadAppointments()
      setAppointmentMessage({ type: 'success', text: 'Appointment cancelled successfully.' })
    } catch (error) {
      setAppointmentMessage({ type: 'danger', text: error.message })
    } finally {
      setBusyAppointmentId('')
    }
  }

  async function markNotificationRead(notificationId) {
    setBusyNotificationId(notificationId)
    setNotificationMessage({ type: '', text: '' })
    try {
      await apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' })
      await loadNotifications()
      setNotificationMessage({ type: 'success', text: 'Notification marked as read.' })
    } catch (error) {
      setNotificationMessage({ type: 'danger', text: error.message })
    } finally {
      setBusyNotificationId('')
    }
  }

  async function markAllNotificationsRead() {
    setMarkingAllRead(true)
    setNotificationMessage({ type: '', text: '' })
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      await loadNotifications()
      setNotificationMessage({ type: 'success', text: 'All notifications marked as read.' })
    } catch (error) {
      setNotificationMessage({ type: 'danger', text: error.message })
    } finally {
      setMarkingAllRead(false)
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-6">
            <AppointmentForm
              key={`${currentUser?.id || 'guest'}-${preselectedDoctorId || ''}`}
              doctors={doctors}
              preselectedDoctorId={preselectedDoctorId}
              onBooked={handleBooked}
            />
          </div>

          <div className="col-lg-6">
            <div className="card p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">My Appointments</h5>
              {appointmentMessage.text && (
                <div className={`alert alert-${appointmentMessage.type} py-2`} role="alert">
                  {appointmentMessage.text}
                </div>
              )}

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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td>{appt.doctor?.name}</td>
                          <td>{appt.doctor?.specialization}</td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td><span className="badge bg-success">{appt.status}</span></td>
                          <td>
                            {['pending', 'confirmed'].includes(appt.status) && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={busyAppointmentId === appt.id}
                                onClick={() => cancelAppointment(appt.id)}
                              >
                                {busyAppointmentId === appt.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="card p-4 shadow-sm mt-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="fw-bold mb-0">Notifications</h5>
              {notifications.some((notification) => !notification.read) && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={markingAllRead}
                  onClick={markAllNotificationsRead}
                >
                  {markingAllRead ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>
            {notificationMessage.text && (
              <div className={`alert alert-${notificationMessage.type} py-2`} role="alert">
                {notificationMessage.text}
              </div>
            )}
            {notifications.length === 0 ? (
              <p className="text-secondary small mb-0">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div className={`border rounded p-2 mb-2 ${notification.read ? '' : 'bg-light'}`} key={notification._id}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-bold small">{notification.title}</div>
                    {!notification.read && (
                      <button
                        className="btn btn-sm btn-link p-0"
                        disabled={busyNotificationId === notification._id}
                        onClick={() => markNotificationRead(notification._id)}
                      >
                        {busyNotificationId === notification._id ? 'Saving...' : 'Mark read'}
                      </button>
                    )}
                  </div>
                  <div className="small text-secondary">{notification.message}</div>
                </div>
              ))
            )}
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