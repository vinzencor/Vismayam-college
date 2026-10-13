import { Link } from 'react-router-dom'
import { site } from '../config/site.js'
import './Logo.css'

// Header: full wordmark on wider screens, round mark on phones.
// Footer (`light`): wordmark on a white plate so it reads on the dark background.
export function Logo({ light = false, onClick }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} onClick={onClick} aria-label={`${site.fullName} — home`}>
      {light ? (
        <img src={site.logo.wordmark} alt={site.fullName} className="logo__img" width="270" height="51" />
      ) : (
        <picture>
          <source media="(max-width: 600px)" srcSet={site.logo.mark} width="142" height="142" />
          <img src={site.logo.wordmark} alt={site.fullName} className="logo__img" width="270" height="51" />
        </picture>
      )}
    </Link>
  )
}
