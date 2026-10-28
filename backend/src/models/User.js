import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    doctorSetupRequired: {
      type: Boolean,
      default: false,
    },
    doctorEmailVerifiedAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
