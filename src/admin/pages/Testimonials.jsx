import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { deleteTestimonial, listTestimonials, saveOrder, saveTestimonial } from '../api.js'
import { Card, Dialog, ErrorBox, ImageField, PageHeader, Pill, Spinner, TextArea, TextInput, Toggle, useToast } from '../ui.jsx'

const blankTestimonial = {
  name: '',
  role: '',
  quote: '',
  photo: '',
  avatar: '',
  metricValue: '',
  metricLabel: '',
  published: true,
}

export default function Testimonials() {
  const toast = useToast()
  const [reload, setReload] = useState(0)
  const { data: testimonials, loading, error } = useAsync(listTestimonials, [reload])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const refresh = () => setReload((n) => n + 1)
  const list = testimonials ?? []

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const isNew = !editing.id
      await saveTestimonial({
        ...editing,
        name: editing.name.trim(),
        quote: editing.quote.trim(),
        ...(isNew && { sortOrder: list.length }),
      })
      toast.success(isNew ? 'Testimonial added.' : 'Testimonial saved.')
      setEditing(null)
      refresh()
    } catch (err) {
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(t) {
    if (!window.confirm(`Delete the testimonial from ${t.name}?`)) return
    try {
      await deleteTestimonial(t.id)
      toast.success('Testimonial deleted.')
      refresh()
    } catch (err) {
      toast.error(err)
    }
  }

  async function onMove(index, dir) {
    const ids = list.map((t) => t.id)
    ;[ids[index], ids[index + dir]] = [ids[index + dir], ids[index]]
    try {
      await saveOrder('testimonials', 'id', ids)
      refresh()
    } catch (err) {
      toast.error(err)
    }
  }

  async function onTogglePublished(t) {
    try {
      await saveTestimonial({ id: t.id, published: !t.published })
      refresh()
    } catch (err) {
      toast.error(err)
    }
  }

  const setField = (key) => (value) => setEditing((t) => ({ ...t, [key]: value }))

  return (
    <>
      <PageHeader
        title="Testimonials"
        description='Student stories in the "Student outcomes" section of the homepage. The first published one shows first; visitors can switch between them.'
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing({ ...blankTestimonial })}>
            <Plus size={17} /> Add testimonial
          </button>
        }
      />

      {error && <ErrorBox error={error} onRetry={refresh} />}

      {loading && !testimonials ? (
        <Spinner />
      ) : list.length ? (
        <div className="a-testimonials">
          {list.map((t, i) => (
            <Card key={t.id} className={`a-testimonial${t.published ? '' : ' is-draft'}`}>
              <div className="a-testimonial__top">
                {t.avatar || t.photo ? <img src={t.avatar || t.photo} alt="" /> : <span className="a-thumb-empty a-thumb-empty--round" />}
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
                <button
                  type="button"
                  className={`a-status${t.published ? ' is-on' : ''}`}
                  onClick={() => onTogglePublished(t)}
                  title={t.published ? 'Click to hide from the website' : 'Click to show on the website'}
                >
                  {t.published ? 'Published' : 'Hidden'}
                </button>
              </div>
              <blockquote>“{t.quote}”</blockquote>
              {t.metricValue && (
                <p className="a-testimonial__metric">
                  <Pill tone="red">{t.metricValue}</Pill> {t.metricLabel}
                </p>
              )}
              <div className="a-testimonial__tools">
                <button type="button" className="a-icon-btn" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="a-icon-btn"
                  onClick={() => onMove(i, 1)}
                  disabled={i === list.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <span className="a-spacer" />
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setEditing({ ...blankTestimonial, ...t })}>
                  <Pencil size={15} /> Edit
                </button>
                <button
                  type="button"
                  className="a-icon-btn a-icon-btn--danger"
                  onClick={() => onDelete(t)}
                  aria-label={`Delete testimonial from ${t.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="a-empty">
            <p>No testimonials yet — the Student outcomes section is hidden on the homepage until you add one.</p>
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(editing)}
        size="lg"
        title={editing?.id ? 'Edit testimonial' : 'Add testimonial'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" form="testimonial-form" className="a-btn a-btn--primary" disabled={saving}>
              {saving && <Loader2 size={17} className="a-spin" />} Save
            </button>
          </>
        }
      >
        {editing && (
          <form id="testimonial-form" className="a-grid" onSubmit={onSave}>
            <TextInput label="Student name" value={editing.name} onChange={setField('name')} required autoFocus />
            <TextInput
              label="Role / line under the name"
              value={editing.role}
              onChange={setField('role')}
              placeholder="Product Designer at FinEdge · Class of 2025"
            />
            <TextArea label="Quote" value={editing.quote} onChange={setField('quote')} rows={4} required />
            <ImageField
              label="Large photo"
              hint="Portrait, shown on the left of the section (about 1100×1200)."
              value={editing.photo}
              onChange={setField('photo')}
              folder="testimonials"
              shape="portrait"
              wide={false}
            />
            <ImageField
              label="Small round photo (optional)"
              hint="Next to the name. Uses the large photo if empty."
              value={editing.avatar}
              onChange={setField('avatar')}
              folder="testimonials"
              shape="square"
              wide={false}
            />
            <TextInput
              label="Highlight number (optional)"
              hint="White card on the photo."
              value={editing.metricValue}
              onChange={setField('metricValue')}
              placeholder="+62%"
            />
            <TextInput
              label="Highlight text"
              value={editing.metricLabel}
              onChange={setField('metricLabel')}
              placeholder="average salary uplift reported by career-track graduates"
            />
            <div className="a-field a-field--wide">
              <Toggle label="Published" hint="Show on the website." checked={editing.published} onChange={setField('published')} />
            </div>
          </form>
        )}
      </Dialog>
    </>
  )
}
