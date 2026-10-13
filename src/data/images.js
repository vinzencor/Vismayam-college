// Placeholder photography (Unsplash). Replace with your own assets later —
// every image on the site is referenced from here or from the course data.
const unsplash = (id, w = 1200, h) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`

export const images = {
  hero: unsplash('1522202176988-66273c2fd55f', 1400, 1240),
  testimonial: unsplash('1573496359142-b8d87734a5a2', 1100, 1200),
  coursesHero: unsplash('1524178232363-1fb2b075b655', 1200),
}

export const avatars = {
  a: unsplash('1580489944761-15a19d654956', 160, 160),
  b: unsplash('1507003211169-0a1dd7228f2d', 160, 160),
  c: unsplash('1438761681033-6461ffad8d80', 160, 160),
  d: unsplash('1500648767791-00dcc994a43e', 160, 160),
  e: unsplash('1494790108377-be9c29b29330', 160, 160),
  f: unsplash('1472099645785-5658abf4ff4e', 160, 160),
  testimonial: unsplash('1573496359142-b8d87734a5a2', 160, 160),
  liveClass: unsplash('1573497019940-1c28c88b4f3e', 160, 160),
}

export { unsplash }
