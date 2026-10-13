import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  BookOpen,
  ExternalLink,
  House,
  Images,
  Inbox,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Menu,
  MessageSquareQuote,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { site } from '../config/site.js'
import { checkIsAdmin, errorMessage, signOut } from './api.js'
import { ADMIN_BASE, ToastProvider } from './ui.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CoursesList from './pages/CoursesList.jsx'
import CourseEditor from './pages/CourseEditor.jsx'
import Categories from './pages/Categories.jsx'
import Testimonials from './pages/Testimonials.jsx'
import Homepage from './pages/Homepage.jsx'
import Enquiries from './pages/Enquiries.jsx'
import './admin.css'

const nav = [
  { to: '', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: 'courses', label: 'Courses', Icon: BookOpen },
  { to: 'categories', label: 'Categories', Icon: Layers },
  { to: 'testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
  { to: 'homepage', label: 'Homepage images', Icon: Images },
  { to: 'enquiries', label: 'Enquiries', Icon: Inbox },
]

function useNoIndex() {
  useEffect(() => {
    const meta = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' })
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
}

function FullScreen({ children }) {
  return <div className="a-fullscreen">{children}</div>
}

export default function AdminApp() {
  useNoIndex()

  if (!supabase) {
    return (
      <FullScreen>
        <div className="a-auth-card">
          <h1>Admin unavailable</h1>
          <p>
            Supabase isn't configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{' '}
            <code>.env</code> (or the host's environment variables) and restart.
          </p>
        </div>
      </FullScreen>
    )
  }
  return <AdminRoot />
}

function AdminRoot() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [access, setAccess] = useState({ status: 'idle' }) // idle | checking | admin | denied

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    // Don't call Supabase inside this callback (supabase-js can deadlock) — just store the session.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setAccess({ status: 'idle' })
      return
    }
    let active = true
    setAccess({ status: 'checking' })
    checkIsAdmin()
      .then((ok) => active && setAccess({ status: ok ? 'admin' : 'denied' }))
      .catch((error) => active && setAccess({ status: 'denied', error }))
    return () => {
      active = false
    }
  }, [userId])

  if (session === undefined || access.status === 'checking' || (session && access.status === 'idle')) {
    return (
      <FullScreen>
        <Loader2 size={28} className="a-spin" aria-label="Loading" />
      </FullScreen>
    )
  }

  if (!session) return <Login />

  if (access.status === 'denied') {
    return (
      <FullScreen>
        <div className="a-auth-card">
          <h1>No admin access</h1>
          <p>
            You're signed in as <strong>{session.user.email}</strong>, but this account isn't an admin.
          </p>
          {access.error && <p className="a-auth-card__error">{errorMessage(access.error)}</p>}
          <p className="a-muted">
            Ask the site owner to run <code>npm run create-admin -- {session.user.email} &lt;password&gt;</code>.
          </p>
          <button type="button" className="a-btn a-btn--primary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </FullScreen>
    )
  }

  return (
    <ToastProvider>
      <Shell email={session.user.email}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:slug" element={<CourseEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="homepage" element={<Homepage />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="*" element={<Navigate to={ADMIN_BASE} replace />} />
        </Routes>
      </Shell>
    </ToastProvider>
  )
}

function Shell({ email, children }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className={`a-app${menuOpen ? ' is-menu-open' : ''}`}>
      <aside className="a-sidebar">
        <div className="a-sidebar__brand">
          <img src={site.logo.mark} alt="" width="36" height="36" />
          <div>
            <strong>{site.shortName}</strong>
            <span>Admin</span>
          </div>
          <button
            type="button"
            className="a-icon-btn a-sidebar__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="a-nav" aria-label="Admin">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={label}
              to={to ? `${ADMIN_BASE}/${to}` : ADMIN_BASE}
              end={end}
              className={({ isActive }) => `a-nav__link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="a-sidebar__foot">
          <a href="/" target="_blank" rel="noreferrer" className="a-nav__link">
            <House size={18} aria-hidden="true" /> View website <ExternalLink size={13} aria-hidden="true" />
          </a>
          <div className="a-user">
            <span className="a-user__avatar" aria-hidden="true">
              {email?.[0]?.toUpperCase()}
            </span>
            <span className="a-user__email" title={email}>
              {email}
            </span>
            <button type="button" className="a-icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="a-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="a-main">
        <div className="a-topbar">
          <button type="button" className="a-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="a-topbar__title">
            {site.shortName} <span>Admin</span>
          </span>
        </div>
        <main className="a-content">{children}</main>
      </div>
    </div>
  )
}
