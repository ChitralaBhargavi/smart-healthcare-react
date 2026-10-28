import bcrypt from 'bcryptjs'
import { connectDatabase, closeDatabase } from '../config/db.js'
import User from '../models/User.js'

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=')
    return [key, value.join('=')]
  }),
)

try {
  if (!args.fullName || !args.email || !args.password || args.password.length < 8) {
    throw new Error('Usage: npm run create:doctor -- --fullName="Dr. Name" --email=doctor@example.com --password="at-least-8-chars"')
  }

  await connectDatabase()
  const email = args.email.trim().toLowerCase()
  const existingUser = await User.findOne({ email })
  if (existingUser) throw new Error('A user with this email already exists.')

  await User.create({
    fullName: args.fullName.trim(),
    email,
    passwordHash: await bcrypt.hash(args.password, 12),
    role: 'doctor',
  })
  console.log(`Doctor account created for ${email}.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
