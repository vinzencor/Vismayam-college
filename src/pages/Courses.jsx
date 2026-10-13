import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown, Clock, Gauge, Layers, Search, UserRound, X } from 'lucide-react'
import { CourseCard, CourseCardSkeleton } from '../components/CourseCard.jsx'
import { Icon } from '../components/Icon.jsx'
import { Reveal } from '../components/Reveal.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getCategories, getCourses } from '../services/courses.js'
import { durations, levels } from '../data/courses.js'
import './Courses.css'

const PAGE_SIZE = 6

const quickFilters = [
  { label: 'Career tracks', key: 'track', value: 'career' },
  { label: 'Beginner-friendly', key: 'level', value: 'beginner' },
  { label: 'Live online', key: 'format', value: 'live' },
  { label: 'Under ₹25,000', key: 'budget', value: 'under-25k' },
]

const sorts = [
  { id: 'popular', label: 'Most popular', compare: (a, b) => b.popularity - a.popularity },
  { id: 'rating', label: 'Highest rated', compare: (a, b) => b.rating - a.rating || b.learners - a.learners },
  { id: 'price-asc', label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  { id: 'price-desc', label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  { id: 'shortest', label: 'Shortest first', compare: (a, b) => a.durationWeeks - b.durationWeeks },
]

function applyFilters(courses, params) {
  const q = params.get('q')?.trim().toLowerCase()
  const category = params.get('category')
  const level = params.get('level')
  const duration = durations.find((d) => d.id === params.get('duration'))

  return courses.filter((c) => {
    if (q && !`${c.title} ${c.summary} ${c.category} ${c.trackLabel}`.toLowerCase().includes(q)) return false
    if (category && c.category !== category) return false
    if (level && c.level !== level) return false
    if (duration && (c.durationWeeks < duration.min || c.durationWeeks > duration.max)) return false
    if (params.get('track') === 'career' && !c.isCareerTrack) return false
    if (params.get('format') === 'live' && c.delivery !== 'Live online') return false
    if (params.get('budget') === 'under-25k' && c.price >= 25000) return false
    return true
  })
}

function FilterSelect({ icon: IconCmp, label, value, onChange, options }) {
  return (
    <label className="filter-select">
      <IconCmp size={17} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  )
}

export default function Courses() {
  useDocumentTitle(
    'Courses',
    'Browse career-focused online courses in design, data, technology and marketing — with expert mentors, real projects and career support.',
  )
  const [params, setParams] = useSearchParams()
  const { data: courses, loading } = useAsync(getCourses, [])
  const { data: categories } = useAsync(getCategories, [])

  const sort = sorts.find((s) => s.id === params.get('sort')) ?? sorts[0]
  const filtered = useMemo(
    () => (courses ? applyFilters(courses, params).sort(sort.compare) : []),
    [courses, params, sort],
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), pageCount)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeFilterCount = ['q', 'category', 'level', 'duration', 'track', 'format', 'budget'].filter((k) =>
    params.get(k),
  ).length

  function update(changes, { scroll = false } = {}) {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in changes)) next.delete('page')
    setParams(next, { replace: true, preventScrollReset: true })
    if (scroll) document.getElementById('all-courses')?.scrollIntoView({ behavior: 'smooth' })
  }

  const countFor = (categoryId) => courses?.filter((c) => c.category === categoryId).length ?? 0
  const featuredCategories = (categories ?? []).filter((c) => c.featured)

  return (
    <>
      {/* ---------- Hero + search ---------- */}
      <section className="courses-hero bg-blush">
        <div className="container">
          <div className="courses-hero__grid">
            <div className="courses-hero__copy">
              <span className="eyebrow">Explore Vismayam College courses</span>
              <h1 className="h1">Find the skills for your next chapter</h1>
              <p className="lead">
                Focused online courses with expert mentors, real projects and career support. Start from scratch or sharpen
                the skills you already have.
              </p>
              <div className="courses-hero__actions">
                <a href="#all-courses" className="btn btn--primary">
                  Browse all courses
                </a>
                <Link to="/contact" className="btn btn--outline">
                  Talk to an advisor
                </Link>
              </div>
            </div>

            <aside className="count-card">
              <p className="count-card__value">
                {courses ? courses.length : '—'}
                <span>+</span>
              </p>
              <p className="count-card__label">career-focused courses</p>
              <p className="count-card__text">Every course includes expert feedback and a verified certificate.</p>
              <ul className="count-card__list">
                <li>Expert mentors from top companies</li>
                <li>Job placement support included</li>
              </ul>
            </aside>
          </div>

          <div className="course-search" role="search">
            <label className="course-search__input">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">Search courses</span>
              <input
                type="search"
                placeholder="Search by skill, career or course name"
                value={params.get('q') ?? ''}
                onChange={(e) => update({ q: e.target.value })}
              />
            </label>
            <div className="course-search__filters">
              <FilterSelect
                icon={Layers}
                label="All categories"
                value={params.get('category') ?? ''}
                onChange={(v) => update({ category: v })}
                options={categories ?? []}
              />
              <FilterSelect
                icon={Gauge}
                label="Any level"
                value={params.get('level') ?? ''}
                onChange={(v) => update({ level: v })}
                options={levels}
              />
              <FilterSelect
                icon={Clock}
                label="Any duration"
                value={params.get('duration') ?? ''}
                onChange={(v) => update({ duration: v })}
                options={durations}
              />
            </div>
          </div>

          <div className="quick-filters">
            <span>Popular:</span>
            {quickFilters.map((f) => {
              const active = params.get(f.key) === f.value
              return (
                <button
                  key={f.label}
                  type="button"
                  className={`quick-filter${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => update({ [f.key]: active ? '' : f.value })}
                >
                  {f.label}
                  {active && <X size={13} strokeWidth={2.6} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- Browse by goal ---------- */}
      <section className="section fields">
        <div className="container">
          <Reveal className="section-head section-head--split">
            <div className="section-head__text">
              <span className="eyebrow">Browse by goal</span>
              <h2 className="h2">Choose a field to explore</h2>
            </div>
            <p className="fields__hint">Not sure? Our advisors can help you match a course to your goals.</p>
          </Reveal>

          <div className="field-cards">
            {featuredCategories.map((cat, i) => {
              const active = params.get('category') === cat.id
              return (
                <Reveal key={cat.id} delay={i * 80}>
                  <button
                    type="button"
                    className={`field-card${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => update({ category: active ? '' : cat.id }, { scroll: true })}
                  >
                    <span className="field-card__top">
                      <span className="field-card__icon">
                        <Icon name={cat.icon} size={20} />
                      </span>
                      <span className="field-card__count">{countFor(cat.id)} courses</span>
                    </span>
                    <span className="field-card__name">{cat.name}</span>
                    <span className="field-card__blurb">{cat.blurb}</span>
                  </button>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- All courses ---------- */}
      <section className="section bg-blush" id="all-courses">
        <div className="container">
          <div className="list-head">
            <div>
              <h2 className="list-head__title">All courses</h2>
              <p className="list-head__count" aria-live="polite">
                {loading ? 'Loading courses…' : `Showing ${visible.length} of ${filtered.length} courses`}
              </p>
            </div>
            <div className="list-head__tools">
              {activeFilterCount > 0 && (
                <button type="button" className="clear-filters" onClick={() => setParams({}, { replace: true })}>
                  <X size={14} /> Clear filters ({activeFilterCount})
                </button>
              )}
              <label className="sort-select">
                <span>Sort by</span>
                <select value={sort.id} onChange={(e) => update({ sort: e.target.value === 'popular' ? '' : e.target.value })}>
                  {sorts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="course-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length ? (
            <div className="course-grid">
              {visible.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>No courses match those filters</h3>
              <p>Try a different search, or let an advisor point you to the right course.</p>
              <div className="empty-state__actions">
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setParams({}, { replace: true })}>
                  Reset filters
                </button>
                <Link to="/contact" className="btn btn--primary btn--sm">
                  Ask an advisor
                </Link>
              </div>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="pagination" aria-label="Course pages">
              {page > 1 && (
                <button
                  type="button"
                  className="pagination__btn"
                  aria-label="Previous page"
                  onClick={() => update({ page: String(page - 1) }, { scroll: true })}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pagination__btn${n === page ? ' is-active' : ''}`}
                  aria-current={n === page ? 'page' : undefined}
                  onClick={() => update({ page: n === 1 ? '' : String(n) }, { scroll: true })}
                >
                  {n}
                </button>
              ))}
              {page < pageCount && (
                <button
                  type="button"
                  className="pagination__btn"
                  aria-label="Next page"
                  onClick={() => update({ page: String(page + 1) }, { scroll: true })}
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </nav>
          )}

          {/* ---------- Advisor CTA ---------- */}
          <Reveal className="advisor-cta">
            <div>
              <span className="advisor-cta__eyebrow">
                <span className="advisor-cta__icon">
                  <UserRound size={16} />
                </span>
                Free advisor consultation
              </span>
              <h2 className="advisor-cta__title">Still comparing options?</h2>
              <p className="advisor-cta__text">
                Share your goals and schedule. We'll recommend the best-fit course—no pressure, no generic sales pitch.
              </p>
            </div>
            <Link to="/contact" className="btn btn--primary btn--lg btn--glow">
              Ask a course advisor <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
