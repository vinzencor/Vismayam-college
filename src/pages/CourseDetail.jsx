import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronRight, Download, Plus } from 'lucide-react'
import { CourseCard } from '../components/CourseCard.jsx'
import { Icon } from '../components/Icon.jsx'
import { Img } from '../components/Img.jsx'
import { Reveal } from '../components/Reveal.jsx'
import { Stars } from '../components/Stars.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getCourse, getCourses } from '../services/courses.js'
import { formatNumber, formatPrice, formatStartDate } from '../lib/format.js'
import { site } from '../config/site.js'
import NotFound from './NotFound.jsx'
import './CourseDetail.css'

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const inWords = (n) => numberWords[n] ?? String(n)

function downloadSyllabus(course) {
  if (course.syllabusUrl) {
    window.open(course.syllabusUrl, '_blank', 'noopener')
    return
  }
  const lines = [
    `${course.title} — Syllabus`,
    `${site.name}`,
    '',
    `${course.durationWeeks} weeks · ${course.delivery} · ${course.commitment}`,
    `${course.lessons} lessons · ${course.mentorReviews} mentor reviews · ${course.capstones} capstone`,
    '',
    ...course.curriculum.flatMap((m, i) => [
      `${String(i + 1).padStart(2, '0')}. ${m.title} (${m.weeks} weeks · ${m.lessons} lessons)`,
      `    ${m.description}`,
      ...(m.topics ?? []).map((t) => `    - ${t}`),
      '',
    ]),
    `Questions? ${site.email} · ${site.phone}`,
  ]
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `${course.slug}-syllabus.txt` })
  a.click()
  URL.revokeObjectURL(url)
}

function Curriculum({ modules }) {
  const [open, setOpen] = useState(0)

  return (
    <div className="modules">
      {modules.map((module, i) => {
        const isOpen = open === i
        const panelId = `module-panel-${i}`
        return (
          <div key={`${i}-${module.title}`} className={`module${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="module__head"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="module__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="module__text">
                <span className="module__title">{module.title}</span>
                <span className="module__desc">{module.description}</span>
              </span>
              <span className="module__meta">
                {module.weeks} weeks · {module.lessons} lessons
              </span>
              <Plus className="module__toggle" size={20} aria-hidden="true" />
            </button>
            <div id={panelId} className="module__panel" role="region" aria-label={module.title} hidden={!isOpen}>
              <ul>
                {module.topics?.map((topic) => (
                  <li key={topic}>
                    <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <section className="detail-hero">
      <div className="container detail-hero__grid">
        <div className="skeleton" style={{ height: 420 }} />
        <div className="skeleton" style={{ height: 560 }} />
      </div>
    </section>
  )
}

export default function CourseDetail() {
  const { slug } = useParams()
  const { data: course, loading } = useAsync(() => getCourse(slug), [slug])
  const { data: allCourses } = useAsync(getCourses, [])
  useDocumentTitle(course?.title, course?.summary)

  if (loading) return <DetailSkeleton />
  if (!course) return <NotFound message="We couldn't find that course. It may have moved or been renamed." />

  const enquireHref = `/contact?course=${course.slug}`
  const related = (allCourses ?? [])
    .filter((c) => c.slug !== course.slug)
    .sort((a, b) => (b.category === course.category) - (a.category === course.category) || b.popularity - a.popularity)
    .slice(0, 3)

  const facts = [
    { icon: 'calendar', label: 'Duration', value: `${course.durationWeeks} weeks` },
    { icon: 'video', label: 'Format', value: course.delivery },
    { icon: 'clock', label: 'Commitment', value: course.commitment },
    { icon: 'award', label: 'Certificate', value: course.certificate },
  ]

  const highlights = [
    { icon: 'users', value: `${formatNumber(course.learners)}+`, label: 'Learners enrolled' },
    { icon: 'star', value: `${course.rating} / 5`, label: 'Average rating' },
    { icon: 'briefcase', value: `${course.jobRate}%`, label: 'Graduate job rate' },
    { icon: 'shield', value: `${course.guaranteeDays}-day`, label: 'Money-back guarantee' },
    { icon: 'award', value: 'Certified', label: 'Industry-recognised' },
  ]

  const { instructor } = course

  return (
    <>
      {/* ---------- Breadcrumb ---------- */}
      <div className="breadcrumb-bar">
        <nav className="container breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to="/courses">Courses</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{course.shortTitle}</span>
        </nav>
      </div>

      {/* ---------- Hero ---------- */}
      <section className="detail-hero">
        <div className="container detail-hero__grid">
          <div className="detail-hero__copy">
            <div className="detail-hero__tags">
              <span className="tag tag--red">{course.trackLabel}</span>
              {course.isBestseller && <span className="tag tag--green">Bestseller</span>}
            </div>
            <h1 className="h1">{course.title}</h1>
            <p className="lead">{course.summary}</p>
            <p className="detail-hero__rating">
              <Stars size={15} />
              <strong>{course.rating}</strong>
              <span>{formatNumber(course.reviewCount)} reviews</span>
              <span className="detail-hero__sep" aria-hidden="true" />
              <span>{formatNumber(course.learners)} learners enrolled</span>
            </p>
            <ul className="facts">
              {facts.map((fact) => (
                <li key={fact.label} className="fact">
                  <span className="fact__icon">
                    <Icon name={fact.icon} size={18} />
                  </span>
                  <span>
                    <span className="fact__label">{fact.label}</span>
                    <span className="fact__value">{fact.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="enroll-card" aria-label="Enrolment">
            <Img src={course.image} alt="" className="enroll-card__img" eager />
            <div className="enroll-card__body">
              <div className="enroll-card__status">
                <span className={`seat-pill${course.seatsAvailable ? '' : ' is-full'}`}>
                  {course.seatsAvailable ? 'Seats available' : 'Waitlist open'}
                </span>
                {course.startDate && (
                  <span className="enroll-card__start">Starts {formatStartDate(course.startDate)}</span>
                )}
              </div>
              <p className="enroll-card__price">
                <strong>{formatPrice(course.price)}</strong>
                {course.originalPrice > course.price && <s>{formatPrice(course.originalPrice)}</s>}
              </p>
              {course.monthlyPrice > 0 && (
                <p className="enroll-card__emi">
                  or {formatPrice(course.monthlyPrice)}/month · flexible {course.installments}-month plan
                </p>
              )}
              <div className="enroll-card__actions">
                <Link to={enquireHref} className="btn btn--primary btn--lg btn--block btn--glow">
                  {course.seatsAvailable ? 'Enroll in this course' : 'Join the waitlist'} <ArrowRight size={18} />
                </Link>
                <Link to={enquireHref} className="btn btn--soft btn--block">
                  Talk to a course advisor
                </Link>
              </div>
              <ul className="check-list enroll-card__list">
                {[
                  `${course.guaranteeDays}-day change-of-mind guarantee`,
                  'Certificate and career support included',
                  'Secure online payment',
                ].map((item) => (
                  <li key={item}>
                    <span className="check-dot">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------- Highlights bar ---------- */}
      <section className="highlights" aria-label="Course highlights">
        <div className="container">
          <ul className="highlights__list">
            {highlights.map((h) => (
              <li key={h.label}>
                <span className="highlights__icon">
                  <Icon name={h.icon} size={17} />
                </span>
                <span>
                  <strong>{h.value}</strong>
                  <span>{h.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Curriculum ---------- */}
      <section className="section" id="curriculum">
        <div className="container">
          <Reveal className="section-head section-head--split">
            <div className="section-head__text">
              <span className="eyebrow">Curriculum</span>
              <h2 className="h2">
                A clear path from <span className="text-red">foundations</span> to portfolio
              </h2>
              <p className="lead">
                {course.lessons} live and on-demand lessons, {inWords(course.mentorReviews)} mentor reviews and{' '}
                {inWords(course.capstones)} complete capstone project.
              </p>
            </div>
            <div className="totals">
              <div className="totals__item totals__item--red">
                <strong>{course.lessons}</strong>
                <span>lessons</span>
              </div>
              <div className="totals__item totals__item--green">
                <strong>{course.mentorReviews}</strong>
                <span>mentor reviews</span>
              </div>
              <div className="totals__item">
                <strong>{course.capstones}</strong>
                <span>capstone</span>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <Curriculum modules={course.curriculum} />
          </Reveal>

          <div className="syllabus-cta">
            <button type="button" className="btn btn--soft" onClick={() => downloadSyllabus(course)}>
              Download syllabus <Download size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Outcomes ---------- */}
      {course.outcomes?.length > 0 && (
        <section className="section bg-mist">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">What you'll be able to do</span>
              <h2 className="h2 outcomes__title">
                {course.outcomesHeading?.lead} <span className="text-red">{course.outcomesHeading?.highlight}</span>
              </h2>
              <p className="lead">{course.outcomesIntro}</p>
            </Reveal>

            <div className="outcomes">
              {course.outcomes.map((o, i) => (
                <Reveal key={`${i}-${o.title}`} className="outcome" delay={i * 80}>
                  <span className="icon-tile">
                    <Icon name={o.icon} size={20} />
                  </span>
                  <h3 className="outcome__title">{o.title}</h3>
                  <p className="outcome__text">{o.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Instructor ---------- */}
      {instructor?.name && (
        <section className="section instructor bg-ink">
          <div className="container instructor__grid">
            <Reveal className="instructor__photo">
              <Img src={instructor.photo} alt={instructor.name} />
            </Reveal>
            <Reveal className="instructor__content" delay={120}>
              <span className="eyebrow">Meet your lead instructor</span>
              <h2 className="instructor__name">{instructor.name}</h2>
              <p className="instructor__role">{instructor.role}</p>
              <p className="instructor__bio">{instructor.bio}</p>
              <dl className="instructor__stats">
                <div>
                  <dt>{instructor.years} yrs</dt>
                  <dd>industry experience</dd>
                </div>
                <div>
                  <dt>{formatNumber(instructor.learnersMentored)}+</dt>
                  <dd>learners mentored</dd>
                </div>
                <div>
                  <dt>{instructor.rating}/5</dt>
                  <dd>mentor rating</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head section-head--split">
              <div className="section-head__text">
                <span className="eyebrow">Keep exploring</span>
                <h2 className="h2">
                  You may <span className="text-red">also like</span>
                </h2>
              </div>
              <Link to="/courses" className="btn btn--soft">
                View all courses <ArrowRight size={18} />
              </Link>
            </Reveal>
            <div className="course-grid">
              {related.map((c, i) => (
                <Reveal key={c.slug} delay={i * 80}>
                  <CourseCard course={c} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Enquiry CTA ---------- */}
      <section className="detail-cta-wrap">
        <div className="container">
          <Reveal className="detail-cta">
            <div>
              <span className="detail-cta__eyebrow">Ready to get started?</span>
              <h2 className="detail-cta__title">Questions before you enroll?</h2>
              <p className="detail-cta__text">
                Talk through the curriculum, workload and payment options with a friendly course advisor.
              </p>
            </div>
            <Link to={enquireHref} className="btn btn--white btn--lg">
              Make an enquiry <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Mobile sticky enrol bar ---------- */}
      <div className="mobile-enroll">
        <div>
          <strong>{formatPrice(course.price)}</strong>
          {course.monthlyPrice > 0 && <span>or {formatPrice(course.monthlyPrice)}/mo</span>}
        </div>
        <Link to={enquireHref} className="btn btn--primary btn--sm">
          Enroll now <ArrowRight size={16} />
        </Link>
      </div>
    </>
  )
}
