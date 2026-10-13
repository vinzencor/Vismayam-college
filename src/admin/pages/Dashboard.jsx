import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Images, Inbox, MessageSquareQuote, Plus } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { getDashboard } from '../api.js'
import { ADMIN_BASE, Card, ErrorBox, PageHeader, Pill, Spinner } from '../ui.jsx'
import { courseLabel, formatDateTime } from '../format.js'

export default function Dashboard() {
  const { data, loading, error } = useAsync(getDashboard, [])

  const stats = data && [
    { label: 'Published courses', value: data.published, note: `${data.drafts} draft${data.drafts === 1 ? '' : 's'}`, to: 'courses', Icon: BookOpen },
    { label: 'Testimonials', value: data.testimonials, note: 'shown on the homepage', to: 'testimonials', Icon: MessageSquareQuote },
    { label: 'New enquiries', value: data.newEnquiries, note: 'not contacted yet', to: 'enquiries', Icon: Inbox, highlight: data.newEnquiries > 0 },
    { label: 'Enquiries this week', value: data.lastWeek, note: `${data.enquiries} in total`, to: 'enquiries', Icon: Inbox },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your website content and incoming enquiries."
        actions={
          <Link to={`${ADMIN_BASE}/courses/new`} className="a-btn a-btn--primary">
            <Plus size={17} /> Add course
          </Link>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorBox error={error} />}

      {data && (
        <>
          <div className="a-stats">
            {stats.map(({ label, value, note, to, Icon, highlight }) => (
              <Link key={label} to={`${ADMIN_BASE}/${to}`} className={`a-stat${highlight ? ' is-highlight' : ''}`}>
                <span className="a-stat__icon">
                  <Icon size={18} />
                </span>
                <strong>{value}</strong>
                <span className="a-stat__label">{label}</span>
                <span className="a-stat__note">{note}</span>
              </Link>
            ))}
          </div>

          <div className="a-two-col">
            <Card
              title="Latest enquiries"
              actions={
                <Link to={`${ADMIN_BASE}/enquiries`} className="a-btn a-btn--text a-btn--sm">
                  View all <ArrowRight size={15} />
                </Link>
              }
            >
              {data.recent.length ? (
                <ul className="a-recent">
                  {data.recent.map((e) => (
                    <li key={e.id}>
                      <div>
                        <strong>{e.name}</strong>
                        <span>{courseLabel(e.courseSlug, data.courseTitles)}</span>
                      </div>
                      <div className="a-recent__meta">
                        {e.contacted ? <Pill tone="green">Contacted</Pill> : <Pill tone="red">New</Pill>}
                        <time>{formatDateTime(e.createdAt)}</time>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="a-muted">No enquiries yet. They'll appear here as soon as someone submits a form.</p>
              )}
            </Card>

            <Card title="Quick actions">
              <div className="a-quick">
                <Link to={`${ADMIN_BASE}/courses/new`}>
                  <BookOpen size={18} /> Add a new course
                </Link>
                <Link to={`${ADMIN_BASE}/homepage`}>
                  <Images size={18} /> Change homepage images
                </Link>
                <Link to={`${ADMIN_BASE}/testimonials`}>
                  <MessageSquareQuote size={18} /> Add a testimonial
                </Link>
                <Link to={`${ADMIN_BASE}/enquiries`}>
                  <Inbox size={18} /> Follow up on enquiries
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
