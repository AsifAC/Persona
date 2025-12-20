// Authentication Context for managing user state
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { authService } from '../services/authService'
import { guestService } from '../services/guestService'
import { AuthContext } from './authContextStore'

export const AuthProvider = ({ children }) => {
  const [initialGuestProfile] = useState(() => {
    if (!guestService.isGuestMode()) return null
    return guestService.getProfile() || null
  })
  const [user, setUser] = useState(() => {
    if (!initialGuestProfile) return null
    return {
      id: initialGuestProfile.id,
      email: initialGuestProfile.email,
      user_metadata: {
        first_name: initialGuestProfile.first_name,
        last_name: initialGuestProfile.last_name,
      },
    }
  })
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(() => !initialGuestProfile)
  const [isGuest, setIsGuest] = useState(() => !!initialGuestProfile)

  const applyAuthenticatedSession = (nextSession) => {
    setSession(nextSession)
    setUser(nextSession?.user ?? null)
    setIsGuest(false)
    setLoading(false)
  }

  const clearLoading = () => {
    setLoading(false)
  }

  useEffect(() => {
    let subscription = null

    if (initialGuestProfile) {
      return () => {}
    }

    // Get initial session for authenticated users
    authService.getSession()
      .then(({ session, error }) => {
        if (error) {
          console.error('Error getting session:', error)
        }
        applyAuthenticatedSession(session)
      })
      .catch((error) => {
        console.error('Error in getSession:', error)
        clearLoading()
      })

    // Listen for auth changes (only for authenticated users)
    if (!guestService.isGuestMode()) {
      try {
        const authStateResult = authService.onAuthStateChange(
          async (event, session) => {
            applyAuthenticatedSession(session)
          }
        )

        if (authStateResult?.data?.subscription) {
          subscription = authStateResult.data.subscription
        }
      } catch (error) {
        console.error('Error setting up auth state listener:', error)
      }
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing:', error)
        }
      }
    }
  }, [initialGuestProfile])

  const signUp = async (email, password, firstName, lastName) => {
    setLoading(true)
    const { data, error } = await authService.signUp(email, password, firstName, lastName)
    setLoading(false)
    return { data, error }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    const { data, error } = await authService.signIn(email, password)
    setLoading(false)
    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    if (isGuest) {
      guestService.disableGuestMode()
      setUser(null)
      setIsGuest(false)
      setLoading(false)
      return { error: null }
    } else {
      const { error } = await authService.signOut()
      setUser(null)
      setIsGuest(false)
      setLoading(false)
      return { error }
    }
  }

  const signInAsGuest = () => {
    setLoading(true)
    guestService.enableGuestMode()
    const guestProfile = guestService.getProfile()
    if (guestProfile) {
      setUser({
        id: guestProfile.id,
        email: guestProfile.email,
        user_metadata: {
          first_name: guestProfile.first_name,
          last_name: guestProfile.last_name,
        },
      })
      setIsGuest(true)
      setSession(null)
    }
    setLoading(false)
  }

  const signInWithOAuth = async (provider) => {
    setLoading(true)
    const { data, error } = await authService.signInWithOAuth(provider)
    setLoading(false)
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    signInWithOAuth,
    isAuthenticated: !!user,
    isGuest,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

