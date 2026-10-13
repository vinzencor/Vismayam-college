const inr = new Intl.NumberFormat('en-IN')

export const formatPrice = (value) => `₹${inr.format(value)}`
export const formatNumber = (value) => inr.format(value)

export const formatStartDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
