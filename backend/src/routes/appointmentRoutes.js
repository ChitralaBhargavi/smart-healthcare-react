import { Router } from 'express'
import {
  cancelMyAppointment,
  createAppointment,
  listDoctorAppointments,
  listMyAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js'
import { authenticateUser, requireRole } from '../middleware/authenticateUser.js'

const router = Router()
router.use(authenticateUser)
router.post('/', requireRole('patient'), createAppointment)
router.get('/my', requireRole('patient'), listMyAppointments)
router.get('/doctor', requireRole('doctor'), listDoctorAppointments)
router.patch('/:id/status', requireRole('doctor'), updateAppointmentStatus)
router.patch('/:id/cancel', requireRole('patient'), cancelMyAppointment)

export default router
