import { supabase } from '../lib/supabase.js'
import { fromRow } from '../lib/case.js'
import { courses as mockCourses, categories as mockCategories } from '../data/courses.js'

// Derived fields so lesson/week totals always match the curriculum.
const withTotals = (course) => ({
  ...course,
  lessons: (course.curriculum ?? []).reduce((sum, m) => sum + (Number(m.lessons) || 0), 0),
})

const withMockCategory = (course) => ({
  ...course,
  categoryName: mockCategories.find((c) => c.id === course.category)?.name ?? course.category,
})

// Flattens the embedded `categories(name)` join into `categoryName`.
const fromCourseRow = ({ category_info, ...row }) => ({ ...fromRow(row), categoryName: category_info?.name ?? row.category })

const COURSE_SELECT = '*, category_info:categories(name)'

export async function getCourses() {
  if (!supabase) return mockCourses.map(withMockCategory).map(withTotals)
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('published', true)
    .order('popularity', { ascending: false })
  if (error) throw error
  return data.map(fromCourseRow).map(withTotals)
}

// Not filtered by `published`: RLS hides drafts from visitors, while a signed-in admin can preview them.
export async function getCourse(slug) {
  if (!supabase) {
    const course = mockCourses.find((c) => c.slug === slug)
    return course ? withTotals(withMockCategory(course)) : null
  }
  const { data, error } = await supabase.from('courses').select(COURSE_SELECT).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? withTotals(fromCourseRow(data)) : null
}

export async function getCategories() {
  if (!supabase) return mockCategories
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data.map(fromRow)
}
