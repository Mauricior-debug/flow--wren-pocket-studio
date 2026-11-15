import type { Project, ProjectStatus, ProjectType } from '../data/types';

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function timeAgo(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatStat(value: number | null) {
  if (value == null) return '—';
  if (value >= 1000) {
    const compact = value / 1000;
    const text = compact >= 10 ? compact.toFixed(0) : compact.toFixed(1).replace(/\.0$/, '');
    return `${text}K`;
  }
  return String(value);
}

export function kindName(type: ProjectType) {
  switch (type) {
    case 'native-app':
    case 'rebuild-app':
      return 'Mobile App';
    case 'web-app':
      return 'Web App';
    case 'feature':
      return 'Feature';
    case 'design-to-code':
      return 'Design';
    default:
      return 'Website';
  }
}

export function phaseLabel(status: ProjectStatus) {
  switch (status) {
    case 'planning':
      return 'Planning';
    case 'design':
      return 'Design review';
    case 'building':
      return 'Build in progress';
    case 'live':
      return 'Live';
    case 'attention':
      return 'Needs attention';
  }
}

export function statusLabel(status: ProjectStatus) {
  switch (status) {
    case 'planning':
      return 'Planning';
    case 'design':
      return 'Awaiting Approval';
    case 'building':
      return 'Building';
    case 'live':
      return 'Live';
    case 'attention':
      return 'Attention';
  }
}

export function projectSubtitle(project: Project) {
  return `${kindName(project.type)} · ${phaseLabel(project.status)}`;
}

export function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return slug || 'project';
}

export function shareLink(name: string) {
  return `https://wren.studio/app/${slugify(name)}`;
}

export function titleFromIdea(text: string) {
  const words = text
    .replace(/[^\w\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4);
  if (!words.length || !words[0]) return 'Untitled app';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordIssues(password: string) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    letter: /[A-Za-z]/.test(password),
  };
}

export function passwordOk(password: string) {
  const issues = passwordIssues(password);
  return issues.length && issues.number && issues.letter;
}

export function agoIso(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

export function fileKind(mime: string, name: string): Project['files'][number]['kind'] {
  const lower = name.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/') || lower.endsWith('.m4a') || lower.endsWith('.wav')) return 'audio';
  if (lower.endsWith('.zip') || lower.endsWith('.glb') || mime.includes('zip')) {
    return lower.endsWith('.glb') ? 'model' : 'archive';
  }
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'model';
  if (mime.includes('pdf') || lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.txt')) {
    return 'document';
  }
  return 'other';
}
