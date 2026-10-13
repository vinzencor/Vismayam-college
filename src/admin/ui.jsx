// Small form + layout kit shared by the admin pages.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, FileText, ImagePlus, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { Icon, iconNames } from '../components/Icon.jsx'
import { errorMessage, uploadFile } from './api.js'

export const ADMIN_BASE = '/vismayam/admin'

// ---------- Toasts ----------
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current
      setToasts((list) => [...list, { id, type, message }])
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 3500)
    },
    [dismiss],
  )
  const api = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (err) => push('error', typeof err === 'string' ? err : errorMessage(err)),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast a-toast--${t.type}`}>
            {t.type === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ---------- Layout bits ----------
export function PageHeader({ title, description, actions, children }) {
  useEffect(() => {
    document.title = `${title} · Admin | Vismayam College`
  }, [title])

  return (
    <header className="a-page-head">
      <div>
        {children}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="a-page-head__actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, description, actions, children, className = '' }) {
  return (
    <section className={`a-card ${className}`}>
      {(title || actions) && (
        <div className="a-card__head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="a-spinner" role="status">
      <Loader2 size={22} className="a-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="a-error-box" role="alert">
      <CircleAlert size={20} />
      <div>
        <strong>Couldn't load this page</strong>
        <p>{errorMessage(error)}</p>
      </div>
      {onRetry && (
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Pill({ tone = 'neutral', children, ...props }) {
  return (
    <span className={`a-pill a-pill--${tone}`} {...props}>
      {children}
    </span>
  )
}

// ---------- Form fields ----------
// All fields take `value` and call `onChange(nextValue)` — not the DOM event.
export function Field({ label, hint, children, wide = false, htmlFor }) {
  return (
    <div className={`a-field${wide ? ' a-field--wide' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <small>{hint}</small>}
    </div>
  )
}

export function TextInput({ label, hint, value, onChange, wide, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={id}>
      <input id={id} className="a-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />
    </Field>
  )
}

export function NumberInput({ label, hint, value, onChange, wide, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={id}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="a-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        {...props}
      />
    </Field>
  )
}

export function TextArea({ label, hint, value, onChange, wide = true, rows = 3, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={id}>
      <textarea
        id={id}
        className="a-input a-textarea"
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </Field>
  )
}

export function Select({ label, hint, value, onChange, options, placeholder, wide, ...props }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={id}>
      <select id={id} className="a-input a-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function IconSelect({ label = 'Icon', value, onChange }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <div className="a-icon-select">
        <span className="a-icon-select__preview">
          <Icon name={value} size={18} />
        </span>
        <select id={id} className="a-input a-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Default (sparkles)</option>
          {iconNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="a-toggle__track" aria-hidden="true" />
      <span className="a-toggle__text">
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  )
}

// ---------- Uploads ----------
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif'
const MAX_BYTES = 10 * 1024 * 1024

function useUpload(folder, onChange) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function upload(file) {
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error('File is too large (max 10 MB).')
      return
    }
    setBusy(true)
    try {
      onChange(await uploadFile(file, folder))
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  return { busy, upload }
}

// Image picker: upload from the computer or paste a URL. Stores the URL string.
export function ImageField({ label, hint, value, onChange, folder = 'misc', shape = 'wide', wide = true }) {
  const inputRef = useRef(null)
  const urlId = useId()
  const { busy, upload } = useUpload(folder, onChange)
  const [dragging, setDragging] = useState(false)

  return (
    <Field label={label} hint={hint} wide={wide} htmlFor={urlId}>
      <div
        className={`a-image a-image--${shape}${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload(e.dataTransfer.files?.[0])
        }}
      >
        <div className="a-image__preview">
          {value ? <img src={value} alt="" /> : <ImagePlus size={26} aria-hidden="true" />}
          {busy && (
            <span className="a-image__busy">
              <Loader2 size={22} className="a-spin" />
            </span>
          )}
        </div>
        <div className="a-image__controls">
          <div className="a-image__buttons">
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload size={15} /> {value ? 'Replace' : 'Upload image'}
            </button>
            {value && (
              <button type="button" className="a-btn a-btn--text a-btn--sm" onClick={() => onChange('')} disabled={busy}>
                Remove
              </button>
            )}
          </div>
          <input
            id={urlId}
            className="a-input a-input--sm"
            placeholder="…or paste an image URL"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value.trim())}
          />
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_TYPES}
            hidden
            onChange={(e) => {
              upload(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </div>
    </Field>
  )
}

export function PdfField({ label, hint, value, onChange, folder = 'files' }) {
  const inputRef = useRef(null)
  const urlId = useId()
  const { busy, upload } = useUpload(folder, onChange)

  return (
    <Field label={label} hint={hint} wide htmlFor={urlId}>
      <div className="a-file">
        <span className="a-file__icon">{busy ? <Loader2 size={20} className="a-spin" /> : <FileText size={20} />}</span>
        <div className="a-file__body">
          {value ? (
            <a href={value} target="_blank" rel="noreferrer" className="a-file__link">
              {decodeURIComponent(value.split('/').pop())}
            </a>
          ) : (
            <span className="a-file__empty">No file</span>
          )}
          <input
            id={urlId}
            className="a-input a-input--sm"
            placeholder="…or paste a PDF URL"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value.trim())}
          />
        </div>
        <div className="a-image__buttons">
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload size={15} /> Upload PDF
          </button>
          {value && (
            <button type="button" className="a-btn a-btn--text a-btn--sm" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            upload(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    </Field>
  )
}

// ---------- Repeatable lists (curriculum modules, outcomes, stats…) ----------
export function ListEditor({ items, onChange, renderItem, createItem, itemLabel, addLabel = 'Add item', max, compact = false }) {
  const list = items ?? []
  const update = (i, value) => onChange(list.map((item, j) => (j === i ? value : item)))
  const remove = (i) => onChange(list.filter((_, j) => j !== i))
  const move = (i, dir) => {
    const next = [...list]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }

  return (
    <div className={`a-list${compact ? ' a-list--compact' : ''}`}>
      {list.map((item, i) => (
        <div key={i} className="a-list__item">
          <div className="a-list__head">
            <span className="a-list__label">{itemLabel(item, i)}</span>
            <div className="a-list__tools">
              <button type="button" className="a-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className="a-icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                aria-label="Move down"
              >
                <ArrowDown size={16} />
              </button>
              <button type="button" className="a-icon-btn a-icon-btn--danger" onClick={() => remove(i)} aria-label="Remove">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="a-grid">{renderItem(item, (value) => update(i, value), i)}</div>
        </div>
      ))}
      {(!max || list.length < max) && (
        <button type="button" className="a-add" onClick={() => onChange([...list, createItem()])}>
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  )
}

// ---------- Dialog ----------
export function Dialog({ open, title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`a-dialog a-dialog--${size}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      aria-labelledby={titleId}
    >
      {open && (
        <>
          <div className="a-dialog__head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="a-dialog__body">{children}</div>
          {footer && <div className="a-dialog__foot">{footer}</div>}
        </>
      )}
    </dialog>
  )
}

// Warns before leaving the tab with unsaved edits.
export function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}
