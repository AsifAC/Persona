// Authentication Context for managing user state
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { authService } from '../services/authService'
import { guestService } from '../services/guestService'
import { AuthContext } from './authContextStore'

export const AuthProvider = ({ children }) => {
  const [initialGuestProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

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

    // Guest mode disabled for now; clear any persisted guest state.
    guestService.disableGuestMode()

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
    const { error } = await authService.signOut()
    setUser(null)
    setIsGuest(false)
    setLoading(false)
    return { error }
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
    signInWithOAuth,
    isAuthenticated: !!user,
    isGuest,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

