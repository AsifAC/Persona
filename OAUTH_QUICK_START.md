# OAuth Quick Start - What to Enable in Supabase

## 🚀 Quick Steps

### 1. Go to Supabase Dashboard
👉 [https://app.supabase.com/project/ashfywegxqxbxjnuzpiz/auth/providers](https://app.supabase.com/project/ashfywegxqxbxjnuzpiz/auth/providers)

### 2. Enable Each Provider

Navigate to: **Authentication** → **Providers**

#### ✅ Google
1. Toggle **Google** ON
2. Add Client ID and Secret (from Google Cloud Console)
3. Click **Save**

#### ✅ GitHub  
1. Toggle **GitHub** ON
2. Add Client ID and Secret (from GitHub Developer Settings)
3. Click **Save**

#### ✅ Apple
1. Toggle **Apple** ON
2. Add Service ID, Team ID, Key ID, and Private Key
3. Click **Save**

#### ✅ Azure (Microsoft)
1. Toggle **Azure** ON
2. Add Client ID, Client Secret, and Tenant ID
3. Click **Save**

### 3. Configure Redirect URLs

Go to: **Authentication** → **URL Configuration**

Add these redirect URLs:
```
http://localhost:5173/dashboard
http://localhost:5173/*
```

(Add your production URLs when deploying)

---

## 📋 Required Redirect URI for All Providers

**Important**: When setting up OAuth apps with each provider, use this exact redirect URI:

```
https://ashfywegxqxbxjnuzpiz.supabase.co/auth/v1/callback
```

---

## ✅ What's Already Done in Code

- ✅ OAuth buttons added to Login and Register pages
- ✅ OAuth authentication service methods created
- ✅ Auth context updated with OAuth support
- ✅ Database trigger ready for OAuth users

---

## 🧪 Test After Setup

1. Start your app: `npm run dev`
2. Go to `/login` or `/register`
3. Click each OAuth button
4. Should redirect to provider's sign-in page
5. After signing in, should redirect back to `/dashboard`

---

## 📖 Full Setup Guide

See `OAUTH_SETUP_GUIDE.md` for detailed instructions on:
- Creating OAuth apps with each provider
- Getting Client IDs and Secrets
- Troubleshooting common issues

---

**Status**: Code is ready! Just enable providers in Supabase Dashboard and add credentials.

