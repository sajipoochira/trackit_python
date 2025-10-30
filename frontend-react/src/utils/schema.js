import { api } from '../api'

// Map DRF field types to DynamicForm field configs
function mapType(field) {
  const t = (field.type || 'string').toLowerCase()
  if (Array.isArray(field.choices) && field.choices.length) {
    return { type: 'select', options: field.choices.map(c => c.value) }
  }
  if (t.includes('boolean')) return { type: 'checkbox' }
  if (t.includes('integer')) return { type: 'number', step: 1 }
  if (t.includes('decimal') || t.includes('float') || t.includes('number')) {
    let step = 0.01
    if (typeof field.decimal_places === 'number' && field.decimal_places >= 0) {
      step = Number('1').toFixed(field.decimal_places)
      step = 1 / Math.pow(10, field.decimal_places)
    }
    return { type: 'number', step }
  }
  if (t.includes('date')) return { type: 'date' }
  if (t.includes('json') || t.includes('object')) return { type: 'textarea' }
  return { type: 'text' }
}

export async function getFormConfig(resourcePath) {
  const meta = await api.options(resourcePath)
  const actions = meta && meta.actions ? meta.actions : null
  const post = actions && (actions.POST || actions.post)
  const put = actions && (actions.PUT || actions.put)
  const source = post || put
  if (!source || typeof source !== 'object') return { overrides: {}, order: [], template: {}, readOnly: new Set() }

  const order = []
  const overrides = {}
  const readOnly = new Set()
  const template = {}

  Object.entries(source).forEach(([name, field]) => {
    order.push(name)
    if (field.read_only) {
      readOnly.add(name)
      return
    }
    const mapped = mapType(field)
    overrides[name] = {
      ...mapped,
      required: !!field.required,
      label: field.label || name,
      helpText: field.help_text || '',
      min: field.min_value !== undefined ? field.min_value : undefined,
      max: field.max_value !== undefined ? field.max_value : undefined,
      minLength: field.min_length !== undefined ? field.min_length : undefined,
      maxLength: field.max_length !== undefined ? field.max_length : undefined,
      pattern: field.pattern || undefined
    }
    if (field.default !== undefined) {
      template[name] = field.default
    } else {
      // sensible default per type
      if (mapped.type === 'number') template[name] = 0
      else if (mapped.type === 'checkbox') template[name] = false
      else template[name] = ''
    }
  })

  return { overrides, order, template, readOnly }
}
