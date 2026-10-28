import { Router } from 'express'
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getMyDoctor,
  listDoctors,
  updateDoctor,
} from '../controllers/doctorController.js'
import { authenticateUser, requireRole } from '../middleware/authenticateUser.js'
import { getAvailability, updateAvailability } from '../controllers/availabilityController.js'

const router = Router()

// Doctor CRUD writes require a doctor session; complete profile ownership rules
// remain part of the future profile-management phase.
router.get('/', listDoctors)
router.get('/me', authenticateUser, requireRole('doctor'), getMyDoctor)
router.get('/:id', getDoctor)
router.get('/:id/availability', getAvailability)
router.patch('/:id/availability', authenticateUser, requireRole('doctor'), updateAvailability)
router.post('/', authenticateUser, requireRole('doctor'), createDoctor)
router.patch('/:id', authenticateUser, requireRole('doctor'), updateDoctor)
router.delete('/:id', authenticateUser, requireRole('doctor'), deleteDoctor)

export default router
