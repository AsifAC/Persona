// Supabase Configuration
// Replace these values with your Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api

import { createClient } from '@supabase/supabase-js'

// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'

// Use actual values if configured, otherwise use placeholders
const finalUrl = (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co'
const finalKey = (supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') 
  ? supabaseAnonKey 
  : 'placeholder-key'

// Only show warnings if values are not configured
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Supabase URL not configured. Please set VITE_SUPABASE_URL in your .env file')
  console.warn('⚠️ Authentication will not work until Supabase is configured')
} else {
  console.log('✅ Supabase URL configured')
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE' || supabaseAnonKey === 'placeholder-key') {
  console.warn('⚠️ Supabase Anon Key not configured. Please set VITE_SUPABASE_ANON_KEY in your .env file')
  console.warn('⚠️ Authentication will not work until Supabase is configured')
} else {
  console.log('✅ Supabase Anon Key configured')
}

// Create Supabase client with auto-refresh enabled
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

