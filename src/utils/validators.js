// Centralized validation rules using Regular Expressions (syllabus topic:
// Regex + Validation). Every form in the app (Appointments, Registration,
// Contact) imports from here instead of redefining patterns.

export const PATTERNS = {
  name: /^[A-Za-z\s.]{2,50}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/, // 10-digit Indian mobile number starting 6-9
}

export function validateName(value) {
  if (!value.trim()) return 'Full name is required.'
  if (!PATTERNS.name.test(value.trim())) return 'Enter a valid name (letters only, 2-50 chars).'
  return ''
}

export function validateEmail(value) {
  if (!value.trim()) return 'Email is required.'
  if (!PATTERNS.email.test(value.trim())) return 'Enter a valid email address.'
  return ''
}

export function validatePhone(value) {
  if (!value.trim()) return 'Phone number is required.'
  if (!PATTERNS.phone.test(value.trim())) return 'Enter a valid 10-digit phone number.'
  return ''
}

export function validateRequired(value, label) {
  if (!value || !value.toString().trim()) return `${label} is required.`
  return ''
}

export function validateNotPastDate(value) {
  if (!value) return 'Date is required.'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const chosen = new Date(value)
  if (chosen < today) return 'Please choose today or a future date.'
  return ''
}

export function validateAge(value) {
  if (!value.toString().trim()) return 'Age is required.'
  const age = Number(value)
  if (Number.isNaN(age) || age <= 0 || age > 120) return 'Enter a valid age.'
  return ''
}

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (!PASSWORD_PATTERN.test(value)) {
    return 'Password must be at least 6 characters and include a letter and a number.'
  }
  return ''
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}