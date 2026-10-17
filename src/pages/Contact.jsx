import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Check, Clock, Mail, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react'
import { EnquiryForm } from '../components/EnquiryForm.jsx'
import { Img } from '../components/Img.jsx'
import { Reveal } from '../components/Reveal.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { avatars } from '../data/images.js'
import { site } from '../config/site.js'
import './Contact.css'

const stats = [
  { value: '2,400+', label: 'Students enrolled' },
  { value: '4.9', star: true, label: 'Avg. student rating' },
  { value: '92%', label: 'Placement rate' },
  { value: '<2 hrs', label: 'Advisor response' },
]

const nextSteps = [
  {
    title: 'We review your goals',
    text: "Your advisor checks the course, cohort and schedule you're interested in and prepares a personalised response.",
  },
  {
    title: 'We contact you your way',
    text: 'Expect a WhatsApp message or call—whichever you chose—within one working day. No spam, ever.',
  },
  {
    title: 'You decide confidently',
    text: 'Get clear answers, compare options and enroll only if the course feels genuinely right for you.',
  },
]

const promises = [
  { Icon: Clock, title: 'Mon–Sat', text: site.hoursLong },
  { Icon: MessageCircle, title: 'Quick reply', text: 'within 2 working hours' },
  { Icon: ShieldCheck, title: 'Private & secure', text: 'details never sold' },
]

function focusForm() {
  const form = document.getElementById('enquiry-form')
  if (!form) return

  const header = document.querySelector('.site-header')
  const headerHeight = header ? header.getBoundingClientRect().height : 72
  const top = form.getBoundingClientRect().top + window.scrollY - headerHeight - 16

  window.scrollTo({ top, behavior: 'smooth' })
  form.querySelector('input')?.focus({ preventScroll: true })
}

export default function Contact() {
  useDocumentTitle(
    'Course enquiry',
    'Tell us which course you’re considering and a Vismayam College advisor will reply within 2 working hours by WhatsApp or call.',
  )
  const [params] = useSearchParams()
  const location = useLocation()
  const defaultCourse = params.get('course') ?? ''

  useEffect(() => {
    if (!window.matchMedia('(max-width: 768px)').matches) return

    const form = document.getElementById('enquiry-form')
    if (!form) return

    const frame = window.requestAnimationFrame(() => {
      const header = document.querySelector('.site-header')
      const offset = header ? header.offsetHeight + 16 : 16
      const top = form.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
      form.querySelector('input')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, defaultCourse])

  return (
    <>
      {/* ---------- Hero + form ---------- */}
      <section className="contact-hero bg-mist">
        <div className="container contact-hero__grid">
          <div className="contact-hero__copy">
            <span className="eyebrow">Course enquiry</span>
            <h1 className="h1">Let's plan your next step.</h1>
            <p className="lead">
              Tell us which course you're considering. A friendly {site.name} advisor will get back to you with honest,
              practical guidance.
            </p>

            <div className="reassure">
              <div className="reassure__head">
                <div className="avatar-pair" aria-hidden="true">
                  <Img src={avatars.e} alt="" />
                  <Img src={avatars.f} alt="" />
                </div>
                <div>
                  <p className="reassure__title">A real person will reply</p>
                  <p className="reassure__sub">
                    <span className="online-dot" aria-hidden="true" /> Usually within 2 working hours
                  </p>
                </div>
              </div>
              <ul className="check-list">
                {['Honest course and workload guidance', 'Flexible payment options explained', 'No pressure or repeated sales calls'].map(
                  (item) => (
                    <li key={item}>
                      <span className="check-dot">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="direct">
              <p>Prefer to reach us directly?</p>
              <div className="direct__links">
                <a href={site.phoneHref}>
                  <Phone size={16} /> {site.phone}
                </a>
                <a href={`mailto:${site.email}`}>
                  <Mail size={16} /> {site.email}
                </a>
              </div>
            </div>
          </div>

          <div id="enquiry-form" className="contact-hero__form">
            <EnquiryForm variant="full" defaultCourse={defaultCourse} source="contact-page" key={defaultCourse} />
          </div>
        </div>

        <div className="container">
          <Reveal as="dl" className="contact-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>
                  {s.value}
                  {s.star && <Star size={26} fill="currentColor" strokeWidth={0} aria-label="stars" />}
                </dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- What happens next ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <span className="eyebrow eyebrow--center">What happens next</span>
            <h2 className="h2">Clear guidance in three simple steps</h2>
          </Reveal>
          <ol className="next-steps">
            {nextSteps.map((step, i) => (
              <Reveal as="li" key={step.title} className="next-step" delay={i * 90}>
                <span className="next-step__num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="next-step__title">{step.title}</h3>
                <p className="next-step__text">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Advisors ---------- */}
      <section className="advisors">
        <div className="container advisors__grid">
          <Reveal className="advisors__copy">
            <span className="eyebrow">Expert advisors</span>
            <h2 className="advisors__title">You're speaking with people who understand learning decisions.</h2>
            <p className="advisors__text">
              Our advisors know the curriculum, schedules and career paths—not just the prices. Ask the detailed questions.
              That's what we're here for.
            </p>
            <div className="advisors__actions">
              <button type="button" className="btn btn--primary" onClick={focusForm}>
                Enquire now
              </button>
              <p>
                or call us at <a href={site.phoneHref}>{site.phone}</a>
              </p>
            </div>
          </Reveal>

          <ul className="promises">
            {promises.map(({ Icon, title, text }, i) => (
              <Reveal as="li" key={title} className="promise" delay={i * 90}>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <p>{title}</p>
                  <span>{text}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
