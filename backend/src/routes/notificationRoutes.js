import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js'
import { authenticateUser } from '../middleware/authenticateUser.js'

const router = Router()
router.use(authenticateUser)
router.get('/', listNotifications)
router.patch('/:id/read', markNotificationRead)
router.patch('/read-all', markAllNotificationsRead)

export default router
