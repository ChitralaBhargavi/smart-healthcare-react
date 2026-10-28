import mongoose from 'mongoose'
import { config } from '../config.js'

function databaseError(message, cause) {
  const error = new Error(message)
  error.cause = cause
  return error
}

export async function connectDatabase() {
  if (!config.mongodbUri) {
    throw databaseError(
      'MongoDB is not configured. Set MONGODB_URI in backend/.env before starting the server.',
    )
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 10000,
    })
    console.log(`MongoDB connected to database "${config.dbName}".`)
  } catch (error) {
    throw databaseError(
      `MongoDB connection failed for database "${config.dbName}". Check the Atlas URI, network access, and credentials.`,
      error,
    )
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
