# Google OAuth Setup Guide for VintageLeague

This guide walks you through enabling Google Sign-In for VintageLeague. It has three parts:

1. **Google Cloud Console** — create OAuth credentials
2. **Supabase Dashboard** — enable the Google provider
3. **Vercel** — confirm environment variables are in place

No code changes are required. You only need to follow the steps below in each web dashboard.

---

## Part 1: Google Cloud Console — Create OAuth Credentials

### Step 1.1 — Go to Google Cloud Console

Open [https://console.cloud.google.com](https://console.cloud.google.com) and sign in with your Google account.

### Step 1.2 — Create or select a project

- In the top navigation bar, click the **project selector dropdown** (next to "Google Cloud").
- If you already have a project for VintageLeague, select it.
- Otherwise, click **New Project**:
  - **Project name:** `VintageLeague`
  - **Location:** leave as default (No organisation)
  - Click **Create** and wait for the project to be created (~10 seconds).
  - Then select the new project from the dropdown.

### Step 1.3 — Enable the Google+ API (required for OAuth)

1. In the left sidebar, go to **APIs & Services → Library**.
2. Search for **"Google+ API"**.
3. Click on **Google+ API** in the results.
4. Click the blue **Enable** button.
5. Wait for it to activate.

> **Note:** Even though Google+ is deprecated, this API entry is still required for OAuth user profile access.

### Step 1.4 — Configure the OAuth Consent Screen

Before creating credentials, you must set up the consent screen (what users see when they log in).

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (for public users) and click **Create**.
3. Fill in the required fields:
   - **App name:** `VintageLeague`
   - **User support email:** your email address
   - **Developer contact information:** your email address
4. Click **Save and Continue**.
5. On the **Scopes** screen, click **Save and Continue** (no extra scopes needed).
6. On the **Test users** screen, click **Save and Continue**.
7. Review the summary and click **Back to Dashboard**.

### Step 1.5 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials** at the top.
3. Select **OAuth client ID**.
4. For **Application type**, select **Web application**.
5. Set the **Name** to: `VintageLeague Supabase`
6. Under **Authorised redirect URIs**, click **+ Add URI** and enter exactly:

   ```
   https://napzgxpxkoiujjqwtzvz.supabase.co/auth/v1/callback
   ```

   > This URI must match exactly — no trailing slash, no uppercase letters.

7. Click **Create**.

### Step 1.6 — Copy your credentials

A popup will appear showing:

- **Your Client ID** — looks like: `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
- **Your Client Secret** — looks like: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

**Copy both values and save them somewhere safe** (e.g., a password manager). You will need them in Part 2.

Click **OK** to close the popup. You can always find these values again under **APIs & Services → Credentials → OAuth 2.0 Client IDs**.

---

## Part 2: Supabase Dashboard — Enable the Google Provider

### Step 2.1 — Open the Supabase Dashboard

Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.

Select the **VintageLeague** project:
- Project ref: `napzgxpxkoiujjqwtzvz`
- URL: `https://napzgxpxkoiujjqwtzvz.supabase.co`

### Step 2.2 — Navigate to Authentication → Providers

1. In the left sidebar, click **Authentication**.
2. Click **Providers** in the sub-navigation.

### Step 2.3 — Enable Google

1. Scroll down to find **Google** in the list of providers.
2. Click on the **Google** row to expand it.
3. Toggle **Enable Sign in with Google** to **ON**.
4. Enter your credentials from Part 1:
   - **Client ID (for OAuth):** paste your Google Client ID
   - **Client Secret:** paste your Google Client Secret
5. The **Callback URL (for OAuth)** field is pre-filled — verify it shows:
   ```
   https://napzgxpxkoiujjqwtzvz.supabase.co/auth/v1/callback
   ```
   This must match exactly what you entered in Google Cloud Console in Step 1.5.
6. Click **Save**.

Google OAuth is now active on your Supabase project.

### Step 2.4 — Verify Site URL (optional but recommended)

1. Still in **Authentication**, click **URL Configuration**.
2. Check that **Site URL** is set to your production domain:
   ```
   https://vintageleague.app
   ```
3. Under **Redirect URLs**, add if not already present:
   ```
   https://vintageleague.app/**
   ```
   This allows Supabase to redirect users back to your app after login.
4. Click **Save**.

---

## Part 3: Vercel — Confirm Environment Variables

No new environment variables are needed for Google OAuth. The OAuth flow goes:

```
Browser → Google → Supabase (callback) → Your app
```

Supabase handles the OAuth exchange using the credentials you set in Part 2. Your frontend only needs the existing Supabase connection variables.

### Step 3.1 — Verify existing variables in Vercel

1. Go to [https://vercel.com](https://vercel.com) and open the VintageLeague project.
2. Go to **Settings → Environment Variables**.
3. Confirm both of these variables are present:

   | Variable | Expected value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://napzgxpxkoiujjqwtzvz.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon public key) |

4. No changes needed — these are already sufficient for Google OAuth to work.

---

## Summary Checklist

| Step | Action | Status |
|---|---|---|
| 1.2 | Google Cloud project created/selected | ☐ |
| 1.3 | Google+ API enabled | ☐ |
| 1.4 | OAuth consent screen configured | ☐ |
| 1.5 | OAuth client ID created with correct redirect URI | ☐ |
| 1.6 | Client ID and Client Secret copied | ☐ |
| 2.3 | Google provider enabled in Supabase | ☐ |
| 2.4 | Site URL set to `https://vintageleague.app` | ☐ |
| 3.1 | Vercel env vars confirmed present | ☐ |

---

## Redirect URI Reference

The exact redirect URI to use everywhere:

```
https://napzgxpxkoiujjqwtzvz.supabase.co/auth/v1/callback
```

This value must be identical in both Google Cloud Console and confirmed in Supabase. A mismatch will cause `redirect_uri_mismatch` errors when users try to log in.

---

## Troubleshooting

| Error | Likely Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | URI in Google Cloud Console does not match | Re-check Step 1.5 — copy the URI exactly |
| `Error 400: invalid_client` | Wrong Client ID or Secret in Supabase | Re-check Step 2.3 |
| User redirected to blank page | Site URL not set in Supabase | Check Step 2.4 |
| Button shows but nothing happens | Google provider not saved in Supabase | Re-do Step 2.3 and click Save |

---

*Guide written for VintageLeague — Supabase project `napzgxpxkoiujjqwtzvz`*
