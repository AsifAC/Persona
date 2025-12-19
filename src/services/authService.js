// Authentication Service using Supabase Auth
import { supabase } from '../config/supabase'

export const authService = {
  // Sign up a new user
  async signUp(email, password, firstName = '', lastName = '') {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || supabaseUrl.includes('placeholder')) {
        return {
          data: null,
          error: {
            message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. See README.md for setup instructions.'
          }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return {
          data: null,
          error: {
            message: 'Unable to connect to Supabase. Please check your VITE_SUPABASE_URL and ensure your Supabase project is active.'
          }
        }
      }
      return { data: null, error }
    }
  },

  // Sign in an existing user
  async signIn(email, password) {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || supabaseUrl.includes('placeholder')) {
        return {
          data: null,
          error: {
            message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. See README.md for setup instructions.'
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return {
          data: null,
          error: {
            message: 'Unable to connect to Supabase. Please check your VITE_SUPABASE_URL and ensure your Supabase project is active.'
          }
        }
      }
      return { data: null, error }
    }
  },

  // Sign out the current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  },

  // Get the current user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Get session error:', error)
        return { session: null, error }
      }
      return { session, error: null }
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null, error }
    }
  },

  // Get the current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Get user error:', error)
        return { user: null, error }
      }
      return { user, error: null }
    } catch (error) {
      console.error('Get user error:', error)
      return { user: null, error }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    try {
      return supabase.auth.onAuthStateChange(callback)
    } catch (error) {
      console.error('Error setting up auth state change listener:', error)
      // Return a mock subscription object to prevent errors
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/reset-password`,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { data: null, error }
    }
  },

  // Sign in with OAuth provider
  async signInWithOAuth(provider, options = {}) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${globalThis.location.origin}/dashboard`,
          ...options,
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error(`Sign in with ${provider} error:`, error)
      return { data: null, error }
    }
  },
}

