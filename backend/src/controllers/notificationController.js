import Notification from '../models/Notification.js'

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ notifications })
  } catch (error) {
    next(error)
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true },
    )
    if (!notification) return res.status(404).json({ error: 'Notification not found.' })
    return res.json({ notification })
  } catch (error) {
    next(error)
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true })
    res.json({ message: 'Notifications marked as read.' })
  } catch (error) {
    next(error)
  }
}
