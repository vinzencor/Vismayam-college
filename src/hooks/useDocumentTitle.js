import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { site } from '../config/site.js'

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/)
    el.setAttribute(key, name)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

// Keeps the title, description, canonical URL and social tags in sync with the page.
export function useDocumentTitle(title, description = site.description) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | ${site.name}` : `${site.name} — Learn skills that turn ambition into progress`
    const url = `${site.url}${pathname === '/' ? '/' : pathname}`

    document.title = fullTitle
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
  }, [title, description, pathname])
}
