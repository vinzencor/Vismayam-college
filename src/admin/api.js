// Data access for /vismayam/admin. Every write is checked by RLS (`public.is_admin()`),
// so this file holds no secrets — the browser only ever uses the anon key + the admin's session.
import { supabase } from '../lib/supabase.js'
import { fromRow, toRow } from '../lib/case.js'

const BUCKET = 'media'

function must({ data, error }) {
  if (error) throw error
  return data
}

// Turns Postgres / PostgREST / Storage errors into something an editor can act on.
export function errorMessage(err) {
  if (!err) return 'Something went wrong.'
  const code = err.code ?? err.statusCode
  if (code === '23505') return 'That ID / slug is already used. Choose a different one.'
  if (code === '23503') return 'This item is still used elsewhere (e.g. a category that still has courses). Move those first.'
  if (code === '42501' || /row-level security/i.test(err.message ?? '')) {
    return "You don't have permission to do that. Make sure your account is an admin."
  }
  if (code === 'PGRST205' || code === '42P01' || code === 'PGRST202') {
    return 'The database is not set up yet. Run supabase/schema.sql in the Supabase SQL editor.'
  }
  if (code === 'PGRST116') return 'Nothing was saved — the item no longer exists or you lack permission.'
  if (/bucket not found/i.test(err.message ?? '')) return 'Storage bucket "media" is missing. Run supabase/schema.sql.'
  if (/exceeded the maximum allowed size|payload too large/i.test(err.message ?? '')) return 'File is too large (max 10 MB).'
  if (/mime type/i.test(err.message ?? '')) return 'That file type is not allowed. Use JPG, PNG, WebP, GIF, AVIF or PDF.'
  return err.message || String(err)
}

// ---------- Auth ----------
export async function signIn(email, password) {
  return must(await supabase.auth.signInWithPassword({ email, password }))
}

export const signOut = () => supabase.auth.signOut()

export async function checkIsAdmin() {
  return must(await supabase.rpc('is_admin')) === true
}

// ---------- Uploads ----------
export const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Uploads to the public `media` bucket and returns the file's public URL.
export async function uploadFile(file, folder) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const base = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 48) || 'file'
  const path = `${folder}/${Date.now()}-${base}.${ext}`
  must(await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', contentType: file.type }))
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// ---------- Courses ----------
export async function listCourses() {
  const rows = must(
    await supabase
      .from('courses')
      .select('slug, title, short_title, category, price, start_date, published, is_career_track, image, popularity, instructor, updated_at')
      .order('popularity', { ascending: false }),
  )
  return rows.map(fromRow)
}

export async function getCourse(slug) {
  const row = must(await supabase.from('courses').select('*').eq('slug', slug).maybeSingle())
  return row ? fromRow(row) : null
}

// `originalSlug` is set when editing, so the slug itself can be renamed.
export async function saveCourse(course, originalSlug) {
  const { createdAt, updatedAt, lessons, categoryName, ...fields } = course
  const row = toRow(fields)
  const query = originalSlug
    ? supabase.from('courses').update(row).eq('slug', originalSlug)
    : supabase.from('courses').insert(row)
  return fromRow(must(await query.select().single()))
}

export async function setCoursePublished(slug, published) {
  must(await supabase.from('courses').update({ published }).eq('slug', slug).select('slug').single())
}

export async function deleteCourse(slug) {
  must(await supabase.from('courses').delete().eq('slug', slug))
}

// ---------- Categories ----------
export async function listCategories() {
  return must(await supabase.from('categories').select('*').order('sort_order')).map(fromRow)
}

export async function saveCategory(category, isNew) {
  const row = toRow(category)
  const query = isNew
    ? supabase.from('categories').insert(row)
    : supabase.from('categories').update(row).eq('id', category.id)
  return fromRow(must(await query.select().single()))
}

export async function deleteCategory(id) {
  must(await supabase.from('categories').delete().eq('id', id))
}

// ---------- Testimonials ----------
export async function listTestimonials() {
  return must(
    await supabase.from('testimonials').select('*').order('sort_order').order('created_at'),
  ).map(fromRow)
}

export async function saveTestimonial(testimonial) {
  const { id, createdAt, updatedAt, ...fields } = testimonial
  const row = toRow(fields)
  const query = id
    ? supabase.from('testimonials').update(row).eq('id', id)
    : supabase.from('testimonials').insert(row)
  return fromRow(must(await query.select().single()))
}

export async function deleteTestimonial(id) {
  must(await supabase.from('testimonials').delete().eq('id', id))
}

// Persists list order as sort_order = position.
export async function saveOrder(table, key, ids) {
  const results = await Promise.all(
    ids.map((id, i) => supabase.from(table).update({ sort_order: i }).eq(key, id)),
  )
  results.forEach(must)
}

// ---------- Site settings ----------
export async function getSetting(id) {
  const row = must(await supabase.from('site_settings').select('value').eq('id', id).maybeSingle())
  return row?.value ?? null
}

export async function saveSetting(id, value) {
  must(await supabase.from('site_settings').upsert({ id, value }).select('id').single())
}

// ---------- Enquiries ----------
export async function listEnquiries(limit = 1000) {
  return must(
    await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(limit),
  ).map(fromRow)
}

export async function setEnquiryContacted(id, contacted) {
  must(await supabase.from('enquiries').update({ contacted }).eq('id', id).select('id').single())
}

export async function deleteEnquiry(id) {
  must(await supabase.from('enquiries').delete().eq('id', id))
}

// ---------- Dashboard ----------
const count = async (query) => {
  const { count: n, error } = await query
  if (error) throw error
  return n ?? 0
}

export async function getDashboard() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const head = { count: 'exact', head: true }
  const [published, drafts, testimonials, enquiries, newEnquiries, lastWeek, recent, courses] = await Promise.all([
    count(supabase.from('courses').select('slug', head).eq('published', true)),
    count(supabase.from('courses').select('slug', head).eq('published', false)),
    count(supabase.from('testimonials').select('id', head)),
    count(supabase.from('enquiries').select('id', head)),
    count(supabase.from('enquiries').select('id', head).eq('contacted', false)),
    count(supabase.from('enquiries').select('id', head).gte('created_at', weekAgo)),
    supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(6).then(must),
    supabase.from('courses').select('slug, title').then(must),
  ])
  return {
    published,
    drafts,
    testimonials,
    enquiries,
    newEnquiries,
    lastWeek,
    recent: recent.map(fromRow),
    courseTitles: Object.fromEntries(courses.map((c) => [c.slug, c.title])),
  }
}
