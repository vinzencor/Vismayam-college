import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, CircleCheck, Lock, MessageCircle, Phone } from 'lucide-react'
import { useAsync } from '../hooks/useAsync.js'
import { getCourses } from '../services/courses.js'
import { submitEnquiry } from '../services/enquiries.js'
import { NOT_SURE_COURSE, qualifications } from '../data/enquiry.js'
import { site } from '../config/site.js'
import './EnquiryForm.css'

const MODES = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'call', label: 'Call', Icon: Phone },
]

const STEPS = ['name', 'mobile', 'courseSlug', 'qualification', 'contactMode']

// Accepts "98765 43210", "+91 98765 43210", "09876543210" … and returns the 10 digits.
const tenDigits = (mobile) => mobile.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
const formatMobile = (mobile) => {
  const d = tenDigits(mobile)
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : mobile
}

function validate(values, requireConsent) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!/^[6-9]\d{9}$/.test(tenDigits(values.mobile))) errors.mobile = 'Enter a valid 10-digit mobile number.'
  if (!values.courseSlug) errors.courseSlug = 'Choose the course you are interested in.'
  if (!values.qualification) errors.qualification = 'Select your highest qualification.'
  if (requireConsent && !values.consent) errors.consent = 'Please confirm we can contact you.'
  return errors
}

const initialValues = (defaultCourse, full) => ({
  name: '',
  mobile: '',
  courseSlug: defaultCourse,
  qualification: '',
  contactMode: 'whatsapp',
  consent: full,
  website: '', // honeypot — real visitors never see or fill this
})

function SelectField({ id, label, value, onChange, onBlur, placeholder, error, children }) {
  return (
    <div className={`field field--wide${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__select">
        <select
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={value ? 'has-value' : ''}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {children}
        </select>
        <ChevronDown size={18} aria-hidden="true" />
      </div>
      {error && (
        <p className="field__error" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Enquiry / callback form.
 * - variant "compact": the home-page "personal recommendation" card
 * - variant "full": the contact page form with progress, consent and radio cards
 */
export function EnquiryForm({ variant = 'compact', defaultCourse = '', source = 'website' }) {
  const full = variant === 'full'
  const uid = useId()
  const successRef = useRef(null)
  const { data: courses } = useAsync(getCourses, [])

  const [values, setValues] = useState(() => initialValues(defaultCourse, full))
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  const errors = validate(values, full)
  const showError = (field) => (touched[field] ? errors[field] : undefined)
  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [field]: value }))
  }
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }))

  const completed = STEPS.filter((field) => !errors[field] && values[field]).length

  // Move screen-reader focus (and the viewport on mobile) to the confirmation.
  useEffect(() => {
    if (status !== 'success' || !successRef.current) return
    successRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    successRef.current.querySelector('h3')?.focus({ preventScroll: true })
  }, [status])

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ name: true, mobile: true, courseSlug: true, qualification: true, consent: true })
    if (Object.keys(errors).length) return
    setStatus('submitting')
    try {
      await submitEnquiry({ ...values, mobile: formatMobile(values.mobile), source })
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  function reset() {
    setValues(initialValues(defaultCourse, full))
    setTouched({})
    setStatus('idle')
  }

  if (status === 'success') {
    const course =
      values.courseSlug === NOT_SURE_COURSE
        ? 'Not sure yet — needs guidance'
        : (courses?.find((c) => c.slug === values.courseSlug)?.title ?? values.courseSlug)
    const summary = [
      ['Student name', values.name.trim()],
      ['Mobile number', formatMobile(values.mobile)],
      ['Course', course],
      ['Qualification', values.qualification],
      ['Contact via', values.contactMode === 'whatsapp' ? 'WhatsApp' : 'Call'],
    ]

    return (
      <div ref={successRef} className={`enquiry enquiry--${variant} enquiry--success`} role="status" aria-live="polite">
        <span className="enquiry__success-icon">
          <CircleCheck size={30} />
        </span>
        <h3 className="enquiry__title" tabIndex={-1}>
          Thank you, your enquiry has been submitted successfully.
        </h3>
        <p className="enquiry__subtitle">
          Our admissions team will {values.contactMode === 'whatsapp' ? 'message you on WhatsApp' : 'call you'} within 2
          working hours.
        </p>
        <dl className="enquiry__summary">
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn btn--outline" onClick={reset}>
          Submit another enquiry
        </button>
      </div>
    )
  }

  return (
    <form className={`enquiry enquiry--${variant}`} onSubmit={handleSubmit} noValidate>
      <div className="enquiry__head">
        <h3 className="enquiry__title">{full ? 'Tell us a little about you' : 'Get a personal recommendation'}</h3>
        {full && <p className="enquiry__subtitle">All fields are required. It takes less than a minute.</p>}
        {full && (
          <div
            className="enquiry__progress"
            role="progressbar"
            aria-label="Form progress"
            aria-valuemin={0}
            aria-valuemax={STEPS.length}
            aria-valuenow={completed}
          >
            {STEPS.map((step, i) => (
              <span key={step} className={i < Math.max(completed, 1) ? 'is-done' : ''} />
            ))}
          </div>
        )}
      </div>

      <div className="enquiry__grid">
        <div className={`field${showError('name') ? ' has-error' : ''}`}>
          <label htmlFor={`${uid}-name`}>Student name</label>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder={full ? 'Enter your full name' : 'e.g. Riya Shah'}
            value={values.name}
            onChange={set('name')}
            onBlur={blur('name')}
            aria-invalid={Boolean(showError('name'))}
            aria-describedby={showError('name') ? `${uid}-name-err` : undefined}
          />
          {showError('name') && (
            <p className="field__error" id={`${uid}-name-err`}>
              {errors.name}
            </p>
          )}
        </div>

        <div className={`field${showError('mobile') ? ' has-error' : ''}`}>
          <label htmlFor={`${uid}-mobile`}>Mobile number</label>
          <input
            id={`${uid}-mobile`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="+91 00000 00000"
            value={values.mobile}
            onChange={set('mobile')}
            onBlur={blur('mobile')}
            aria-invalid={Boolean(showError('mobile'))}
            aria-describedby={showError('mobile') ? `${uid}-mobile-err` : undefined}
          />
          {showError('mobile') && (
            <p className="field__error" id={`${uid}-mobile-err`}>
              {errors.mobile}
            </p>
          )}
        </div>

        <SelectField
          id={`${uid}-course`}
          label="Course interested in"
          placeholder="Choose a course"
          value={values.courseSlug}
          onChange={set('courseSlug')}
          onBlur={blur('courseSlug')}
          error={showError('courseSlug')}
        >
          {courses?.map((course) => (
            <option key={course.slug} value={course.slug}>
              {course.title}
            </option>
          ))}
          <option value={NOT_SURE_COURSE}>Not sure yet — help me choose</option>
        </SelectField>

        <SelectField
          id={`${uid}-qualification`}
          label="Education / Qualification"
          placeholder="Select your highest qualification"
          value={values.qualification}
          onChange={set('qualification')}
          onBlur={blur('qualification')}
          error={showError('qualification')}
        >
          {qualifications.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </SelectField>

        <fieldset className="field field--wide">
          <legend>Preferred mode of contact</legend>
          <div className="mode-options">
            {MODES.map(({ id, label, Icon }) => (
              <label key={id} className={`mode-option mode-option--${id}${values.contactMode === id ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  value={id}
                  checked={values.contactMode === id}
                  onChange={set('contactMode')}
                />
                {full && <span className="mode-option__radio" aria-hidden="true" />}
                <Icon size={18} aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {full && (
          <div className={`field field--wide${showError('consent') ? ' has-error' : ''}`}>
            <label className="consent">
              <input type="checkbox" checked={values.consent} onChange={set('consent')} />
              <span className="consent__box" aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>
                I’m happy for {site.name} to contact me about this enquiry by my preferred method. My details will be used only
                to support this request.
              </span>
            </label>
            {showError('consent') && <p className="field__error">{errors.consent}</p>}
          </div>
        )}

        <div className="enquiry__hp" aria-hidden="true">
          <label>
            Leave this field empty
            <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
          </label>
        </div>
      </div>

      {status === 'error' && (
        <p className="enquiry__alert" role="alert">
          Sorry, we couldn't submit your enquiry. Please try again, or call us on {site.phone}.
        </p>
      )}

      <button
        type="submit"
        className={`btn btn--primary btn--block ${full ? 'btn--lg btn--glow' : 'btn--lg'}`}
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? (
          <>
            <span className="spinner" aria-hidden="true" /> Submitting…
          </>
        ) : (
          <>
            {full ? 'Submit course enquiry' : 'Request a callback'} <ArrowRight size={18} />
          </>
        )}
      </button>

      {full ? (
        <p className="enquiry__secure">
          <Lock size={13} /> Your information is secure and never sold.
        </p>
      ) : (
        <p className="enquiry__fineprint">
          By submitting, you agree to be contacted about {site.name} courses. We never share your details.
        </p>
      )}
    </form>
  )
}
