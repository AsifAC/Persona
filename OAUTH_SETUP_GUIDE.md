# OAuth Setup Guide - Persona Project

This guide will help you configure OAuth providers (Google, GitHub, Apple, Microsoft) in your Supabase project.

## 🎯 Quick Setup Checklist

- [ ] Enable OAuth providers in Supabase Dashboard
- [ ] Configure redirect URLs
- [ ] Set up OAuth apps with each provider
- [ ] Add credentials to Supabase
- [ ] Test each provider

---

## 📋 Step-by-Step Instructions

### 1. Access Supabase Authentication Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `ashfywegxqxbxjnuzpiz`
3. Navigate to **Authentication** → **Providers** in the left sidebar

---

## 🔵 Google OAuth Setup

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     ```
     https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - **Copy the Client ID and Client Secret**

### Step 2: Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
4. Click **Save**

---

## 🐙 GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `Persona`
   - **Homepage URL**: `http://localhost:5173` (or your production URL)
   - **Authorization callback URL**:
     ```
     https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. **Copy the Client ID**
6. Click **Generate a new client secret**
7. **Copy the Client Secret** (you'll only see it once!)

### Step 2: Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **GitHub** and toggle it **ON**
3. Enter:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
4. Click **Save**

---

## 🍎 Apple OAuth Setup

### Step 1: Create Apple Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → Click **+** → Select **Services IDs**
4. Register a new Service ID:
   - **Description**: `Persona`
   - **Identifier**: `com.persona.app` (use your own)
5. Enable **Sign in with Apple**
6. Configure:
   - **Primary App ID**: Select your app
   - **Website URLs**:
     - **Domains**: `ashfywegxqxbxjnuzpiz.supabase.co`
     - **Return URLs**: `https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback`
7. Save and continue

### Step 2: Create Apple Key

1. Go to **Keys** → Click **+**
2. Enter **Key Name**: `Persona Sign In`
3. Enable **Sign in with Apple**
4. Click **Configure** → Select your Primary App ID
5. Click **Save** → **Continue** → **Register**
6. **Download the key file** (.p8) - you can only download once!
7. Note the **Key ID**

### Step 3: Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and toggle it **ON**
3. Enter:
   - **Services ID**: (the identifier you created, e.g., `com.persona.app`)
   - **Team ID**: (found in Apple Developer account → Membership)
   - **Key ID**: (from the key you created)
   - **Private Key**: (contents of the .p8 file you downloaded)
4. Click **Save**

**Note**: Apple requires a paid Apple Developer account ($99/year)

---

## 🔷 Microsoft (Azure AD) OAuth Setup

### Step 1: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `Persona`
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**:
     - Type: **Web**
     - URI: `https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback`
5. Click **Register**
6. **Copy the Application (client) ID**
7. Go to **Certificates & secrets** → **New client secret**
8. **Copy the Value** (secret) - you'll only see it once!

### Step 2: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add:
   - `openid`
   - `email`
   - `profile`
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

### Step 3: Configure in Supabase

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Azure** and toggle it **ON**
3. Enter:
   - **Client ID**: (Application ID from Azure)
   - **Client Secret**: (from Azure)
   - **Tenant ID**: (found in Azure AD → Overview → Tenant ID)
4. Click **Save**

---

## 🔧 Configure Redirect URLs

### Important: Add Your App URLs

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:5173/dashboard
   http://localhost:5173/*
   https://your-production-domain.com/dashboard
   https://your-production-domain.com/*
   ```

---

## ✅ Testing OAuth Providers

### Test Each Provider

1. **Start your dev server**: `npm run dev`
2. Go to `/login` or `/register`
3. Click each OAuth button:
   - ✅ **Google** - Should redirect to Google sign-in
   - ✅ **GitHub** - Should redirect to GitHub authorization
   - ✅ **Apple** - Should redirect to Apple sign-in
   - ✅ **Microsoft** - Should redirect to Microsoft sign-in

### Expected Flow

1. User clicks OAuth button
2. Redirects to provider's sign-in page
3. User authorizes
4. Redirects back to your app at `/dashboard`
5. User is automatically signed in

---

## 🔒 Security Best Practices

1. ✅ **Never commit OAuth secrets** to git
2. ✅ **Use environment variables** for sensitive data (if needed server-side)
3. ✅ **Keep redirect URLs secure** - only add trusted domains
4. ✅ **Rotate secrets regularly** - especially if compromised
5. ✅ **Monitor OAuth usage** in Supabase Dashboard

---

## 🐛 Troubleshooting

### Common Issues

**"Redirect URI mismatch"**
- ✅ Check redirect URL in provider matches exactly: `https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback`
- ✅ No trailing slashes
- ✅ Use HTTPS (not HTTP)

**"Invalid client credentials"**
- ✅ Verify Client ID and Secret are correct
- ✅ Check for extra spaces when copying
- ✅ Regenerate secret if needed

**"Provider not enabled"**
- ✅ Make sure provider is toggled ON in Supabase
- ✅ Check that credentials are saved

**Apple-specific issues**
- ✅ Requires paid Apple Developer account
- ✅ Service ID must be configured correctly
- ✅ Private key must be in correct format

---

## 📝 Provider-Specific Notes

### Google
- ✅ Free to use
- ✅ Requires Google Cloud project
- ✅ Fast approval process

### GitHub
- ✅ Free to use
- ✅ Great for developer-focused apps
- ✅ Instant setup

### Apple
- ⚠️ Requires $99/year Apple Developer account
- ⚠️ More complex setup
- ✅ Required for iOS apps

### Microsoft
- ✅ Free for basic use
- ✅ Good for enterprise/B2B apps
- ✅ Supports Azure AD and personal Microsoft accounts

---

## 🎉 You're Done!

Once configured, users can sign in with:
- ✅ Email/Password (already working)
- ✅ Google
- ✅ GitHub
- ✅ Apple
- ✅ Microsoft
- ✅ Guest mode (local storage)

All OAuth users will automatically:
- ✅ Have profiles created in `public.profiles`
- ✅ Be able to use all app features
- ✅ Have their data secured with RLS

---

## 📞 Need Help?

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login)
- Check Supabase Dashboard → Authentication → Logs for errors

