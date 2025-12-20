# Security Configuration Guide

## Leaked Password Protection (Have I Been Pwned)

### Overview
Your Persona app is configured to work with Supabase's Have I Been Pwned (HIBP) integration to prevent users from using compromised passwords. This protection blocks passwords that have been exposed in known data breaches.

### Enable HIBP Protection in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Access Authentication Settings**
   - Go to **Authentication** → **Settings** (or **Security**)
   - Look for **"Leaked Password Protection"** or **"Have I Been Pwned"** section

3. **Enable the Feature**
   - Toggle **"Enable leaked password protection"** to ON
   - Save the changes

### How It Works

- **Privacy-Preserving**: Supabase uses k-Anonymity, so your actual passwords are never sent to HIBP
- **Automatic Checking**: Passwords are checked during:
  - User registration (sign up)
  - Password changes/updates
- **User-Friendly Messages**: The app displays clear error messages when a compromised password is detected

### User Experience

When a user tries to use a compromised password, they will see:
> "This password was found in a known data breach. Please choose a different, more secure password."

This message appears in:
- **Registration form** (`/register`)
- **Password change form** (`/profile`)

### Testing

After enabling HIBP protection, test with a known-breached password:
1. Try registering with a common compromised password (e.g., "password123")
2. Verify the error message displays correctly
3. Test password update flow in Profile page

### Additional Security Recommendations

1. **Password Policy** (Already Implemented)
   - Minimum 6 characters required
   - Password confirmation validation
   - Clear error messaging

2. **Multi-Factor Authentication (MFA)**
   - Consider enabling MFA in Supabase Auth settings for additional security
   - Recommended for admin accounts or sensitive operations

3. **Rate Limiting**
   - Supabase automatically implements rate limiting on auth endpoints
   - Monitor auth logs in Supabase dashboard for suspicious activity

4. **Session Management**
   - Sessions are managed by Supabase Auth
   - Automatic token refresh and secure cookie handling

### Monitoring

- Check Supabase **Authentication** → **Logs** for failed password attempts
- Monitor for patterns indicating brute-force attacks
- Review user sign-up patterns for anomalies

### Notes

- HIBP checks may add minimal latency (~100-200ms) to password validation
- The app handles this gracefully with loading states
- If you need offline checks, consider implementing an internal compromised-password service

## Related Files

- `src/components/Register.jsx` - Registration with HIBP error handling
- `src/pages/Profile.jsx` - Password change with HIBP error handling
- `src/services/authService.js` - Authentication service layer

