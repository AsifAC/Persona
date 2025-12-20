# Troubleshooting Guide

## Row Level Security (RLS) Errors

### Error: "new row violates row-level security policy for table 'person_profiles'"

This error occurs when trying to insert data into `person_profiles` table. Here's how to fix it:

#### Solution 1: Verify RLS Policies Are Applied

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Run this query to check if policies exist:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'person_profiles';
```

You should see:
- "Users can insert person profiles" (INSERT)
- "Users can update person profiles" (UPDATE)
- "Users can view searched person profiles" (SELECT)

If policies are missing, run the migration:
```sql
-- Copy and paste the contents of database/fix_person_profiles_rls.sql
```

#### Solution 2: Check Authentication Status

The error can occur if:
- You're not signed in
- Your session expired
- The session token isn't being sent with requests

**Fix:**
1. Sign out and sign back in
2. Check browser console for authentication errors
3. Verify you're not in "Guest Mode" (check the app UI)

#### Solution 3: Verify Session is Active

In the browser console, check:
```javascript
// Check if session is active
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

If `session` is `null`, you need to sign in again.

#### Solution 4: Clear Browser Data

Sometimes cached authentication data can cause issues:
1. Clear browser cache and cookies
2. Sign in again
3. Try the operation again

### Common Causes

1. **Session Expired**: Supabase sessions expire after a period of inactivity
2. **Guest Mode**: The app might be in guest mode instead of authenticated mode
3. **Missing Policies**: RLS policies weren't applied to the database
4. **Token Not Sent**: The Supabase client isn't including the auth token in requests

### Debugging Steps

1. **Check Browser Console**: Look for authentication errors or warnings
2. **Check Network Tab**: Verify requests include the `Authorization` header
3. **Verify User ID**: Check if `auth.uid()` returns your user ID in Supabase SQL Editor (when authenticated)
4. **Test Policy Directly**: Try inserting a row manually in Supabase SQL Editor while authenticated

### Still Having Issues?

1. Check Supabase **Authentication** → **Logs** for errors
2. Verify your Supabase project is active (not paused)
3. Ensure you're using the correct Supabase URL and keys in `.env`
4. Try creating a fresh session by signing out and back in

