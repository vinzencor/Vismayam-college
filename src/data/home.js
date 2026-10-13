// Default homepage content. Once Supabase is connected this is edited from
// /vismayam/admin (stored in `site_settings` id = 'home' and `testimonials`);
// these values are the fallback and what `npm run seed` loads first.
import { avatars, images } from './images.js'

export const homeDefaults = {
  cohortBanner: 'October cohorts now enrolling',
  heroImage: images.hero,
  heroImageAlt: 'Learners collaborating on a design project',
  heroAvatars: [avatars.a, avatars.b, avatars.c, avatars.d],
  heroRating: '4.9/5',
  heroRatingLabel: 'from 8,000+ happy learners',
  completionBadge: '92% completion rate',
  liveClass: {
    title: 'Designing for real user needs',
    hostName: 'Meera Sharma',
    hostRole: 'Senior Product Designer',
    hostPhoto: avatars.liveClass,
  },
  outcomes: [
    { value: '8,000+', label: 'learners upskilled' },
    { value: '94%', label: 'course satisfaction' },
    { value: '120+', label: 'industry mentors' },
    { value: '4.9/5', label: 'average rating' },
  ],
  storyStats: [
    { value: '87%', label: 'completed on time' },
    { value: '3.2×', label: 'more interview calls' },
    { value: '91%', label: 'would recommend' },
  ],
}

export const defaultTestimonials = [
  {
    id: 'aarohi-menon',
    name: 'Aarohi Menon',
    role: 'Product Designer at FinEdge · Class of 2025',
    quote:
      "I didn't just finish a course. I left with a portfolio, a mentor I could trust, and the confidence to change careers.",
    photo: images.testimonial,
    avatar: avatars.testimonial,
    metricValue: '+62%',
    metricLabel: 'average salary uplift reported by career-track graduates',
  },
]
