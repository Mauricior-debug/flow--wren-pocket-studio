import type { Journey, Project, ProjectType, RoadmapPhase } from '../data/types';
import { uid } from './format';

export type ProposedScreen = {
  name: string;
  purpose: string;
  components: string[];
  requirements: string[];
  blocks: string[];
};

const TYPE_COPY: Record<ProjectType, { title: string; detail: string }> = {
  'new-website': { title: 'New website', detail: 'Pages for a product, studio, or service.' },
  'web-app': { title: 'Web application', detail: 'A signed-in product people use in the browser.' },
  'native-app': { title: 'Native mobile application', detail: 'An iOS and Android app people keep on their phone.' },
  'rebuild-website': { title: 'Existing website rebuild', detail: 'A new design for a site you already have.' },
  'rebuild-app': { title: 'Existing application rebuild', detail: 'Replace the experience of an app you already ship.' },
  'design-to-code': { title: 'Design to code', detail: 'Turn approved screens into a working build.' },
  feature: { title: 'Feature development', detail: 'Add something to a project without starting over.' },
};

export function typeMeta(type: ProjectType) {
  return TYPE_COPY[type];
}

export const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o (Recommended)', remote: true },
  { id: 'on-device', label: 'On-device planner', remote: false },
  { id: 'claude', label: 'Claude', remote: true },
  { id: 'gemini', label: 'Gemini', remote: true },
] as const;

export const DATA_SOURCES = [
  { id: 'none', label: 'None (Start from scratch)' },
  { id: 'files', label: 'Uploaded files' },
  { id: 'url', label: 'Existing website URL' },
  { id: 'repo', label: 'Source code or ZIP' },
] as const;

export const TEMPLATES = [
  { id: 'Modern', label: 'Modern' },
  { id: 'Bold', label: 'Bold' },
  { id: 'Soft', label: 'Soft' },
  { id: 'Minimal', label: 'Minimal' },
] as const;

export function modelMeta(id: string) {
  return MODELS.find((model) => model.id === id) ?? MODELS[0];
}

export function sourceLabel(id: string) {
  return DATA_SOURCES.find((source) => source.id === id)?.label ?? 'None (Start from scratch)';
}

function cleanList(text: string) {
  return text
    .split(/[,;\n]|(?:\s+and\s+)/i)
    .map((part) => part.trim().replace(/^[-•]\s*/, ''))
    .filter((part) => part.length > 2)
    .slice(0, 6);
}

export function inferAudience(text: string) {
  const match = text.match(/\bfor\s+(people|teams|customers|clients|guests|students|parents|hikers|patients|riders|members)\b([^.]*)/i);
  if (!match) return '';
  return `${match[1]}${match[2] ?? ''}`.trim();
}

export function openingQuestion(instructions: string) {
  const audience = inferAudience(instructions);
  const features = cleanList(instructions).filter((part) => part.length > 12);
  if (!audience) {
    return {
      audience: '',
      features: features.length >= 2 ? features : [],
      awaiting: 'audience' as const,
      reply: 'Who will use this? Name the people, not only the business.',
    };
  }
  if (features.length < 2) {
    return {
      audience,
      features: [],
      awaiting: 'features' as const,
      reply: `I'll plan this for ${audience}. What must they be able to do? Separate the actions with commas.`,
    };
  }
  return {
    audience,
    features,
    awaiting: null,
    reply: 'I have enough to write the brief. Save it, then review the screens before anything is built.',
  };
}

export function nextReply(awaiting: 'audience' | 'features', answer: string, audience: string) {
  if (awaiting === 'audience') {
    const featuresReady = cleanList(answer);
    return {
      audience: answer.trim(),
      features: [] as string[],
      awaiting: 'features' as const,
      reply:
        featuresReady.length >= 3
          ? `Noted — this is for ${answer.trim()}. What must they be able to do? Separate the actions with commas.`
          : `Noted — this is for ${answer.trim()}. What must they be able to do? Separate the actions with commas.`,
    };
  }
  const features = cleanList(answer);
  return {
    audience,
    features: features.length ? features : [answer.trim()],
    awaiting: null,
    reply: 'I have enough to write the brief. Save it, then review the screens before anything is built.',
  };
}

export function recommendStack(type: ProjectType, template: string) {
  const shared = [`${template} visual system from the screens you approve`, 'A remote coding job that keeps those screens attached'];
  switch (type) {
    case 'native-app':
    case 'rebuild-app':
      return ['React Native with Expo for iOS and Android', 'On-device storage until a database is connected', ...shared];
    case 'web-app':
      return ['A signed-in web application', 'The flows from the approved screens', ...shared];
    case 'design-to-code':
      return ['One build surface per approved screen', 'Components taken from the design, not redrawn later', ...shared];
    case 'feature':
      return ['A change on the existing project', 'Previously approved screens stay unless you change them', ...shared];
    default:
      return ['Responsive pages from the approved screens', 'Hosting only after a build is verified', ...shared];
  }
}

export function buildRoadmap(briefSaved: boolean, screensReady: boolean, approved: boolean): RoadmapPhase[] {
  return [
    { id: 'brief', title: 'Brief', detail: 'Audience, actions, and the job to be done.', state: briefSaved ? 'done' : 'now' },
    {
      id: 'design',
      title: 'Screen designs',
      detail: 'A screen for each part of the product, with a purpose and requirements.',
      state: !briefSaved ? 'next' : screensReady ? 'done' : 'now',
    },
    {
      id: 'approval',
      title: 'Your approval',
      detail: 'Nothing is sent to a coding agent until you approve the design.',
      state: !screensReady ? 'next' : approved ? 'done' : 'now',
    },
    { id: 'job', title: 'Remote development', detail: 'A coding job stays queued until an agent is connected and the result is verified.', state: 'next' },
    { id: 'verify', title: 'Verify', detail: 'A build is not called done until it has been checked.', state: 'next' },
    { id: 'deploy', title: 'Deploy', detail: 'A deployment stays pending until that check is real.', state: 'next' },
  ];
}

export function buildJourneys(audience: string, features: string[]): Journey[] {
  const who = audience || 'A person';
  const primary = features[0] || 'complete the main action';
  const second = features[1] || 'review what they made';
  return [
    { name: 'First visit', steps: [`${who} opens the product`, `They ${primary}`, 'They see a clear result'] },
    { name: 'Return visit', steps: [`${who} comes back`, `They ${second}`, 'Their earlier work is still there'] },
    { name: 'Hand-off', steps: ['They share the result', 'Someone else can open it', 'The owner can change it later'] },
  ];
}

function blocksFor(name: string, index: number) {
  const lower = name.toLowerCase();
  if (lower.includes('sign') || lower.includes('account')) return ['form', 'actions'];
  if (lower.includes('setting') || lower.includes('profile')) return ['list', 'actions'];
  if (lower.includes('home') || lower.includes('overview')) return index % 2 === 0 ? ['hero', 'stats', 'list'] : ['search', 'list', 'actions'];
  if (lower.includes('detail') || lower.includes('project')) return ['hero', 'detail', 'actions'];
  if (lower.includes('chart') || lower.includes('analytic')) return ['stats', 'chart', 'list'];
  return ['hero', 'list', 'actions'];
}

export function proposeScreens(input: {
  type: ProjectType;
  name: string;
  audience: string;
  features: string[];
  template: string;
}): ProposedScreen[] {
  const who = input.audience || 'the person using it';
  const base: { name: string; purpose: string }[] = [];
  if (input.type === 'native-app' || input.type === 'rebuild-app') {
    base.push(
      { name: 'Home', purpose: `Give ${who} the main work of ${input.name} as soon as they open it.` },
      { name: 'Detail', purpose: 'Show one item in full, with the next action obvious.' },
      { name: 'Create', purpose: 'Let them add something without leaving the app.' },
      { name: 'Settings', purpose: 'Account, notifications, and sign out live here.' },
    );
  } else if (input.type === 'web-app') {
    base.push(
      { name: 'Sign in', purpose: `Let returning people open ${input.name}.` },
      { name: 'Home', purpose: `Show ${who} what needs attention.` },
      { name: 'Detail', purpose: 'Hold the record they came to work on.' },
      { name: 'Settings', purpose: 'Profile and preferences.' },
    );
  } else if (input.type === 'design-to-code') {
    base.push(
      { name: 'Screen list', purpose: 'Every frame that will be built, in order.' },
      { name: 'Primary screen', purpose: `The first screen ${who} should understand.` },
      { name: 'Action screen', purpose: 'The screen where the main action happens.' },
    );
  } else {
    base.push(
      { name: 'Home', purpose: `Tell ${who} what ${input.name} is and what to do next.` },
      { name: 'Offer', purpose: 'Explain the work or product in concrete terms.' },
      { name: 'Proof', purpose: 'Show the work itself. Do not invent quotes or client logos.' },
      { name: 'Contact', purpose: 'One clear way to start a conversation.' },
    );
  }
  input.features.slice(0, 3).forEach((feature) => {
    const name = feature.split(' ').slice(0, 3).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (!base.some((screen) => screen.name.toLowerCase() === name.toLowerCase())) {
      base.push({ name, purpose: `Let ${who} ${feature}.` });
    }
  });
  return base.slice(0, 7).map((screen, index) => ({
    name: screen.name,
    purpose: screen.purpose,
    components: componentsFor(screen.name),
    requirements: [
      `${who} can complete “${screen.name}” without a second explanation.`,
      'The primary action stays visible and at least 44 points.',
      `Use the ${input.template} template. Do not invent claims that are not in the brief.`,
    ],
    blocks: blocksFor(screen.name, index),
  }));
}

function componentsFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('sign') || lower.includes('account')) return ['Email field', 'Password field', 'Primary button', 'Secondary link'];
  if (lower.includes('setting') || lower.includes('profile')) return ['Profile row', 'Preference rows', 'Sign out'];
  if (lower.includes('contact')) return ['Short form', 'Primary button'];
  if (lower.includes('home') || lower.includes('overview')) return ['Header', 'Summary', 'List', 'Primary action'];
  return ['Header', 'Content', 'Primary action'];
}

export function specFor(screen: { name: string; purpose: string }, template: string, variant: number) {
  const layout = variant % 2 === 0 ? 'A single column with the action at the thumb.' : 'A header, then grouped sections, with the action pinned to the bottom.';
  return `${screen.name}. ${screen.purpose} Layout: ${layout} Template: ${template}. Type is Plus Jakarta Sans, white on navy, lime for the one primary action.`;
}

export function revisionFor(screen: { name: string; purpose: string; blocks: string[] }, template: string, variant: number, note: string) {
  const blocks = variant % 2 === 0 ? screen.blocks : [...screen.blocks].reverse();
  return {
    id: uid('rev'),
    createdAt: new Date().toISOString(),
    note,
    variant,
    blocks,
    spec: specFor(screen, template, variant),
  };
}

export function journeysFor(project: Pick<Project, 'audience' | 'features'>) {
  return buildJourneys(project.audience, project.features);
}
