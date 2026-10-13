// Writes public/sitemap.xml before each build. Uses Supabase course slugs when
// VITE_SUPABASE_* env vars are available (e.g. on the host), otherwise the mock data.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { courses as mockCourses } from '../src/data/courses.js'

const SITE_URL = 'https://vismayamcollege.com'

// Load .env locally without extra dependencies; host env vars take precedence.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

async function courseSlugs() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return mockCourses.map((c) => c.slug)
  try {
    const res = await fetch(`${url}/rest/v1/courses?select=slug&published=eq.true`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()).map((row) => row.slug)
  } catch (err) {
    console.warn(`[sitemap] Supabase fetch failed (${err.message}); using mock courses`)
    return mockCourses.map((c) => c.slug)
  }
}

const paths = ['/', '/courses', '/contact', ...(await courseSlugs()).map((slug) => `/courses/${slug}`)]
const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync('public/sitemap.xml', xml)
console.log(`[sitemap] ${paths.length} URLs → public/sitemap.xml`)
