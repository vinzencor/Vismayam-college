import { Link } from 'react-router-dom'
import { Logo } from './Logo.jsx'
import { InstagramIcon, LinkedinIcon, YoutubeIcon } from './Icon.jsx'
import { footerLinks, site } from '../config/site.js'
import './Footer.css'

const socials = [
  { label: 'Instagram', href: site.socials.instagram, Icon: InstagramIcon },
  { label: 'LinkedIn', href: site.socials.linkedin, Icon: LinkedinIcon },
  { label: 'YouTube', href: site.socials.youtube, Icon: YoutubeIcon },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo light />
            <p>{site.tagline}</p>
            <div className="site-footer__socials">
              {socials.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group) => (
            <nav key={group.title} className="site-footer__col" aria-label={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="site-footer__contact">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <span aria-hidden="true">·</span>
            <a href={site.phoneHref}>{site.phone}</a>
            <span aria-hidden="true">·</span>
            <span>{site.hours}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
