import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Img } from './Img.jsx'
import { Stars } from './Stars.jsx'
import { formatNumber, formatPrice } from '../lib/format.js'
import './CourseCard.css'

export function CourseCard({ course }) {
  const href = `/courses/${course.slug}`

  return (
    <article className="course-card">
      <Link to={href} className="course-card__media" tabIndex={-1} aria-hidden="true">
        <Img src={course.image} alt="" />
        <span className="course-card__badge">{course.categoryName ?? course.category}</span>
      </Link>

      <div className="course-card__body">
        <p className="course-card__meta">
          <span>{course.durationWeeks} weeks</span>
          <span className="course-card__dot" aria-hidden="true" />
          <span>{course.delivery}</span>
        </p>

        <h3 className="course-card__title">
          <Link to={href}>{course.title}</Link>
        </h3>

        <p className="course-card__rating">
          <Stars size={12} />
          <strong>{course.rating}</strong>
          <span>({formatNumber(course.learners)} learners)</span>
        </p>

        <div className="course-card__footer">
          <div className="course-card__price">
            <span>From</span>
            <strong>{formatPrice(course.price)}</strong>
          </div>
          <Link to={href} className="btn btn--tint" aria-label={`View course: ${course.title}`}>
            View course <ArrowUpRight size={15} strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function CourseCardSkeleton() {
  return <div className="course-card course-card--skeleton skeleton" aria-hidden="true" />
}
