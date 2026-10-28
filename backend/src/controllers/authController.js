import bcrypt from 'bcryptjs'
import Doctor from '../models/Doctor.js'
import DoctorSetupToken from '../models/DoctorSetupToken.js'
import User from '../models/User.js'
import { config } from '../config.js'
import { createSetupToken, hashSetupToken, validateSetupPassword } from '../utils/doctorSetup.js'
import { sendDoctorSetupEmail } from '../utils/mail.js'
import { enforceRateLimit } from '../utils/rateLimit.js'
import {
  createAuthToken,
  publicUser,
  setAuthCookie,
} from '../utils/auth.js'

function authError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8
}

async function signInUser(user, password, expectedRole) {
  if (expectedRole && user.role !== expectedRole) {
    throw authError(401, 'Invalid email or password.')
  }

  if (expectedRole === 'doctor' && (user.doctorSetupRequired || !user.passwordHash)) {
    throw authError(401, 'Doctor account setup is not complete.')
  }
  const passwordMatches = user.passwordHash && await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw authError(401, 'Invalid email or password.')
  }

  const token = createAuthToken(user)
  return { token, user: publicUser(user) }
}

export async function registerPatient(req, res, next) {
  try {
    const { fullName, email, phone, age, password } = req.body
    const normalizedEmail = normalizeEmail(email)

    if (!fullName?.trim() || !normalizedEmail || !validatePassword(password)) {
      throw authError(400, 'Full name, email, and a password of at least 8 characters are required.')
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) throw authError(409, 'An account with this email already exists.')

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : undefined,
      age: age === undefined || age === '' ? undefined : Number(age),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'patient',
    })

    const { token } = await signInUser(
      await User.findById(user._id).select('+passwordHash'),
      password,
      'patient',
    )
    setAuthCookie(res, token)
    return res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

export async function loginPatient(req, res, next) {
  return loginWithRole(req, res, next, 'patient')
}

export async function loginDoctor(req, res, next) {
  return loginWithRole(req, res, next, 'doctor')
}

async function loginWithRole(req, res, next, role) {
  try {
    const email = normalizeEmail(req.body.email)
    if (!email || typeof req.body.password !== 'string') {
      throw authError(400, 'Email and password are required.')
    }

    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user) throw authError(401, 'Invalid email or password.')

    const { token, user: safeUser } = await signInUser(user, req.body.password, role)
    setAuthCookie(res, token)
    return res.json({ user: safeUser })
  } catch (error) {
    return next(error)
  }
}

export async function getCurrentUser(req, res) {
  return res.json({ user: publicUser(req.user) })
}

export function logout(req, res) {
  res.clearCookie(config.authCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  })
  return res.json({ message: 'Logged out successfully.' })
}

export async function requestDoctorSetup(req, res, next) {
  try {
    enforceRateLimit(req, 'doctor-setup-request', 5, 15 * 60 * 1000)
    const email = normalizeEmail(req.body.email)
    const genericResponse = {
      message: 'If the doctor account is eligible, a password setup email will be sent.',
    }
    if (!email) return res.json(genericResponse)

    const user = await User.findOne({ email, role: 'doctor' })
    if (!user || !user.doctorSetupRequired) return res.json(genericResponse)
    const doctor = await Doctor.findOne({ user: user._id }).select('name')
    if (!doctor) return res.json(genericResponse)

    const { token, tokenHash } = createSetupToken()
    await DoctorSetupToken.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          user: user._id,
          tokenHash,
          expiresAt: new Date(Date.now() + config.setupTokenMinutes * 60 * 1000),
        },
        $unset: { usedAt: 1 },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
    const setupUrl = `${config.clientOrigin}/doctor/setup?token=${encodeURIComponent(token)}`
    const delivery = await sendDoctorSetupEmail({
      recipient: user.email,
      doctorName: doctor.name,
      setupUrl,
    })
    if (delivery.mode === 'development-preview') {
      return res.json({ ...genericResponse, developmentPreview: delivery.setupUrl })
    }
    return res.json(genericResponse)
  } catch (error) {
    return next(error)
  }
}

export async function completeDoctorSetup(req, res, next) {
  try {
    enforceRateLimit(req, 'doctor-setup-complete', 10, 15 * 60 * 1000)
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : ''
    const passwordError = validateSetupPassword(req.body.password)
    if (!token || passwordError) {
      throw authError(400, passwordError || 'A valid setup token is required.')
    }

    const setupToken = await DoctorSetupToken.findOne({
      tokenHash: hashSetupToken(token),
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
    if (!setupToken) throw authError(400, 'This setup link is invalid or expired.')

    const user = await User.findOne({ _id: setupToken.user, role: 'doctor', doctorSetupRequired: true })
    if (!user || !(await Doctor.exists({ user: user._id }))) {
      throw authError(400, 'This setup link is invalid or expired.')
    }
    user.passwordHash = await bcrypt.hash(req.body.password, 12)
    user.doctorSetupRequired = false
    user.doctorEmailVerifiedAt = new Date()
    await user.save()
    setupToken.usedAt = new Date()
    await setupToken.save()
    return res.json({ message: 'Doctor account setup completed. You can now log in.' })
  } catch (error) {
    return next(error)
  }
}
