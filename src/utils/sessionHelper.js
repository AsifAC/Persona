// Session Helper - Verify and refresh Supabase sessions
import { supabase } from '../config/supabase'

export const verifySession = async () => {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        valid: false,
        error: `Session error: ${sessionError.message}`,
        session: null
      }
    }

    if (!session) {
      return {
        valid: false,
        error: 'No active session found',
        session: null
      }
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // Token expired, try to refresh
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession) {
        return {
          valid: false,
          error: `Session expired and refresh failed: ${refreshError?.message || 'Unknown error'}`,
          session: null
        }
      }

      return {
        valid: true,
        error: null,
        session: refreshedSession
      }
    }

    // Verify user exists
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        valid: false,
        error: `User verification failed: ${userError?.message || 'User not found'}`,
        session: null
      }
    }

    return {
      valid: true,
      error: null,
      session,
      user
    }
  } catch (error) {
    return {
      valid: false,
      error: `Session verification error: ${error.message}`,
      session: null
    }
  }
}

export const ensureValidSession = async () => {
  const verification = await verifySession()
  
  if (!verification.valid) {
    throw new Error(verification.error || 'Session is not valid. Please sign out and sign back in.')
  }

  return verification.session
}

