import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
    },
    legacyId: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    hospital: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    availableDays: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    availableTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    about: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availabilitySchedule: {
      type: [{
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        slots: [{
          start: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
          end: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
        }],
      }],
      default: [],
    },
  },
  { timestamps: true },
)

export default mongoose.model('Doctor', doctorSchema)
