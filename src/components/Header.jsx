import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react'
import { Logo } from './Logo.jsx'
import { navLinks, site } from '../config/site.js'
import './Header.css'

function isActive(to, { pathname, hash }) {
  const [path, anchor] = to.split('#')
  if (anchor) return pathname === path && hash === `#${anchor}`
  if (path === '/') return pathname === '/' && !hash
  return pathname.startsWith(path)
}

export function Header() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation and lock body scroll while it is open.
  useEffect(() => setOpen(false), [location.pathname, location.hash])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__bar">
        <Logo />

        <nav className="site-nav" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`site-nav__link${isActive(link.to, location) ? ' is-active' : ''}`}
              aria-current={isActive(link.to, location) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <a href={site.phoneHref} className="site-header__phone">
            {site.phone}
          </a>
          <Link to="/contact#enquiry-form" className="btn btn--primary btn--sm site-header__cta">
            Enquire now <ArrowUpRight size={16} strokeWidth={2.4} />
          </Link>
          <button
            type="button"
            className="site-header__toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav className="mobile-menu__nav" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-menu__link${isActive(link.to, location) ? ' is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__footer">
          <a href={site.phoneHref} className="btn btn--outline btn--block">
            <Phone size={16} /> {site.phone}
          </a>
          <Link to="/contact#enquiry-form" className="btn btn--primary btn--block">
            Enquire now <ArrowUpRight size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
      {open && <div className="mobile-menu__scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
    </header>
  )
}
