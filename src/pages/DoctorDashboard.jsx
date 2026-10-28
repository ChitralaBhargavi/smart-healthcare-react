import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../utils/api.js'

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DEFAULT_SLOT = { start: '09:00', end: '17:00' }

function scheduleDraft(schedule = []) {
  return WEEK_DAYS.map((day) => {
    const entry = schedule.find((item) => item.day === day)
    return {
      day,
      enabled: Boolean(entry),
      start: entry?.slots?.[0]?.start || DEFAULT_SLOT.start,
      end: entry?.slots?.[0]?.end || DEFAULT_SLOT.end,
    }
  })
}

export default function DoctorDashboard() {
  const { logout } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [schedule, setSchedule] = useState(scheduleDraft())
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [success, setSuccess] = useState('')
  const [busyNotificationId, setBusyNotificationId] = useState('')
  const [markingAllRead, setMarkingAllRead] = useState(false)

  async function fetchDashboard() {
    const results = await Promise.allSettled([
      apiRequest('/doctors/me'),
      apiRequest('/appointments/doctor'),
      apiRequest('/notifications'),
    ])
    return results
  }

  function applyDashboardResults(results) {
    const [doctorResult, appointmentResult, notificationResult] = results
    const failures = []

    if (doctorResult.status === 'fulfilled') {
      setDoctor(doctorResult.value.doctor)
      setSchedule(scheduleDraft(doctorResult.value.doctor.availabilitySchedule))
    } else {
      failures.push(`profile: ${doctorResult.reason.message}`)
    }

    if (appointmentResult.status === 'fulfilled') {
      setAppointments(appointmentResult.value.appointments || [])
    } else {
      failures.push(`appointments: ${appointmentResult.reason.message}`)
    }

    if (notificationResult.status === 'fulfilled') {
      setNotifications(notificationResult.value.notifications || [])
    } else {
      failures.push(`notifications: ${notificationResult.reason.message}`)
    }

    setError(failures.length ? `Dashboard data could not be loaded (${failures.join('; ')}).` : '')
  }

  async function loadDashboard() {
    setLoadingDashboard(true)
    try {
      applyDashboardResults(await fetchDashboard())
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialDashboard() {
      const results = await fetchDashboard()
      if (active) applyDashboardResults(results)
      if (active) setLoadingDashboard(false)
    }

    loadInitialDashboard()
    return () => {
      active = false
    }
  }, [])

  async function changeStatus(id, status) {
    setBusyId(id)
    setError('')
    setSuccess('')
    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadDashboard()
      setSuccess(`Appointment ${status} successfully.`)
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setBusyId('')
    }
  }

  async function saveAvailability(isAvailable = doctor?.isAvailable, nextSchedule = schedule) {
    if (!doctor) return
    const availabilitySchedule = nextSchedule
      .filter((entry) => entry.enabled)
      .map(({ day, start, end }) => ({ day, slots: [{ start, end }] }))
    setSavingAvailability(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiRequest(`/doctors/${doctor._id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({
          isAvailable,
          availabilitySchedule,
        }),
      })
      setDoctor((previous) => ({ ...previous, ...response }))
      setSchedule(scheduleDraft(response.availabilitySchedule))
      setSuccess('Availability schedule saved successfully.')
    } catch (availabilityError) {
      setError(availabilityError.message)
    } finally {
      setSavingAvailability(false)
    }
  }

  async function markNotificationRead(notificationId) {
    setBusyNotificationId(notificationId)
    setError('')
    setSuccess('')
    try {
      await apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' })
      await loadDashboard()
      setSuccess('Notification marked as read.')
    } catch (notificationError) {
      setError(notificationError.message)
    } finally {
      setBusyNotificationId('')
    }
  }

  async function markAllNotificationsRead() {
    setMarkingAllRead(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' })
      await loadDashboard()
      setSuccess('All notifications marked as read.')
    } catch (notificationError) {
      setError(notificationError.message)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const pending = appointments.filter((item) => item.status === 'pending').length
  const confirmed = appointments.filter((item) => item.status === 'confirmed').length
  const unread = notifications.filter((item) => !item.read).length

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold mb-1">Doctor Dashboard</h3>
            <p className="text-secondary mb-0">
              Welcome, {loadingDashboard ? 'Loading doctor profile...' : (doctor?.name || 'Doctor profile unavailable')}
            </p>
          </div>
          <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="row g-3 mb-4">
          {[
            ['Pending requests', pending],
            ['Confirmed', confirmed],
            ['Total appointments', appointments.length],
            ['Unread notifications', unread],
          ].map(([label, value]) => (
            <div className="col-sm-6 col-lg-3" key={label}>
              <div className="card h-100 shadow-sm p-3">
                <div className="text-secondary small">{label}</div>
                <div className="display-6 fw-bold">{value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1">{doctor?.name || 'Doctor profile'}</h5>
              <p className="text-secondary mb-0">{doctor?.specialization || 'Doctor profile unavailable'}</p>
            </div>
            {doctor && (
              <button
                className={`btn ${doctor.isAvailable ? 'btn-success' : 'btn-secondary'}`}
                disabled={savingAvailability}
                onClick={() => saveAvailability(!doctor.isAvailable)}
              >
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </button>
            )}
          </div>
          {doctor && (
            <div className="mt-4">
              <h6 className="fw-bold">Weekly appointment schedule</h6>
              <p className="small text-secondary">
                Select the days and hours when patients may request appointments.
              </p>
              <div className="row g-2">
                {schedule.map((entry, index) => (
                  <div className="col-md-6" key={entry.day}>
                    <div className="border rounded p-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`availability-${entry.day}`}
                          checked={entry.enabled}
                          onChange={(event) => setSchedule((previous) => previous.map((item, itemIndex) => (
                            itemIndex === index ? { ...item, enabled: event.target.checked } : item
                          )))}
                        />
                        <label className="form-check-label fw-bold" htmlFor={`availability-${entry.day}`}>
                          {entry.day}
                        </label>
                      </div>
                      <div className="row g-2 mt-1">
                        <div className="col">
                          <label className="form-label small mb-1">Start</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={entry.start}
                            disabled={!entry.enabled}
                            onChange={(event) => setSchedule((previous) => previous.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, start: event.target.value } : item
                            )))}
                          />
                        </div>
                        <div className="col">
                          <label className="form-label small mb-1">End</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={entry.end}
                            disabled={!entry.enabled}
                            onChange={(event) => setSchedule((previous) => previous.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, end: event.target.value } : item
                            )))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary mt-3"
                disabled={savingAvailability}
                onClick={() => saveAvailability()}
              >
                {savingAvailability ? 'Saving schedule...' : 'Save schedule'}
              </button>
            </div>
          )}
        </div>
        <div className="card shadow-sm p-4">
          <h5 className="fw-bold mb-3">Appointments</h5>
          {appointments.length === 0 ? (
            <p className="text-secondary mb-0">No appointments assigned yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.date}</td>
                      <td>{appointment.time}</td>
                      <td>{appointment.patient?.fullName}<br /><small>{appointment.patient?.email}</small></td>
                      <td>{appointment.reason}</td>
                      <td><span className="badge text-bg-light">{appointment.status}</span></td>
                      <td>
                        {appointment.status === 'pending' && (
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, 'confirmed')}>Accept</button>
                            <button className="btn btn-sm btn-outline-danger" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, 'rejected')}>Reject</button>
                          </div>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button className="btn btn-sm btn-primary" disabled={busyId === appointment.id} onClick={() => changeStatus(appointment.id, 'completed')}>Complete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card shadow-sm p-4 mt-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 className="fw-bold mb-0">Recent notifications</h5>
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
          {notifications.length === 0 ? (
            <p className="text-secondary mb-0">No notifications yet.</p>
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
    </section>
  )
}
