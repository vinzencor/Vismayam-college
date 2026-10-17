// Supabase Edge Function: submit-enquiry
// Validates a course enquiry, stores it in `enquiries` and emails the admissions team via Resend.
//
// Secrets (supabase secrets set …):
//   RESEND_API_KEY     – API key from resend.com (vismayamcollege.com must be a verified domain)
//   ADMISSIONS_EMAIL   – recipient(s), comma-separated, e.g. "admissions@vismayamcollege.com"
//   EMAIL_FROM         – optional, defaults to "Vismayam College <enquiries@vismayamcollege.com>"
//   ALLOWED_ORIGINS    – optional, comma-separated list of site origins allowed to call this function
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://vismayamcollege.com,https://www.vismayamcollege.com,https://vismayam-college.vercel.app,http://localhost:5173,http://localhost:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMISSIONS_EMAIL = Deno.env.get('ADMISSIONS_EMAIL')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Vismayam College <enquiries@vismayamcollege.com>'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://vismayamcollege.com'
const NOT_SURE_COURSE = 'not-sure'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

type Enquiry = {
  name: string
  mobile: string
  course_slug: string
  qualification: string
  contact_mode: 'whatsapp' | 'call'
  source: string | null
  page_url: string | null
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false

  const trimmed = origin.trim()
  return ALLOWED_ORIGINS.includes(trimmed) || trimmed.endsWith('.vercel.app')
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

// Mirrors the browser-side validation in src/components/EnquiryForm.jsx — never trust the client.
function validate(input: Record<string, unknown>): { enquiry: Enquiry } | { error: string } {
  const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

  const name = str(input.name, 100)
  const digits = str(input.mobile, 20).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  const courseSlug = str(input.courseSlug, 120)
  const qualification = str(input.qualification, 100)
  const contactMode = input.contactMode

  if (name.length < 2) return { error: 'Please enter your full name.' }
  if (!/^[6-9]\d{9}$/.test(digits)) return { error: 'Enter a valid 10-digit mobile number.' }
  if (!courseSlug) return { error: 'Choose the course you are interested in.' }
  if (!qualification) return { error: 'Select your highest qualification.' }
  if (contactMode !== 'whatsapp' && contactMode !== 'call') return { error: 'Choose WhatsApp or Call.' }

  return {
    enquiry: {
      name,
      mobile: `+91${digits}`,
      course_slug: courseSlug,
      qualification,
      contact_mode: contactMode,
      source: str(input.source, 50) || null,
      page_url: str(input.pageUrl, 300) || null,
    },
  }
}

async function courseTitle(slug: string) {
  if (slug === NOT_SURE_COURSE) return 'Not sure yet — needs guidance'
  const { data } = await supabase.from('courses').select('title').eq('slug', slug).maybeSingle()
  return data?.title ?? slug
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function emailAdmissions(enquiry: Enquiry, course: string, id: string) {
  if (!RESEND_API_KEY || !ADMISSIONS_EMAIL) throw new Error('RESEND_API_KEY or ADMISSIONS_EMAIL is not set')

  const digits = enquiry.mobile.slice(3)
  const mobile = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  const mode = enquiry.contact_mode === 'whatsapp' ? 'WhatsApp' : 'Call'
  const submittedAt = `${new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} IST`

  const rows: [string, string][] = [
    ['Student name', enquiry.name],
    ['Mobile number', mobile],
    ['Course interested in', course],
    ['Education / Qualification', enquiry.qualification],
    ['Preferred mode of contact', mode],
    ['Submitted from', enquiry.page_url ?? enquiry.source ?? '—'],
    ['Submitted at', submittedAt],
    ['Enquiry ID', id],
  ]

  const whatsappUrl = `https://wa.me/91${digits}`
  const callUrl = `tel:+91${digits}`
  const action = enquiry.contact_mode === 'whatsapp' ? { href: whatsappUrl, label: 'Reply on WhatsApp' } : { href: callUrl, label: 'Call student' }

  const html = `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#17141f">
    <img src="${SITE_URL}/logo.png" alt="Vismayam College of Art and Media" width="180" height="34" style="display:block;margin:0 0 16px" />
    <div style="background:#fd1843;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0">
      <p style="margin:0;font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.85">New course enquiry</p>
      <h1 style="margin:6px 0 0;font-size:20px">${escapeHtml(enquiry.name)} · ${escapeHtml(course)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #ece8ef;border-top:0">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #ece8ef;color:#77727f;font-size:13px;width:44%">${label}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #ece8ef;font-size:14px;font-weight:600">${escapeHtml(value)}</td>
        </tr>`,
        )
        .join('')}
    </table>
    <p style="margin:20px 0 0">
      <a href="${action.href}" style="display:inline-block;background:#fd1843;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:14px">${action.label}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#a29eaa">Preferred contact: ${mode}. Please respond within 2 working hours.</p>
  </div>`

  const text = [
    'New course enquiry',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `${action.label}: ${action.href}`,
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: ADMISSIONS_EMAIL.split(',').map((address) => address.trim()),
      subject: `New enquiry: ${enquiry.name} — ${course}`.replace(/[\r\n]+/g, ' '),
      html,
      text,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, headers)

  let input: Record<string, unknown>
  try {
    input = await req.json()
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400, headers)
  }

  // Honeypot filled → almost certainly a bot. Pretend success, store nothing.
  if (typeof input.website === 'string' && input.website.trim()) return json({ ok: true }, 200, headers)

  const result = validate(input)
  if ('error' in result) return json({ ok: false, error: result.error }, 400, headers)
  const { enquiry } = result

  const { data: row, error: insertError } = await supabase.from('enquiries').insert(enquiry).select('id').single()
  if (insertError) {
    console.error('Insert failed', insertError)
    return json({ ok: false, error: 'Could not save your enquiry' }, 500, headers)
  }

  // The enquiry is already saved, so an email problem shouldn't fail the request —
  // record it on the row so the team can spot missed notifications.
  try {
    await emailAdmissions(enquiry, await courseTitle(enquiry.course_slug), row.id)
    await supabase.from('enquiries').update({ email_sent: true }).eq('id', row.id)
  } catch (err) {
    console.error('Admissions email failed', err)
    await supabase
      .from('enquiries')
      .update({ email_error: String(err).slice(0, 500) })
      .eq('id', row.id)
  }

  return json({ ok: true, id: row.id }, 200, headers)
})
