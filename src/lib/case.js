// Supabase rows are snake_case; the UI uses camelCase.
// Only top-level keys are converted — jsonb contents keep their shape.
const toCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const toSnake = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

export const fromRow = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]))
export const toRow = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]))
