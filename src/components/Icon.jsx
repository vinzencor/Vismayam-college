import {
  Award,
  BriefcaseBusiness,
  Calendar,
  ChartColumn,
  Clock,
  CodeXml,
  Component,
  Database,
  Handshake,
  Lightbulb,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  MousePointer2,
  Palette,
  PenTool,
  Presentation,
  Rocket,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Video,
  Workflow,
} from 'lucide-react'

// String keys let course data (and later Supabase rows) reference icons.
const icons = {
  award: Award,
  briefcase: BriefcaseBusiness,
  calendar: Calendar,
  chart: ChartColumn,
  clock: Clock,
  code: CodeXml,
  component: Component,
  database: Database,
  handshake: Handshake,
  lightbulb: Lightbulb,
  mail: Mail,
  megaphone: Megaphone,
  message: MessageCircle,
  pen: PenTool,
  pointer: MousePointer2,
  present: MessageSquareText,
  presentation: Presentation,
  research: ScanSearch,
  rocket: Rocket,
  server: Server,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  trend: TrendingUp,
  users: Users,
  video: Video,
  workflow: Workflow,
}

export const iconNames = Object.keys(icons)

export function Icon({ name, size = 20, strokeWidth = 1.9, ...props }) {
  const Glyph = icons[name] ?? Sparkles
  return <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />
}

// lucide no longer ships brand marks, so these are hand-drawn to match its style.
const brandProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const InstagramIcon = () => (
  <svg {...brandProps}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)

export const LinkedinIcon = () => (
  <svg {...brandProps}>
    <path d="M4 10v10M4 4.5v.01M9 20v-10M9 14a4 4 0 0 1 8 0v6M17 20v-6" />
  </svg>
)

export const YoutubeIcon = () => (
  <svg {...brandProps}>
    <rect x="2.5" y="5" width="19" height="14" rx="4" />
    <path d="m10 9.5 4.5 2.5-4.5 2.5z" fill="currentColor" />
  </svg>
)
