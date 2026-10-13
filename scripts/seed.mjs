// Loads the starter content from src/data into Supabase.
// Usage: fill VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env, then `npm run seed`.
//
// Safe to re-run: rows that already exist are left alone, so edits made in the
// admin are never overwritten. `npm run seed -- --force` resets the catalogue
// and homepage content back to the defaults in src/data.
import { createClient } from '@supabase/supabase-js'
import { categories, courses } from '../src/data/courses.js'
import { defaultTestimonials, homeDefaults } from '../src/data/home.js'
import { toRow } from '../src/lib/case.js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const force = process.argv.includes('--force')

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
const upsert = (table, rows, onConflict) =>
  supabase.from(table).upsert(rows, { onConflict, ignoreDuplicates: !force })

const categoryRows = categories.map((c, i) => toRow({ ...c, sortOrder: i }))
const { error: catError } = await upsert('categories', categoryRows, 'id')
if (catError) throw catError
console.log(`✓ ${categoryRows.length} categories`)

const { error: courseError } = await upsert('courses', courses.map(toRow), 'slug')
if (courseError) throw courseError
console.log(`✓ ${courses.length} courses`)

const { error: homeError } = await upsert('site_settings', [{ id: 'home', value: homeDefaults }], 'id')
if (homeError) throw homeError
console.log('✓ homepage content')

// Testimonials have generated ids, so only add the starter ones to an empty table.
const { count, error: countError } = await supabase.from('testimonials').select('id', { count: 'exact', head: true })
if (countError) throw countError
if (count === 0) {
  const rows = defaultTestimonials.map(({ id, ...t }, i) => toRow({ ...t, sortOrder: i }))
  const { error } = await supabase.from('testimonials').insert(rows)
  if (error) throw error
  console.log(`✓ ${rows.length} testimonial(s)`)
} else {
  console.log(`• testimonials already present (${count}) — skipped`)
}
