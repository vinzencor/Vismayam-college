import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Icon } from '../../components/Icon.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { deleteCategory, listCategories, listCourses, saveCategory, saveOrder, slugify } from '../api.js'
import { Card, Dialog, ErrorBox, IconSelect, PageHeader, Pill, Spinner, TextArea, TextInput, Toggle, useToast } from '../ui.jsx'

const blankCategory = { id: '', name: '', blurb: '', icon: 'sparkles', featured: false }

export default function Categories() {
  const toast = useToast()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(
    () => Promise.all([listCategories(), listCourses()]).then(([categories, courses]) => ({ categories, courses })),
    [reload],
  )
  const [editing, setEditing] = useState(null) // { category, isNew }
  const [saving, setSaving] = useState(false)
  const refresh = () => setReload((n) => n + 1)

  const categories = data?.categories ?? []
  const courseCount = (id) => data?.courses.filter((c) => c.category === id).length ?? 0

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { category, isNew } = editing
      await saveCategory(
        { ...category, name: category.name.trim(), sortOrder: isNew ? categories.length : category.sortOrder },
        isNew,
      )
      toast.success(isNew ? 'Category added.' : 'Category saved.')
      setEditing(null)
      refresh()
    } catch (err) {
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(category) {
    if (courseCount(category.id) > 0) {
      toast.error(`"${category.name}" still has ${courseCount(category.id)} course(s). Move them to another category first.`)
      return
    }
    if (!window.confirm(`Delete the "${category.name}" category?`)) return
    try {
      await deleteCategory(category.id)
      toast.success('Category deleted.')
      refresh()
    } catch (err) {
      toast.error(err)
    }
  }

  async function onMove(index, dir) {
    const ids = categories.map((c) => c.id)
    ;[ids[index], ids[index + dir]] = [ids[index + dir], ids[index]]
    try {
      await saveOrder('categories', 'id', ids)
      refresh()
    } catch (err) {
      toast.error(err)
    }
  }

  const setField = (key) => (value) =>
    setEditing((ed) => {
      const category = { ...ed.category, [key]: value }
      // New categories get an ID from the name until it's edited by hand.
      if (key === 'name' && ed.isNew && !ed.idTouched) category.id = slugify(value)
      return { ...ed, category, idTouched: ed.idTouched || key === 'id' }
    })

  return (
    <>
      <PageHeader
        title="Categories"
        description='Used to group courses and for the filters on the courses page. "Featured" categories appear as "Browse by goal" cards.'
        actions={
          <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing({ category: { ...blankCategory }, isNew: true })}>
            <Plus size={17} /> Add category
          </button>
        }
      />

      {error && <ErrorBox error={error} onRetry={refresh} />}

      <Card>
        {loading && !data ? (
          <Spinner />
        ) : categories.length ? (
          <ul className="a-rows">
            {categories.map((cat, i) => (
              <li key={cat.id} className="a-rows__item">
                <span className="a-rows__icon">
                  <Icon name={cat.icon} size={18} />
                </span>
                <div className="a-rows__main">
                  <strong>
                    {cat.name} {cat.featured && <Pill tone="red">Featured</Pill>}
                  </strong>
                  <span>
                    {courseCount(cat.id)} course{courseCount(cat.id) === 1 ? '' : 's'} · {cat.blurb || 'No description'}
                  </span>
                </div>
                <div className="a-rows__tools">
                  <button type="button" className="a-icon-btn" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label="Move up">
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="a-icon-btn"
                    onClick={() => onMove(i, 1)}
                    disabled={i === categories.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="a-icon-btn"
                    onClick={() => setEditing({ category: { ...cat }, isNew: false })}
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="a-icon-btn a-icon-btn--danger"
                    onClick={() => onDelete(cat)}
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="a-empty">
            <p>No categories yet. Add one before creating courses.</p>
          </div>
        )}
      </Card>

      <Dialog
        open={Boolean(editing)}
        title={editing?.isNew ? 'Add category' : 'Edit category'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" form="category-form" className="a-btn a-btn--primary" disabled={saving}>
              {saving && <Loader2 size={17} className="a-spin" />} Save
            </button>
          </>
        }
      >
        {editing && (
          <form id="category-form" className="a-grid" onSubmit={onSave}>
            <TextInput label="Name" value={editing.category.name} onChange={setField('name')} required autoFocus />
            <TextInput
              label="ID"
              hint={editing.isNew ? 'Used in links, e.g. /courses?category=design. Can’t be changed later.' : 'Can’t be changed.'}
              value={editing.category.id}
              onChange={(v) => setField('id')(v.toLowerCase())}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              disabled={!editing.isNew}
            />
            <TextArea label="Short description" value={editing.category.blurb} onChange={setField('blurb')} rows={2} />
            <IconSelect value={editing.category.icon} onChange={setField('icon')} />
            <div className="a-field a-field--wide">
              <Toggle
                label="Featured"
                hint='Show as a "Browse by goal" card on the courses page.'
                checked={editing.category.featured}
                onChange={setField('featured')}
              />
            </div>
          </form>
        )}
      </Dialog>
    </>
  )
}
