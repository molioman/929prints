import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Server-side client with the secret key. It bypasses row level security,
// so it must never be imported from client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set')
  }
  return createClient(url, secretKey, { auth: { persistSession: false } })
}
