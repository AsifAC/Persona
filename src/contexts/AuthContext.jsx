// Authentication Context for managing user state
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { authService } from '../services/authService'
import { guestService } from '../services/guestService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    let subscription = null

    // Check for guest mode first
    if (guestService.isGuestMode()) {
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
        setLoading(false)
        return
      }
    }

    // Get initial session for authenticated users
    authService.getSession()
      .then(({ session, error }) => {
        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user ?? null)
        setIsGuest(false)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error in getSession:', error)
        setLoading(false)
      })

    // Listen for auth changes (only for authenticated users)
    if (!guestService.isGuestMode()) {
      try {
        const authStateResult = authService.onAuthStateChange(
          async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsGuest(false)
            setLoading(false)
          }
        )

        if (authStateResult?.data?.subscription) {
          subscription = authStateResult.data.subscription
        }
      } catch (error) {
        console.error('Error setting up auth state listener:', error)
        setLoading(false)
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
  }, [])

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

  const value = useMemo(() => ({
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
  }), [user, session, loading, isGuest])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

