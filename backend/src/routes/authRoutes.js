import { Router } from 'express'
import {
  getCurrentUser,
  completeDoctorSetup,
  loginDoctor,
  loginPatient,
  logout,
  registerPatient,
  requestDoctorSetup,
} from '../controllers/authController.js'
import { authenticateUser } from '../middleware/authenticateUser.js'

const router = Router()

router.post('/register', registerPatient)
router.post('/login', loginPatient)
router.post('/doctor-login', loginDoctor)
router.post('/doctor/setup/request', requestDoctorSetup)
router.post('/doctor/setup/complete', completeDoctorSetup)
router.post('/logout', logout)
router.get('/me', authenticateUser, getCurrentUser)

export default router
