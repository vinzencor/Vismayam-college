// Creates (or updates) a login for /vismayam/admin.
// Usage: npm run create-admin -- admin@example.com 'a-strong-password'
// Running it again for an existing email resets that user's password and makes sure they're an admin.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const [email, password] = process.argv.slice(2)

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
if (!email || !password) {
  console.error("Usage: npm run create-admin -- you@example.com 'password'")
  process.exit(1)
}
if (password.length < 8) {
  console.error('Use a password of at least 8 characters.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function findUser(address) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const user = data.users.find((u) => u.email?.toLowerCase() === address.toLowerCase())
    if (user || data.users.length < 200) return user ?? null
  }
}

let user = await findUser(email)
if (user) {
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true })
  if (error) throw error
  console.log(`✓ updated password for ${email}`)
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  user = data.user
  console.log(`✓ created user ${email}`)
}

const { error } = await supabase.from('admins').upsert({ user_id: user.id }, { onConflict: 'user_id' })
if (error) {
  if (error.code === 'PGRST205') console.error('The admins table is missing — run supabase/schema.sql first.')
  throw error
}
console.log(`✓ ${email} is an admin — sign in at /vismayam/admin`)
