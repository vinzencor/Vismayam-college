import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, ChevronRight, CircleCheck, Quote, ShieldCheck } from 'lucide-react'
import { CourseCard, CourseCardSkeleton } from '../components/CourseCard.jsx'
import { EnquiryForm } from '../components/EnquiryForm.jsx'
import { Icon } from '../components/Icon.jsx'
import { Img } from '../components/Img.jsx'
import { Reveal } from '../components/Reveal.jsx'
import { Stars } from '../components/Stars.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getCourses } from '../services/courses.js'
import { getHomeContent, getTestimonials } from '../services/content.js'
import { homeDefaults } from '../data/home.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './Home.css'

const steps = [
  { title: 'Choose your course', text: 'Browse focused career tracks designed around outcomes, not just content hours.' },
  { title: 'Join your cohort', text: 'Start with a structured cohort schedule, live sessions and a community of peers.' },
  { title: 'Build real projects', text: 'Apply every concept to industry briefs with mentor feedback at every milestone.' },
  { title: 'Launch your career', text: 'Graduate with a verified portfolio, CV support and access to our hiring network.' },
]

const features = [
  {
    icon: 'presentation',
    title: 'Live, mentor-led learning',
    text: 'Learn in focused cohorts with expert guidance, practical feedback and weekly momentum.',
  },
  {
    icon: 'briefcase',
    title: 'Portfolio-ready projects',
    text: 'Build work based on real briefs, so every assignment moves your career story forward.',
  },
  {
    icon: 'users',
    title: 'Career support that stays',
    text: 'Get CV reviews, mock interviews and access to a growing hiring and alumni network.',
  },
]

// Testimonials are managed in the admin; with more than one, dots switch between them.
function Stories({ testimonials, stats }) {
  const [index, setIndex] = useState(0)
  const story = testimonials?.[index] ?? testimonials?.[0]

  return (
    <section className="story section" id="stories">
      <div className="container story__grid">
        <Reveal className="story__visual">
          <Img key={story?.id} src={story?.photo} alt={story ? `${story.name}, Vismayam College graduate` : ''} className="story__img" />
          {story?.metricValue && (
            <div className="story__metric">
              <strong>{story.metricValue}</strong>
              <span>{story.metricLabel}</span>
            </div>
          )}
        </Reveal>

        <Reveal className="story__content" delay={120}>
          <span className="eyebrow">Student outcomes</span>
          <Quote className="story__quote-mark" size={40} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {story ? (
            <>
              <blockquote className="story__quote" aria-live="polite">
                {story.quote}
              </blockquote>
              <div className="story__author">
                <Img key={story.id} src={story.avatar || story.photo} alt="" />
                <div>
                  <p>{story.name}</p>
                  <span>{story.role}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="story__quote story__quote--loading skeleton" aria-hidden="true" />
          )}
          {testimonials?.length > 1 && (
            <div className="story__dots">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className={`story__dot${i === index ? ' is-active' : ''}`}
                  aria-label={`Show story ${i + 1} of ${testimonials.length}: ${t.name}`}
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
          <dl className="story__stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  useDocumentTitle()
  const { data: courses, loading } = useAsync(getCourses, [])
  const { data: home, loading: homeLoading } = useAsync(getHomeContent, [])
  const { data: testimonials } = useAsync(getTestimonials, [])
  const popular = (courses ?? []).filter((c) => c.isCareerTrack).slice(0, 3)
  // Text falls back to the defaults while loading; images wait so the old photo never flashes.
  const content = home ?? homeDefaults
  const img = (src) => (homeLoading ? null : src)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="home-hero bg-blush">
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <span className="chip home-hero__chip">
              <span className="pulse-dot" aria-hidden="true" />
              {content.cohortBanner}
            </span>
            <h1 className="display">
              Learn skills that turn <span className="text-red">ambition</span> into progress.
            </h1>
            <p className="lead home-hero__lead">
              Practical, mentor-led courses built for real careers—not endless watching. Learn with structure, build proof of
              skill, and move forward with confidence.
            </p>
            <div className="home-hero__actions">
              <Link to="/courses" className="btn btn--primary">
                Explore all courses <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="btn btn--outline">
                Talk to an advisor
              </Link>
            </div>
            <div className="home-hero__proof">
              <div className="avatar-stack" aria-hidden="true">
                {content.heroAvatars.filter(Boolean).map((src, i) => (
                  <Img key={`${i}-${src}`} src={img(src)} alt="" />
                ))}
              </div>
              <div>
                <p className="home-hero__rating">
                  <strong>{content.heroRating}</strong> <Stars size={13} />
                </p>
                <p className="home-hero__rating-sub">{content.heroRatingLabel}</p>
              </div>
            </div>
          </div>

          <div className="home-hero__visual">
            <Img src={img(content.heroImage)} alt={content.heroImageAlt} className="home-hero__img" eager />
            {content.completionBadge && (
              <span className="home-hero__badge">
                <CircleCheck size={18} /> {content.completionBadge}
              </span>
            )}
            {content.liveClass.title && (
              <div className="live-card">
                <div className="live-card__top">
                  <span className="live-card__label">Live class</span>
                  <span className="live-card__now">Now</span>
                </div>
                <p className="live-card__title">{content.liveClass.title}</p>
                <div className="live-card__host">
                  <Img src={img(content.liveClass.hostPhoto)} alt="" />
                  <div>
                    <p>{content.liveClass.hostName}</p>
                    <span>{content.liveClass.hostRole}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Trusted outcomes ---------- */}
      <section className="trust-bar" aria-label="Trusted outcomes">
        <div className="container trust-bar__inner">
          <p className="trust-bar__label">Trusted outcomes</p>
          <dl className="trust-bar__stats">
            {content.outcomes.map((item) => (
              <div key={item.label}>
                <dt>{item.value}</dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </dl>
          <p className="trust-bar__badge">
            <ShieldCheck size={22} /> Industry-reviewed curriculum
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section" id="how-it-works">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <span className="eyebrow eyebrow--center">Your learning journey</span>
            <h2 className="h2">How Vismayam College works</h2>
            <p className="lead">From enrolment to career-ready—here's what your journey looks like, step by step.</p>
          </Reveal>

          <ol className="steps">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.title} className="step" delay={i * 90}>
                <span className={`step__num${i === 0 ? ' is-first' : ''}`}>{i + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
                {i < steps.length - 1 && <ChevronRight className="step__chevron" size={18} aria-hidden="true" />}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Popular courses ---------- */}
      <section className="section bg-blush">
        <div className="container">
          <Reveal className="section-head section-head--split">
            <div className="section-head__text">
              <span className="eyebrow">Popular right now</span>
              <h2 className="h2">Courses built for your next move</h2>
              <p className="lead">Choose a focused learning path with live teaching, hands-on projects and mentor feedback.</p>
            </div>
            <Link to="/courses" className="btn btn--outline">
              View all courses <ArrowRight size={18} />
            </Link>
          </Reveal>

          <div className="course-grid">
            {loading
              ? Array.from({ length: 3 }, (_, i) => <CourseCardSkeleton key={i} />)
              : popular.map((course, i) => (
                  <Reveal key={course.slug} delay={i * 90}>
                    <CourseCard course={course} />
                  </Reveal>
                ))}
          </div>
        </div>
      </section>

      {/* ---------- Why choose us ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <span className="eyebrow eyebrow--center">Why students choose Vismayam College</span>
            <h2 className="h2">Everything you need to learn well—and prove it</h2>
            <p className="lead">A complete learning experience, designed around doing rather than simply watching.</p>
          </Reveal>

          <div className="features">
            {features.map((feature, i) => (
              <Reveal key={feature.title} className={`feature${i === 0 ? ' is-active' : ''}`} delay={i * 90}>
                <span className="feature__icon">
                  <Icon name={feature.icon} size={22} />
                </span>
                <div>
                  <h3 className="feature__title">{feature.title}</h3>
                  <p className="feature__text">{feature.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Student story ---------- */}
      {(testimonials === null || testimonials.length > 0) && (
        <Stories testimonials={testimonials} stats={content.storyStats} />
      )}

      {/* ---------- CTA band ---------- */}
      <section className="cta-band">
        <div className="container cta-band__inner">
          <div>
            <h2 className="cta-band__title">Ready to take the next step?</h2>
            <p className="cta-band__text">
              Talk to a Vismayam College advisor today—no pressure, just clear guidance on your path forward.
            </p>
          </div>
          <div className="cta-band__actions">
            <Link to="/contact#enquiry-form" className="btn btn--white">
              Enquire now <ArrowUpRight size={16} strokeWidth={2.4} />
            </Link>
            <Link to="/courses" className="btn btn--ghost-light">
              View all courses
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Recommendation form ---------- */}
      <section className="section bg-blush" id="recommend">
        <div className="container recommend">
          <Reveal className="recommend__copy">
            <span className="eyebrow">Not sure where to start?</span>
            <h2 className="h2">Let's find the right course together</h2>
            <p className="lead">
              Tell us what you want to achieve. A Vismayam College advisor will help you compare options, understand the
              workload and choose confidently.
            </p>
            <ul className="check-list">
              {['No pressure, just practical guidance', 'Course and payment questions answered', 'Reply within one working day'].map(
                (item) => (
                  <li key={item}>
                    <span className="check-dot">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <EnquiryForm variant="compact" source="home-recommendation" />
          </Reveal>
        </div>
      </section>
    </>
  )
}
