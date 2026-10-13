import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { levels } from '../../data/courses.js'
import { deleteCourse, getCourse, listCategories, listCourses, saveCourse, slugify } from '../api.js'
import {
  ADMIN_BASE,
  Card,
  ErrorBox,
  Field,
  IconSelect,
  ImageField,
  ListEditor,
  NumberInput,
  PageHeader,
  PdfField,
  Select,
  Spinner,
  TextArea,
  TextInput,
  Toggle,
  useToast,
  useUnsavedWarning,
} from '../ui.jsx'

// Suggestions only — any text is allowed. "Live online" also powers the "Live online" quick filter.
const DELIVERY_OPTIONS = ['Live online', 'Mentor-led', 'Project-based', 'Small cohort', 'Self-paced']
const SLUG_PATTERN = '[a-z0-9]+(-[a-z0-9]+)*'

const blankInstructor = () => ({ name: '', role: '', bio: '', photo: '', years: null, learnersMentored: null, rating: null })

const blankCourse = () => ({
  slug: '',
  title: '',
  shortTitle: '',
  category: '',
  trackLabel: '',
  isCareerTrack: false,
  isBestseller: false,
  delivery: 'Live online',
  level: 'beginner',
  durationWeeks: 12,
  commitment: '6–8 hrs/week',
  certificate: 'Included',
  rating: 4.8,
  reviewCount: 0,
  learners: 0,
  price: null,
  originalPrice: null,
  monthlyPrice: null,
  installments: 6,
  startDate: '',
  seatsAvailable: true,
  jobRate: null,
  guaranteeDays: 7,
  popularity: 50,
  image: '',
  summary: '',
  mentorReviews: 3,
  capstones: 1,
  curriculum: [],
  outcomesHeading: { lead: 'Graduate ready to', highlight: '' },
  outcomesIntro: '',
  outcomes: [],
  instructor: blankInstructor(),
  syllabusUrl: '',
  published: true,
})

const blankModule = () => ({ title: '', description: '', weeks: 2, lessons: 6, topics: [] })
const blankOutcome = () => ({ icon: 'sparkles', title: '', description: '' })

// Makes sure the nested fields the form binds to exist, even on rows saved without them.
function withDefaults(course) {
  const blank = blankCourse()
  return {
    ...blank,
    ...course,
    curriculum: course.curriculum ?? [],
    outcomes: course.outcomes ?? [],
    outcomesHeading: { ...blank.outcomesHeading, ...course.outcomesHeading },
    instructor: { ...blank.instructor, ...course.instructor },
  }
}

// Cleans form state before saving: trims text, drops blank topics, empty strings → null.
function prepare(course) {
  const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null)
  return {
    ...course,
    slug: course.slug.trim(),
    title: course.title.trim(),
    shortTitle: text(course.shortTitle) ?? course.title.trim(),
    category: text(course.category),
    trackLabel: text(course.trackLabel),
    image: text(course.image),
    syllabusUrl: text(course.syllabusUrl),
    startDate: course.startDate || null,
    summary: text(course.summary),
    outcomesIntro: text(course.outcomesIntro),
    curriculum: course.curriculum.map((m) => ({
      ...m,
      title: (m.title ?? '').trim(),
      description: m.description?.trim() ?? '',
      weeks: m.weeks ?? 0,
      lessons: m.lessons ?? 0,
      topics: (m.topics ?? []).map((t) => t.trim()).filter(Boolean),
    })),
    outcomes: course.outcomes.map((o) => ({ ...o, title: (o.title ?? '').trim(), description: o.description?.trim() ?? '' })),
    instructor: course.instructor?.name?.trim() ? course.instructor : null,
  }
}

const uniqueInstructors = (courses) => [
  ...new Map(courses.filter((c) => c.instructor?.name).map((c) => [c.instructor.name, c.instructor])).values(),
]

export default function CourseEditor() {
  const { slug: routeSlug } = useParams()
  const isNew = !routeSlug
  const navigate = useNavigate()
  const toast = useToast()

  const { data, error } = useAsync(async () => {
    const [categories, courses, course] = await Promise.all([
      listCategories(),
      listCourses(),
      isNew ? null : getCourse(routeSlug),
    ])
    return { slug: routeSlug, categories, instructors: uniqueInstructors(courses), course }
  }, [routeSlug])

  const [course, setCourse] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    const initial = data.course ? withDefaults(data.course) : blankCourse()
    setCourse(initial)
    setSavedSnapshot(JSON.stringify(initial))
    setSlugTouched(Boolean(data.course))
  }, [data])

  const dirty = course !== null && JSON.stringify(course) !== savedSnapshot
  useUnsavedWarning(dirty)

  if (error) return <ErrorBox error={error} />
  // `data.slug` lags behind the URL for a moment after creating or renaming a course.
  if (!data || !course || data.slug !== routeSlug) return <Spinner />
  if (!isNew && !data.course) {
    return (
      <>
        <PageHeader title="Course not found" description={`There's no course with the slug "${routeSlug}".`} />
        <Link to={`${ADMIN_BASE}/courses`} className="a-btn a-btn--ghost">
          <ArrowLeft size={16} /> Back to courses
        </Link>
      </>
    )
  }

  const set = (key) => (value) => setCourse((c) => ({ ...c, [key]: value }))
  const setInstructor = (key) => (value) => setCourse((c) => ({ ...c, instructor: { ...c.instructor, [key]: value } }))
  const setHeading = (key) => (value) =>
    setCourse((c) => ({ ...c, outcomesHeading: { ...c.outcomesHeading, [key]: value } }))

  function onTitle(title) {
    setCourse((c) => ({ ...c, title, ...(slugTouched ? {} : { slug: slugify(title) }) }))
  }

  const totalWeeks = course.curriculum.reduce((sum, m) => sum + (m.weeks || 0), 0)
  const totalLessons = course.curriculum.reduce((sum, m) => sum + (m.lessons || 0), 0)

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const result = withDefaults(await saveCourse(prepare(course), isNew ? null : routeSlug))
      setCourse(result)
      setSavedSnapshot(JSON.stringify(result))
      toast.success(isNew ? 'Course created.' : 'Changes saved.')
      if (result.slug !== routeSlug) navigate(`${ADMIN_BASE}/courses/${result.slug}`, { replace: true })
    } catch (err) {
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete "${course.title}"? This can't be undone.`)) return
    try {
      await deleteCourse(routeSlug)
      setSavedSnapshot(JSON.stringify(course)) // nothing left to warn about
      toast.success('Course deleted.')
      navigate(`${ADMIN_BASE}/courses`)
    } catch (err) {
      toast.error(err)
    }
  }

  const categoryOptions = data.categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <form onSubmit={onSubmit} className="a-editor">
      <PageHeader
        title={isNew ? 'New course' : course.title || 'Untitled course'}
        description={isNew ? 'Fill in the details, then save. Everything here appears on the course detail page.' : undefined}
        actions={
          !isNew && (
            <>
              <a href={`/courses/${routeSlug}`} target="_blank" rel="noreferrer" className="a-btn a-btn--ghost">
                <ExternalLink size={16} /> View on website
              </a>
              <button type="button" className="a-btn a-btn--danger-ghost" onClick={onDelete}>
                <Trash2 size={16} /> Delete
              </button>
            </>
          )
        }
      >
        <Link to={`${ADMIN_BASE}/courses`} className="a-back">
          <ArrowLeft size={15} /> All courses
        </Link>
      </PageHeader>

      <Card title="Basics" description="Name, category and the short description shown at the top of the course page.">
        <div className="a-grid">
          <TextInput label="Course title" value={course.title} onChange={onTitle} required wide />
          <TextInput
            label="Short title"
            hint="Used in breadcrumbs. Defaults to the full title."
            value={course.shortTitle}
            onChange={set('shortTitle')}
          />
          <TextInput
            label="URL slug"
            hint={`Page address: /courses/${course.slug || 'your-course'}`}
            value={course.slug}
            onChange={(v) => {
              setSlugTouched(true)
              set('slug')(v.toLowerCase())
            }}
            pattern={SLUG_PATTERN}
            title="Lowercase letters, numbers and single hyphens, e.g. data-analytics"
            required
          />
          <Select
            label="Category"
            value={course.category}
            onChange={set('category')}
            options={categoryOptions}
            placeholder="Choose a category"
            hint={categoryOptions.length ? undefined : 'No categories yet — add one under Categories first.'}
            required
          />
          <TextInput
            label="Track label"
            hint='Red tag above the title, e.g. "Design career track"'
            value={course.trackLabel}
            onChange={set('trackLabel')}
          />
          <TextArea label="Summary" value={course.summary} onChange={set('summary')} rows={4} />
          <div className="a-field a-field--wide a-toggles">
            <Toggle
              label="Published"
              hint="Visible on the website. Turn off to keep it as a draft."
              checked={course.published}
              onChange={set('published')}
            />
            <Toggle
              label="Career track"
              hint='Shown on the homepage "Popular" section and the Career tracks filter.'
              checked={course.isCareerTrack}
              onChange={set('isCareerTrack')}
            />
            <Toggle label="Bestseller" hint="Adds a green Bestseller tag." checked={course.isBestseller} onChange={set('isBestseller')} />
          </div>
        </div>
      </Card>

      <Card title="Images & files">
        <div className="a-grid">
          <ImageField
            label="Course image"
            hint="Shown on course cards and the enrolment card. Landscape, at least 1000×700."
            value={course.image}
            onChange={set('image')}
            folder="courses"
          />
          <PdfField
            label="Syllabus PDF (optional)"
            hint="If empty, the Download syllabus button generates a text file from the curriculum."
            value={course.syllabusUrl}
            onChange={set('syllabusUrl')}
            folder="syllabus"
          />
        </div>
      </Card>

      <Card title="Format & schedule">
        <div className="a-grid a-grid--3">
          <Select
            label="Level"
            value={course.level}
            onChange={set('level')}
            options={levels.map((l) => ({ value: l.id, label: l.name }))}
          />
          <Field label="Delivery" htmlFor="course-delivery">
            <input
              id="course-delivery"
              className="a-input"
              list="delivery-options"
              value={course.delivery ?? ''}
              onChange={(e) => set('delivery')(e.target.value)}
            />
            <datalist id="delivery-options">
              {DELIVERY_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>
          <NumberInput label="Duration (weeks)" value={course.durationWeeks} onChange={set('durationWeeks')} min={1} required />
          <TextInput label="Weekly commitment" value={course.commitment} onChange={set('commitment')} placeholder="6–8 hrs/week" />
          <TextInput label="Certificate" value={course.certificate} onChange={set('certificate')} placeholder="Included" />
          <Field label="Start date" htmlFor="course-start">
            <input
              id="course-start"
              type="date"
              className="a-input"
              value={course.startDate ?? ''}
              onChange={(e) => set('startDate')(e.target.value)}
            />
          </Field>
          <div className="a-field a-field--wide">
            <Toggle
              label="Seats available"
              hint='Off shows "Waitlist open" and a Join the waitlist button.'
              checked={course.seatsAvailable}
              onChange={set('seatsAvailable')}
            />
          </div>
        </div>
      </Card>

      <Card title="Pricing" description="Amounts in rupees, without commas.">
        <div className="a-grid a-grid--3">
          <NumberInput label="Price (₹)" value={course.price} onChange={set('price')} min={0} required />
          <NumberInput
            label="Original price (₹)"
            hint="Shown struck through when higher than the price."
            value={course.originalPrice}
            onChange={set('originalPrice')}
            min={0}
          />
          <NumberInput label="Monthly instalment (₹)" value={course.monthlyPrice} onChange={set('monthlyPrice')} min={0} />
          <NumberInput label="Number of instalments" value={course.installments} onChange={set('installments')} min={1} />
          <NumberInput label="Money-back guarantee (days)" value={course.guaranteeDays} onChange={set('guaranteeDays')} min={0} />
        </div>
      </Card>

      <Card title="Ratings & numbers" description="Shown in the course hero, highlights bar and course cards.">
        <div className="a-grid a-grid--3">
          <NumberInput label="Rating (out of 5)" value={course.rating} onChange={set('rating')} min={0} max={5} step={0.1} />
          <NumberInput label="Number of reviews" value={course.reviewCount} onChange={set('reviewCount')} min={0} />
          <NumberInput label="Learners enrolled" value={course.learners} onChange={set('learners')} min={0} />
          <NumberInput label="Graduate job rate (%)" value={course.jobRate} onChange={set('jobRate')} min={0} max={100} />
          <NumberInput label="Mentor reviews" value={course.mentorReviews} onChange={set('mentorReviews')} min={0} />
          <NumberInput label="Capstone projects" value={course.capstones} onChange={set('capstones')} min={0} />
          <NumberInput
            label="Popularity"
            hint="Higher numbers appear first in lists."
            value={course.popularity}
            onChange={set('popularity')}
            min={0}
            required
          />
        </div>
      </Card>

      <Card
        title="Curriculum"
        description={`${course.curriculum.length} modules · ${totalWeeks} weeks · ${totalLessons} lessons${
          totalWeeks && totalWeeks !== course.durationWeeks ? ` (course duration is ${course.durationWeeks} weeks)` : ''
        }`}
      >
        <ListEditor
          items={course.curriculum}
          onChange={set('curriculum')}
          createItem={blankModule}
          itemLabel={(m, i) => `Module ${String(i + 1).padStart(2, '0')}${m.title ? ` · ${m.title}` : ''}`}
          addLabel="Add module"
          renderItem={(m, update) => (
            <>
              <TextInput label="Module title" value={m.title} onChange={(v) => update({ ...m, title: v })} required wide />
              <TextArea label="Description" value={m.description} onChange={(v) => update({ ...m, description: v })} rows={2} />
              <NumberInput label="Weeks" value={m.weeks} onChange={(v) => update({ ...m, weeks: v })} min={0} />
              <NumberInput label="Lessons" value={m.lessons} onChange={(v) => update({ ...m, lessons: v })} min={0} />
              <TextArea
                label="Topics"
                hint="One topic per line."
                value={(m.topics ?? []).join('\n')}
                onChange={(v) => update({ ...m, topics: v.split('\n') })}
                rows={4}
              />
            </>
          )}
        />
      </Card>

      <Card title="Outcomes" description={`"What you'll be able to do" section.`}>
        <div className="a-grid">
          <TextInput
            label="Heading"
            value={course.outcomesHeading.lead}
            onChange={setHeading('lead')}
            placeholder="Graduate ready to"
          />
          <TextInput
            label="Heading highlight (red)"
            value={course.outcomesHeading.highlight}
            onChange={setHeading('highlight')}
            placeholder="design with purpose"
          />
          <TextArea label="Intro" value={course.outcomesIntro} onChange={set('outcomesIntro')} rows={2} />
        </div>
        <ListEditor
          items={course.outcomes}
          onChange={set('outcomes')}
          createItem={blankOutcome}
          itemLabel={(o, i) => `Outcome ${i + 1}${o.title ? ` · ${o.title}` : ''}`}
          addLabel="Add outcome"
          renderItem={(o, update) => (
            <>
              <TextInput label="Title" value={o.title} onChange={(v) => update({ ...o, title: v })} required />
              <IconSelect value={o.icon} onChange={(v) => update({ ...o, icon: v })} />
              <TextArea label="Description" value={o.description} onChange={(v) => update({ ...o, description: v })} rows={2} />
            </>
          )}
        />
      </Card>

      <Card
        title="Lead instructor"
        description="Leave the name empty to hide the instructor section."
        actions={
          data.instructors.length > 0 && (
            <select
              className="a-input a-select a-input--sm a-copy-select"
              value=""
              onChange={(e) => {
                const picked = data.instructors.find((i) => i.name === e.target.value)
                if (picked) set('instructor')({ ...blankInstructor(), ...picked })
              }}
              aria-label="Copy an existing instructor"
            >
              <option value="">Copy existing instructor…</option>
              {data.instructors.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          )
        }
      >
        <div className="a-grid">
          <TextInput label="Name" value={course.instructor.name} onChange={setInstructor('name')} />
          <TextInput
            label="Role"
            value={course.instructor.role}
            onChange={setInstructor('role')}
            placeholder="Senior Product Designer · Formerly at …"
          />
          <TextArea label="Bio" value={course.instructor.bio} onChange={setInstructor('bio')} rows={3} />
          <ImageField
            label="Photo"
            hint="Portrait, at least 900×1100."
            value={course.instructor.photo}
            onChange={setInstructor('photo')}
            folder="instructors"
            shape="portrait"
          />
          <div className="a-grid a-grid--3 a-field--wide">
            <NumberInput label="Years of experience" value={course.instructor.years} onChange={setInstructor('years')} min={0} />
            <NumberInput
              label="Learners mentored"
              value={course.instructor.learnersMentored}
              onChange={setInstructor('learnersMentored')}
              min={0}
            />
            <NumberInput
              label="Mentor rating"
              value={course.instructor.rating}
              onChange={setInstructor('rating')}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
        </div>
      </Card>

      <div className="a-savebar">
        <span className={`a-savebar__status${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <Link to={`${ADMIN_BASE}/courses`} className="a-btn a-btn--ghost">
          Cancel
        </Link>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving || (!dirty && !isNew)}>
          {saving ? <Loader2 size={17} className="a-spin" /> : <Save size={17} />}
          {isNew ? 'Create course' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
