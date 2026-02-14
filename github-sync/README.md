# Supabase → public-apis Sync

This directory contains everything needed to sync your Supabase APIs database to the public-apis format.

## Setup Instructions

1. **Copy these files to your `paytience/public-apis` fork:**
   ```
   public-apis-sync/
   ├── .github/workflows/sync-from-supabase.yml
   └── scripts/sync-from-supabase.mjs
   ```

2. **Add GitHub Secrets** to your fork repository:
   - Go to: `https://github.com/paytience/public-apis/settings/secrets/actions`
   - Add these secrets:
     - `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xinunseqsgmktmbrzahw.supabase.co`)
     - `SUPABASE_ANON_KEY` - Your Supabase anon/public key

3. **The workflow will run:**
   - Daily at 2 AM UTC (scheduled)
   - Manually via "Actions" tab → "Sync from Supabase" → "Run workflow"

## Files

- **`.github/workflows/sync-from-supabase.yml`** - GitHub Actions workflow
- **`scripts/sync-from-supabase.mjs`** - Standalone sync script (no dependencies)

## Security

- The Supabase anon key is safe to use in GitHub Secrets
- It's designed for client-side use and your RLS policies protect data
- GitHub Secrets are encrypted and never exposed in logs
