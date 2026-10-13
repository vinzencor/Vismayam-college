import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { formatPrice, formatStartDate } from '../../lib/format.js'
import { deleteCourse, listCategories, listCourses, setCoursePublished } from '../api.js'
import { ADMIN_BASE, Card, ErrorBox, PageHeader, Spinner, useToast } from '../ui.jsx'

export default function CoursesList() {
  const toast = useToast()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(
    () => Promise.all([listCourses(), listCategories()]).then(([courses, categories]) => ({ courses, categories })),
    [reload],
  )
  const [query, setQuery] = useState('')
  const [busySlug, setBusySlug] = useState(null)

  const categoryName = (id) => data?.categories.find((c) => c.id === id)?.name ?? id ?? '—'
  const q = query.trim().toLowerCase()
  const courses = (data?.courses ?? []).filter(
    (c) => !q || `${c.title} ${c.slug} ${categoryName(c.category)}`.toLowerCase().includes(q),
  )

  async function onTogglePublished(course) {
    setBusySlug(course.slug)
    try {
      await setCoursePublished(course.slug, !course.published)
      toast.success(course.published ? `"${course.title}" is now a draft.` : `"${course.title}" is live on the website.`)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusySlug(null)
    }
  }

  async function onDelete(course) {
    if (!window.confirm(`Delete "${course.title}"? This can't be undone.`)) return
    setBusySlug(course.slug)
    try {
      await deleteCourse(course.slug)
      toast.success('Course deleted.')
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(err)
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Courses"
        description="Everything shown on the courses page and each course detail page."
        actions={
          <Link to={`${ADMIN_BASE}/courses/new`} className="a-btn a-btn--primary">
            <Plus size={17} /> Add course
          </Link>
        }
      />

      {error && <ErrorBox error={error} onRetry={() => setReload((n) => n + 1)} />}

      <Card>
        <label className="a-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search courses</span>
          <input type="search" placeholder="Search courses…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        {loading && !data ? (
          <Spinner />
        ) : courses.length ? (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Starts</th>
                  <th>Status</th>
                  <th className="a-table__actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.slug}>
                    <td>
                      <Link to={`${ADMIN_BASE}/courses/${course.slug}`} className="a-row-title">
                        {course.image ? <img src={course.image} alt="" /> : <span className="a-thumb-empty" />}
                        <span>
                          <strong>{course.title}</strong>
                          <small>/{course.slug}</small>
                        </span>
                      </Link>
                    </td>
                    <td>{categoryName(course.category)}</td>
                    <td>{course.price != null ? formatPrice(course.price) : '—'}</td>
                    <td>{course.startDate ? formatStartDate(course.startDate) : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`a-status${course.published ? ' is-on' : ''}`}
                        onClick={() => onTogglePublished(course)}
                        disabled={busySlug === course.slug}
                        title={course.published ? 'Click to unpublish' : 'Click to publish'}
                      >
                        {course.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="a-table__actions">
                      <a
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="a-icon-btn"
                        aria-label={`View ${course.title} on the website`}
                        title="View on website"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <Link
                        to={`${ADMIN_BASE}/courses/${course.slug}`}
                        className="a-icon-btn"
                        aria-label={`Edit ${course.title}`}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="a-icon-btn a-icon-btn--danger"
                        onClick={() => onDelete(course)}
                        disabled={busySlug === course.slug}
                        aria-label={`Delete ${course.title}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="a-empty">
            <p>{q ? 'No courses match your search.' : 'No courses yet.'}</p>
            {!q && (
              <Link to={`${ADMIN_BASE}/courses/new`} className="a-btn a-btn--primary a-btn--sm">
                <Plus size={16} /> Add your first course
              </Link>
            )}
          </div>
        )}
      </Card>
    </>
  )
}
