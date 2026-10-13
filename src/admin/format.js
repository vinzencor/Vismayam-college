import { NOT_SURE_COURSE } from '../data/enquiry.js'

const dateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatDateTime = (iso) => (iso ? dateTime.format(new Date(iso)) : '—')

export const courseLabel = (slug, titles) =>
  slug === NOT_SURE_COURSE ? 'Not sure yet — needs guidance' : (titles[slug] ?? slug)

// "+919876543210" → "+91 98765 43210"
export const formatMobile = (mobile) => {
  const digits = mobile?.replace(/^\+91/, '') ?? ''
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : mobile
}
