export function clsx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-ES');
}
