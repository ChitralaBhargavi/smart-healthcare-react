import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test, { after, before, describe } from 'node:test'

const testMongoUri = process.env.TEST_MONGODB_URI?.trim() || ''
const testDbName = process.env.TEST_DB_NAME?.trim() || 'smartcare_test'

function assertSafeTestDatabase() {
  if (!testMongoUri) {
    throw new Error('BLOCKED: set TEST_MONGODB_URI to a dedicated test MongoDB instance before running integration tests.')
  }

  const parsed = new URL(testMongoUri)
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  if (!testDbName.toLowerCase().includes('test') || !databaseName.toLowerCase().includes('test')) {
    throw new Error('BLOCKED: integration tests require a database name containing "test".')
  }
  if (databaseName.toLowerCase() === 'smartcare') {
    throw new Error('BLOCKED: integration tests refuse the ordinary smartcare database.')
  }
}

assertSafeTestDatabase()
process.env.MONGODB_URI = testMongoUri
process.env.DB_NAME = testDbName
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'integration-only-secret-not-for-production'
process.env.NODE_ENV = 'test'

const [{ app }, { closeDatabase, connectDatabase }, { default: User }, { default: Doctor },
  { default: Appointment }, { default: Notification }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/models/User.js'),
  import('../src/models/Doctor.js'),
  import('../src/models/Appointment.js'),
  import('../src/models/Notification.js'),
])
const { default: bcrypt } = await import('bcryptjs')

const marker = `integration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const patients = []
let doctorUser
let doctor
let secondDoctorUser
let secondDoctor
let server
let baseUrl

function futureMonday() {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7
  date.setUTCDate(date.getUTCDate() + daysUntilMonday)
  return date.toISOString().slice(0, 10)
}

function futureTuesday() {
  const date = new Date(`${futureMonday()}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

async function request(path, options = {}, cookie = '') {
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) }
  if (cookie) headers.cookie = cookie
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  const setCookie = response.headers.get('set-cookie') || ''
  return { response, body, cookie: setCookie.split(';')[0] }
}

async function createPatient(index) {
  const email = `${marker}-patient-${index}@example.test`
  const result = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: `Integration Patient ${index}`,
      email,
      password: 'PatientTest123!',
    }),
  })
  assert.equal(result.response.status, 201)
  patients.push(email)
  return result.cookie
}

describe('HTTP integration workflow', () => {
  before(async () => {
    await connectDatabase()
    const passwordHash = await bcrypt.hash('DoctorTest123!', 4)
    doctorUser = await User.create({
      fullName: 'Integration Doctor',
      email: `${marker}-doctor@example.test`,
      passwordHash,
      role: 'doctor',
    })
    doctor = await Doctor.create({
      user: doctorUser._id,
      legacyId: 900000 + Math.floor(Math.random() * 9999),
      name: 'Integration Doctor',
      specialization: 'Testing',
      experience: 5,
      qualification: 'MD',
      hospital: 'Integration Hospital',
      fee: 100,
      rating: 5,
      availableDays: 'Monday',
      availableTime: '09:00 - 12:00',
      about: 'Integration test doctor',
      image: '/test.png',
      isAvailable: true,
      availabilitySchedule: [{ day: 'Monday', slots: [{ start: '09:00', end: '12:00' }] }],
    })
    secondDoctorUser = await User.create({
      fullName: 'Second Integration Doctor',
      email: `${marker}-second-doctor@example.test`,
      passwordHash,
      role: 'doctor',
    })
    secondDoctor = await Doctor.create({
      user: secondDoctorUser._id,
      legacyId: 910000 + Math.floor(Math.random() * 9999),
      name: 'Second Integration Doctor',
      specialization: 'Testing',
      experience: 6,
      qualification: 'MD',
      hospital: 'Second Integration Hospital',
      fee: 100,
      rating: 5,
      availableDays: 'Monday',
      availableTime: '09:00 - 12:00',
      about: 'Second integration test doctor',
      image: '/test.png',
      isAvailable: true,
      availabilitySchedule: [{ day: 'Monday', slots: [{ start: '09:00', end: '12:00' }] }],
    })
    server = createServer(app)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    const userIds = [doctorUser?._id, secondDoctorUser?._id].filter(Boolean)
    const createdUsers = await User.find({ email: { $in: patients } }).select('_id')
    userIds.push(...createdUsers.map((user) => user._id))
    await Promise.all([
      Appointment.deleteMany({ $or: [{ user: { $in: userIds } }, { doctor: doctor?._id }] }),
      Notification.deleteMany({ recipient: { $in: userIds } }),
      Doctor.deleteOne({ _id: doctor?._id }),
      Doctor.deleteOne({ _id: secondDoctor?._id }),
      User.deleteMany({ _id: { $in: userIds } }),
    ])
    if (server) await new Promise((resolve) => server.close(resolve))
    await closeDatabase()
  })

  test('auth, ownership, availability, conflicts, status, cancellation, and notifications', async () => {
    const patientCookie = await createPatient(1)
    const secondPatientCookie = await createPatient(2)
    const doctorLogin = await request('/api/auth/doctor-login', {
      method: 'POST',
      body: JSON.stringify({ email: doctorUser.email, password: 'DoctorTest123!' }),
    })
    assert.equal(doctorLogin.response.status, 200)
    const secondDoctorLogin = await request('/api/auth/doctor-login', {
      method: 'POST',
      body: JSON.stringify({ email: secondDoctorUser.email, password: 'DoctorTest123!' }),
    })
    assert.equal(secondDoctorLogin.response.status, 200)

    const patientCannotListDoctorAppointments = await request('/api/appointments/doctor', {}, patientCookie)
    assert.equal(patientCannotListDoctorAppointments.response.status, 403)
    const doctorCannotListPatientAppointments = await request('/api/appointments/my', {}, doctorLogin.cookie)
    assert.equal(doctorCannotListPatientAppointments.response.status, 403)

    const doctorCannotListAnotherDoctorsAppointments = await request('/api/appointments/doctor', {}, secondDoctorLogin.cookie)
    assert.equal(doctorCannotListAnotherDoctorsAppointments.response.status, 200)
    assert.equal(doctorCannotListAnotherDoctorsAppointments.body.appointments.length, 0)

    const doctorCannotUpdateAnotherDoctorsProfile = await request(`/api/doctors/${doctor._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ hospital: 'Unauthorized update' }),
    }, secondDoctorLogin.cookie)
    assert.equal(doctorCannotUpdateAnotherDoctorsProfile.response.status, 404)

    const patientCannotUpdateAvailability = await request(`/api/doctors/${doctor._id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({
        isAvailable: true,
        availabilitySchedule: [{ day: 'Monday', slots: [{ start: '09:00', end: '12:00' }] }],
      }),
    }, patientCookie)
    assert.equal(patientCannotUpdateAvailability.response.status, 403)

    const disableMonday = await request(`/api/doctors/${doctor._id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({
        isAvailable: true,
        availabilitySchedule: [{ day: 'Tuesday', slots: [{ start: '09:00', end: '12:00' }] }],
      }),
    }, doctorLogin.cookie)
    assert.equal(disableMonday.response.status, 200)
    assert.deepEqual(disableMonday.body.availabilitySchedule.map((entry) => entry.day), ['Tuesday'])

    const date = futureMonday()
    const disabledWeekday = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date, time: '09:00', reason: 'Disabled weekday' }),
    }, patientCookie)
    assert.equal(disabledWeekday.response.status, 409)

    const restoreMonday = await request(`/api/doctors/${doctor._id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({
        isAvailable: true,
        availabilitySchedule: [{ day: 'Monday', slots: [{ start: '09:00', end: '12:00' }] }],
      }),
    }, doctorLogin.cookie)
    assert.equal(restoreMonday.response.status, 200)

    const payload = JSON.stringify({ doctorId: doctor._id.toString(), date, time: '09:00', reason: 'Integration test' })
    const concurrent = await Promise.all([
      request('/api/appointments', { method: 'POST', body: payload }, patientCookie),
      request('/api/appointments', { method: 'POST', body: payload }, secondPatientCookie),
    ])
    assert.equal(concurrent.filter(({ response }) => response.status === 201).length, 1)
    assert.equal(concurrent.filter(({ response }) => response.status === 409).length, 1)

    const outsideSchedule = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date, time: '13:00', reason: 'Invalid slot' }),
    }, patientCookie)
    assert.equal(outsideSchedule.response.status, 409)

    const invalidInterval = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId: doctor._id.toString(), date: futureTuesday(), time: '09:15', reason: 'Invalid interval' }),
    }, patientCookie)
    assert.equal(invalidInterval.response.status, 400)

    const patientAppointments = await request('/api/appointments/my', {}, patientCookie)
    assert.equal(patientAppointments.response.status, 200)
    assert.equal(patientAppointments.body.appointments.length, 1)
    const appointmentId = patientAppointments.body.appointments[0].id

    const secondDoctorAppointments = await request('/api/appointments/doctor', {}, secondDoctorLogin.cookie)
    assert.equal(secondDoctorAppointments.response.status, 200)
    assert.equal(secondDoctorAppointments.body.appointments.length, 0)

    const secondDoctorCannotUpdateAppointment = await request(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
    }, secondDoctorLogin.cookie)
    assert.equal(secondDoctorCannotUpdateAppointment.response.status, 404)

    const savedAvailability = await request(`/api/doctors/${doctor._id}/availability?date=${date}`)
    assert.equal(savedAvailability.response.status, 200)
    assert.deepEqual(savedAvailability.body.bookedTimes, ['09:00'])

    const doctorAppointments = await request('/api/appointments/doctor', {}, doctorLogin.cookie)
    assert.equal(doctorAppointments.response.status, 200)
    assert.equal(doctorAppointments.body.appointments.length, 1)

    const confirmed = await request(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    }, doctorLogin.cookie)
    assert.equal(confirmed.response.status, 200)

    const patientNotifications = await request('/api/notifications', {}, patientCookie)
    assert.equal(patientNotifications.response.status, 200)
    assert.ok(patientNotifications.body.notifications.length > 0)
    const notificationId = patientNotifications.body.notifications[0]._id
    const markedRead = await request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }, patientCookie)
    assert.equal(markedRead.response.status, 200)

    const cancelled = await request(`/api/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
    }, patientCookie)
    assert.equal(cancelled.response.status, 200)

    const logout = await request('/api/auth/logout', { method: 'POST' }, patientCookie)
    assert.equal(logout.response.status, 200)
    const protectedAfterLogout = await request('/api/appointments/my', {}, logout.cookie)
    assert.equal(protectedAfterLogout.response.status, 401)
  })
})
