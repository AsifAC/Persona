// Admin utility - Check if user is admin
// Configure your admin email in .env file: VITE_ADMIN_EMAIL

const parseEmailList = (value) => {
  if (!value) return []
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export const isAdmin = (user) => {
  if (!user) return false
  
  // Get admin email(s) from environment variables
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const adminEmails = parseEmailList(import.meta.env.VITE_ADMIN_EMAILS)
  
  // If no admin email is configured, return false for security
  if (!adminEmail && adminEmails.length === 0) {
    console.warn('Admin email not configured. Set VITE_ADMIN_EMAIL in .env file')
    return false
  }
  
  // Check if user's email matches admin email (case-insensitive)
  const userEmail = user.email?.toLowerCase().trim()
  const configuredAdminEmail = adminEmail?.toLowerCase().trim()

  if (!userEmail) return false
  if (configuredAdminEmail && userEmail === configuredAdminEmail) return true
  return adminEmails.includes(userEmail)
}

export const isVerifier = (user) => {
  if (!user) return false
  if (isAdmin(user)) return true
  const verifierEmails = parseEmailList(import.meta.env.VITE_VERIFIER_EMAILS)
  if (verifierEmails.length === 0) return false
  const userEmail = user.email?.toLowerCase().trim()
  return !!userEmail && verifierEmails.includes(userEmail)
}

