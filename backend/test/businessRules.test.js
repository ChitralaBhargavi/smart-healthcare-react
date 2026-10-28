import test from 'node:test'
import assert from 'node:assert/strict'
import { createSetupToken, hashSetupToken, validateSetupPassword } from '../src/utils/doctorSetup.js'
import {
  httpError,
  isValidStatusTransition,
  isValidAppointmentTime,
  isWithinAvailability,
  parseAppointmentDate,
  validateAvailabilitySchedule,
} from '../src/utils/appointment.js'

test('setup tokens are random and only their hash is deterministic', () => {
  const first = createSetupToken()
  const second = createSetupToken()
  assert.notEqual(first.token, second.token)
  assert.equal(hashSetupToken(first.token), first.tokenHash)
  assert.notEqual(first.token, first.tokenHash)
})

test('setup password rules reject weak passwords', () => {
  assert.match(validateSetupPassword('short'), /12 characters/)
  assert.match(validateSetupPassword('alllowercasepassword'), /uppercase/)
  assert.equal(validateSetupPassword('StrongSetupPass123!'), '')
})

test('availability schedules reject invalid ranges and duplicate days', () => {
  assert.throws(
    () => validateAvailabilitySchedule([{ day: 'Monday', slots: [{ start: '18:00', end: '09:00' }] }]),
    /end after it starts/,
  )
  assert.throws(
    () => validateAvailabilitySchedule([
      { day: 'Monday', slots: [{ start: '09:00', end: '10:00' }] },
      { day: 'Monday', slots: [{ start: '11:00', end: '12:00' }] },
    ]),
    /appear only once/,
  )
})

test('appointment dates and availability are enforced by shared rules', () => {
  assert.throws(() => parseAppointmentDate('2000-01-01'), (error) => error.statusCode === 400)
  const doctor = {
    isAvailable: true,
    availabilitySchedule: [{ day: 'Monday', slots: [{ start: '09:00', end: '12:00' }] }],
  }
  assert.equal(isWithinAvailability(doctor, new Date('2099-01-05T00:00:00.000Z'), '09:00'), true)
  assert.equal(isWithinAvailability(doctor, new Date('2099-01-05T00:00:00.000Z'), '13:00'), false)
  assert.equal(isWithinAvailability({ ...doctor, isAvailable: false }, new Date('2099-01-05T00:00:00.000Z'), '09:00'), false)
})

test('appointment times use the configured 30-minute interval', () => {
  assert.equal(isValidAppointmentTime('09:00'), true)
  assert.equal(isValidAppointmentTime('09:30'), true)
  assert.equal(isValidAppointmentTime('09:15'), false)
  assert.equal(isValidAppointmentTime('invalid'), false)
})

test('appointment status transitions only move forward through the workflow', () => {
  assert.equal(isValidStatusTransition('pending', 'confirmed'), true)
  assert.equal(isValidStatusTransition('confirmed', 'completed'), true)
  assert.equal(isValidStatusTransition('confirmed', 'pending'), false)
  assert.equal(isValidStatusTransition('completed', 'confirmed'), false)
  assert.equal(isValidStatusTransition('rejected', 'confirmed'), false)
})

test('business errors retain status codes', () => {
  assert.equal(httpError(409, 'conflict').statusCode, 409)
})
