// Central brand + contact details. Logo files live in src/assets; favicons in public/.
import logoWordmark from '../assets/logo-wordmark.png'
import logoMark from '../assets/logo-mark.png'

export const site = {
  name: 'Vismayam College',
  fullName: 'Vismayam College of Art and Media',
  shortName: 'Vismayam',
  url: 'https://vismayamcollege.com',
  description:
    'Practical, mentor-led online courses built for real careers. Learn with structure, build proof of skill and move forward with confidence.',
  logo: {
    wordmark: logoWordmark, // full logo — header on wider screens, footer
    mark: logoMark, // round icon — header on phones
  },
  tagline:
    'Practical online learning for ambitious people. Build job-ready skills with expert mentors and a community that keeps you moving.',
  phone: '+91 800 555 0199',
  phoneHref: 'tel:+918005550199',
  whatsappHref: 'https://wa.me/918005550199',
  email: 'hello@vismayamcollege.com',
  hours: 'Mon–Sat, 9:00–18:00',
  hoursLong: '9:00 – 18:00 IST',
  socials: {
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
    youtube: 'https://youtube.com/',
  },
}

export const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/courses' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Student stories', to: '/#stories' },
]

export const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'All courses', to: '/courses' },
      { label: 'Career tracks', to: '/courses?track=career' },
      { label: 'Student stories', to: '/#stories' },
      { label: 'For teams', to: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Enquire now', to: '/contact' },
      { label: 'FAQs', to: '/contact' },
      { label: 'Contact us', to: '/contact' },
      { label: 'Learning help', to: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Vismayam College', to: '/' },
      { label: 'Our mentors', to: '/courses' },
      { label: 'Careers', to: '/contact' },
      { label: 'Privacy', to: '/contact' },
    ],
  },
]
