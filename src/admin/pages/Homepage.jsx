import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Save } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync.js'
import { homeDefaults } from '../../data/home.js'
import { getSetting, saveSetting } from '../api.js'
import { Card, ErrorBox, ImageField, ListEditor, PageHeader, Spinner, TextInput, useToast, useUnsavedWarning } from '../ui.jsx'

const SETTING_ID = 'home'

const merge = (value) => ({
  ...homeDefaults,
  ...value,
  liveClass: { ...homeDefaults.liveClass, ...value?.liveClass },
})

function StatList({ items, onChange, max }) {
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      max={max}
      compact
      createItem={() => ({ value: '', label: '' })}
      itemLabel={(s, i) => `Stat ${i + 1}`}
      addLabel="Add stat"
      renderItem={(s, update) => (
        <>
          <TextInput label="Number" value={s.value} onChange={(v) => update({ ...s, value: v })} placeholder="94%" required />
          <TextInput label="Label" value={s.label} onChange={(v) => update({ ...s, label: v })} placeholder="course satisfaction" required />
        </>
      )}
    />
  )
}

export default function Homepage() {
  const toast = useToast()
  const { data, loading, error } = useAsync(() => getSetting(SETTING_ID), [])
  const [content, setContent] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [saving, setSaving] = useState(false)

  // No saved row yet → start from the defaults the site is currently showing.
  useEffect(() => {
    if (loading) return
    const initial = merge(data)
    setContent(initial)
    setSavedSnapshot(JSON.stringify(initial))
  }, [loading, data])

  const dirty = content !== null && JSON.stringify(content) !== savedSnapshot
  useUnsavedWarning(dirty)

  if (error) return <ErrorBox error={error} />
  if (!content) return <Spinner />

  const set = (key) => (value) => setContent((c) => ({ ...c, [key]: value }))
  const setLive = (key) => (value) => setContent((c) => ({ ...c, liveClass: { ...c.liveClass, [key]: value } }))

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const value = { ...content, heroAvatars: content.heroAvatars.filter(Boolean) }
      await saveSetting(SETTING_ID, value)
      setContent(value)
      setSavedSnapshot(JSON.stringify(value))
      toast.success('Homepage updated.')
    } catch (err) {
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="a-editor">
      <PageHeader
        title="Homepage images"
        description="The hero photo, live-class card, stats and other content on the homepage."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="a-btn a-btn--ghost">
            <ExternalLink size={16} /> View homepage
          </a>
        }
      />

      <Card title="Hero" description="The first thing visitors see.">
        <div className="a-grid">
          <ImageField
            label="Main hero image"
            hint="Large photo on the right of the hero. Portrait-ish, about 1400×1240."
            value={content.heroImage}
            onChange={set('heroImage')}
            folder="home"
            shape="hero"
          />
          <TextInput
            label="Image description (alt text)"
            hint="Describes the photo for screen readers and search engines."
            value={content.heroImageAlt}
            onChange={set('heroImageAlt')}
            wide
          />
          <TextInput label="Banner above the headline" value={content.cohortBanner} onChange={set('cohortBanner')} placeholder="October cohorts now enrolling" />
          <TextInput
            label="Badge on the image"
            hint="Leave empty to hide."
            value={content.completionBadge}
            onChange={set('completionBadge')}
            placeholder="92% completion rate"
          />
          <TextInput label="Rating" value={content.heroRating} onChange={set('heroRating')} placeholder="4.9/5" />
          <TextInput label="Rating caption" value={content.heroRatingLabel} onChange={set('heroRatingLabel')} placeholder="from 8,000+ happy learners" />
        </div>
      </Card>

      <Card title="Learner photos" description="Small overlapping round photos next to the rating (up to 5).">
        <ListEditor
          items={content.heroAvatars}
          onChange={set('heroAvatars')}
          max={5}
          compact
          createItem={() => ''}
          itemLabel={(_, i) => `Photo ${i + 1}`}
          addLabel="Add photo"
          renderItem={(src, update) => (
            <ImageField label="" value={src} onChange={update} folder="home/avatars" shape="square" />
          )}
        />
      </Card>

      <Card title="Live class card" description="The floating card on the hero image. Leave the title empty to hide it.">
        <div className="a-grid">
          <TextInput label="Class title" value={content.liveClass.title} onChange={setLive('title')} wide />
          <TextInput label="Host name" value={content.liveClass.hostName} onChange={setLive('hostName')} />
          <TextInput label="Host role" value={content.liveClass.hostRole} onChange={setLive('hostRole')} />
          <ImageField label="Host photo" value={content.liveClass.hostPhoto} onChange={setLive('hostPhoto')} folder="home" shape="square" />
        </div>
      </Card>

      <Card title="Trusted outcomes bar" description="The row of numbers under the hero (4 works best).">
        <StatList items={content.outcomes} onChange={set('outcomes')} max={6} />
      </Card>

      <Card title="Student outcomes stats" description="Numbers under the testimonial (3 works best). Testimonials themselves are edited under Testimonials.">
        <StatList items={content.storyStats} onChange={set('storyStats')} max={4} />
      </Card>

      <div className="a-savebar">
        <span className={`a-savebar__status${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <button type="submit" className="a-btn a-btn--primary" disabled={saving || !dirty}>
          {saving ? <Loader2 size={17} className="a-spin" /> : <Save size={17} />}
          Save homepage
        </button>
      </div>
    </form>
  )
}
