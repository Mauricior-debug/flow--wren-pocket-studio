/** Turn Wren buildDelivery activity (string | object | step list) into safe Text children. */

function pickLabel(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value !== 'object') return '';
  const label = value.label ?? value.text ?? value.message ?? value.error;
  if (label == null) return '';
  if (typeof label === 'string' || typeof label === 'number' || typeof label === 'boolean') {
    return String(label);
  }
  return '';
}

/** Always returns a string. Never returns the raw object. */
export function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '';
    return pickLabel(value[value.length - 1]);
  }
  if (typeof value === 'object') {
    return pickLabel(value);
  }
  return '';
}

/** One display string per activity step (or a single line if not a list). */
export function activityLines(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean);
  }
  const line = asText(value);
  return line ? [line] : [];
}
