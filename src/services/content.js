import { supabase } from '../lib/supabase.js'
import { fromRow } from '../lib/case.js'
import { defaultTestimonials, homeDefaults } from '../data/home.js'

// Homepage content edited in the admin. Falls back to the defaults so the page
// always renders, even if the row is missing or the request fails.
export async function getHomeContent() {
  if (!supabase) return homeDefaults
  const { data, error } = await supabase.from('site_settings').select('value').eq('id', 'home').maybeSingle()
  if (error) console.warn('[content] Could not load homepage content:', error.message)
  const value = data?.value ?? {}
  return { ...homeDefaults, ...value, liveClass: { ...homeDefaults.liveClass, ...value.liveClass } }
}

export async function getTestimonials() {
  if (!supabase) return defaultTestimonials
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('published', true)
    .order('sort_order')
    .order('created_at')
  if (error) {
    console.warn('[content] Could not load testimonials:', error.message)
    return defaultTestimonials
  }
  return data.map(fromRow)
}
