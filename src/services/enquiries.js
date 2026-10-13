import { supabase } from '../lib/supabase.js'

/**
 * Submits a course enquiry. The `submit-enquiry` Edge Function validates it,
 * stores it in the `enquiries` table and emails the admissions team.
 *
 * @param {{
 *   name: string, mobile: string, courseSlug: string, qualification: string,
 *   contactMode: 'whatsapp' | 'call', source: string, website?: string
 * }} enquiry
 */
export async function submitEnquiry({ name, mobile, courseSlug, qualification, contactMode, source, website = '' }) {
  const payload = {
    name: name.trim(),
    mobile,
    courseSlug,
    qualification,
    contactMode,
    source,
    pageUrl: window.location.href,
    website, // honeypot
  }

  if (!supabase) {
    // No backend yet — simulate a network round-trip so the UI states are testable.
    await new Promise((resolve) => setTimeout(resolve, 700))
    console.info('[enquiry] Supabase not configured — enquiry not stored or emailed:', payload)
    return
  }

  const { data, error } = await supabase.functions.invoke('submit-enquiry', { body: payload })
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'Enquiry was not accepted')
}
