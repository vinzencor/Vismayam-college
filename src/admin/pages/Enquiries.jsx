import { useState } from 'react'
import { Download, MessageCircle, Phone, Search, Trash2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { deleteEnquiry, listCourses, listEnquiries, setEnquiryContacted } from '../api.js'
import { Card, ErrorBox, PageHeader, Pill, Spinner, useToast } from '../ui.jsx'
import { courseLabel, formatDateTime, formatMobile } from '../format.js'

const FILTERS = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'all', label: 'All' },
]

function toCsv(rows, titles) {
  const header = ['Received (IST)', 'Name', 'Mobile', 'Course', 'Qualification', 'Contact via', 'Form', 'Contacted', 'Email sent']
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((e) =>
    [
      formatDateTime(e.createdAt),
      e.name,
      e.mobile,
      courseLabel(e.courseSlug, titles),
      e.qualification,
      e.contactMode,
      e.source,
      e.contacted ? 'yes' : 'no',
      e.emailSent ? 'yes' : 'no',
    ]
      .map(escape)
      .join(','),
  )
  return [header.map(escape).join(','), ...lines].join('\n')
}

export default function Enquiries() {
  const toast = useToast()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(
    () =>
      Promise.all([listEnquiries(), listCourses()]).then(([enquiries, courses]) => ({
        enquiries,
        titles: Object.fromEntries(courses.map((c) => [c.slug, c.title])),
      })),
    [reload],
  )
  const [filter, setFilter] = useState('new')
  const [query, setQuery] = useState('')
  // Optimistic overrides so ticking "contacted" feels instant.
  const [overrides, setOverrides] = useState({})

  const enquiries = (data?.enquiries ?? []).map((e) => (e.id in overrides ? { ...e, contacted: overrides[e.id] } : e))
  const q = query.trim().toLowerCase()
  const visible = enquiries.filter((e) => {
    if (filter === 'new' && e.contacted) return false
    if (filter === 'contacted' && !e.contacted) return false
    if (!q) return true
    return `${e.name} ${e.mobile} ${courseLabel(e.courseSlug, data.titles)}`.toLowerCase().includes(q)
  })
  const counts = {
    new: enquiries.filter((e) => !e.contacted).length,
    contacted: enquiries.filter((e) => e.contacted).length,
    all: enquiries.length,
  }

  async function onToggle(e) {
    const next = !e.contacted
    setOverrides((o) => ({ ...o, [e.id]: next }))
    try {
      await setEnquiryContacted(e.id, next)
    } catch (err) {
      setOverrides((o) => ({ ...o, [e.id]: !next }))
      toast.error(err)
    }
  }

  async function onDelete(e) {
    if (!window.confirm(`Delete the enquiry from ${e.name}? This can't be undone.`)) return
    try {
      await deleteEnquiry(e.id)
      toast.success('Enquiry deleted.')
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(err)
    }
  }

  function onExport() {
    const blob = new Blob([`﻿${toCsv(visible, data.titles)}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Submissions from the enquiry forms. Tick “Contacted” once the team has followed up."
        actions={
          <button type="button" className="a-btn a-btn--ghost" onClick={onExport} disabled={!visible.length}>
            <Download size={16} /> Export CSV
          </button>
        }
      />

      {error && <ErrorBox error={error} onRetry={() => setReload((n) => n + 1)} />}

      <Card>
        <div className="a-toolbar">
          <div className="a-tabs" role="group" aria-label="Filter enquiries">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`a-tab${filter === f.id ? ' is-active' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label} <span>{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <label className="a-search a-search--inline">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search enquiries</span>
            <input type="search" placeholder="Search name, mobile or course…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {loading && !data ? (
          <Spinner />
        ) : visible.length ? (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Qualification</th>
                  <th>Contact via</th>
                  <th>Contacted</th>
                  <th className="a-table__actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const digits = e.mobile.replace(/^\+91/, '')
                  return (
                    <tr key={e.id} className={e.contacted ? 'is-muted' : ''}>
                      <td className="a-nowrap">
                        {formatDateTime(e.createdAt)}
                        {!e.emailSent && (
                          <div>
                            <Pill tone="amber" title={e.emailError ?? undefined}>
                              Email not sent
                            </Pill>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{e.name}</strong>
                        <div className="a-nowrap a-muted">{formatMobile(e.mobile)}</div>
                      </td>
                      <td>{courseLabel(e.courseSlug, data.titles)}</td>
                      <td>{e.qualification}</td>
                      <td>
                        {e.contactMode === 'whatsapp' ? (
                          <a href={`https://wa.me/91${digits}`} target="_blank" rel="noreferrer" className="a-contact a-contact--wa">
                            <MessageCircle size={15} /> WhatsApp
                          </a>
                        ) : (
                          <a href={`tel:+91${digits}`} className="a-contact">
                            <Phone size={15} /> Call
                          </a>
                        )}
                      </td>
                      <td>
                        <label className="a-check">
                          <input type="checkbox" checked={e.contacted} onChange={() => onToggle(e)} />
                          <span className="sr-only">Mark {e.name} as contacted</span>
                        </label>
                      </td>
                      <td className="a-table__actions">
                        <button
                          type="button"
                          className="a-icon-btn a-icon-btn--danger"
                          onClick={() => onDelete(e)}
                          aria-label={`Delete enquiry from ${e.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="a-empty">
            <p>
              {q
                ? 'No enquiries match your search.'
                : filter === 'new'
                  ? 'All caught up — no new enquiries.'
                  : 'No enquiries yet.'}
            </p>
          </div>
        )}
      </Card>
    </>
  )
}
