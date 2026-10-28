import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment_created', 'appointment_status', 'availability_changed'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
