import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound({ message = "The page you're looking for doesn't exist or has moved." }) {
  useDocumentTitle('Page not found')
  return (
    <section className="not-found bg-blush">
      <div className="container not-found__inner">
        <span className="eyebrow eyebrow--center">404</span>
        <h1 className="h1">Let's get you back on track</h1>
        <p className="lead">{message}</p>
        <div className="not-found__actions">
          <Link to="/courses" className="btn btn--primary">
            Browse courses <ArrowRight size={18} />
          </Link>
          <Link to="/" className="btn btn--outline">
            Go home
          </Link>
        </div>
      </div>
    </section>
  )
}
