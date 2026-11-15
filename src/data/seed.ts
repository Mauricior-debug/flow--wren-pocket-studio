import type { Asset, DB, DesignScreen, DevJob, Deployment, Notice, Project, User } from './types';
import { agoIso, uid } from '../lib/format';
import { buildJourneys, buildRoadmap, recommendStack, revisionFor } from '../lib/planner';

export const DEMO_EMAIL = 'alex@wren.studio';
export const DEMO_PASSWORD = 'Wren1234';
export const DEMO_NAME = 'Alex Carter';

function screen(
  projectId: string,
  name: string,
  purpose: string,
  components: string[],
  requirements: string[],
  blocks: string[],
  template: string,
  status: DesignScreen['status'],
): DesignScreen {
  const revision = revisionFor({ name, purpose, blocks }, template, 0, 'First design');
  return {
    id: uid('screen'),
    projectId,
    name,
    purpose,
    components,
    requirements,
    status,
    approvedRevisionId: status === 'approved' ? revision.id : undefined,
    revisions: [revision],
  };
}

export function buildDemoRecords(userId: string) {
  const now = new Date().toISOString();
  const ridgeId = uid('proj');
  const teamId = uid('proj');
  const wellId = uid('proj');

  const ridge: Project = {
    id: ridgeId,
    ownerId: userId,
    name: 'Ridge Builders',
    description: 'Modern websites for mountain living.',
    type: 'new-website',
    aiModel: 'gpt-4o',
    dataSource: 'none',
    template: 'Modern',
    status: 'building',
    progress: 72,
    createdAt: agoIso(1000 * 60 * 60 * 24 * 6),
    updatedAt: agoIso(1000 * 60 * 32),
    instructions: 'A website for Ridge Builders, modern websites for mountain living.',
    sourceUrl: '',
    repoUrl: '',
    audience: 'People planning a home in the mountains',
    features: ['Browse cabin sites', 'Read how a project is built', 'Ask Ridge to start a conversation'],
    journeys: [],
    stack: recommendStack('new-website', 'Modern'),
    roadmap: buildRoadmap(true, true, true),
    briefSaved: true,
    planAwaiting: null,
    messages: [],
    files: [],
    tasks: [
      { id: uid('task'), title: 'Home, sites, and contact screens', done: true },
      { id: uid('task'), title: 'Approve the design', done: true },
      { id: uid('task'), title: 'Remote build — not verified', done: false },
    ],
    completedFeatures: ['Page structure', 'Design approval'],
    activity: [
      { id: uid('act'), text: 'Design screens approved', at: agoIso(1000 * 60 * 80) },
      { id: uid('act'), text: 'Build job saved. Not verified.', at: agoIso(1000 * 60 * 32) },
    ],
    thumb: 'ridge',
    sample: true,
    analytics: {
      visitors: 1200,
      interactions: 320,
      uptime: 98,
      visitorDelta: '+12%',
      interactionDelta: '+8%',
      uptimeDelta: '+2%',
    },
    notifyBuilds: true,
  };
  ridge.journeys = buildJourneys(ridge.audience, ridge.features);

  const team: Project = {
    id: teamId,
    ownerId: userId,
    name: 'TeamFlow App',
    description: 'A collaborative workspace for modern teams.',
    type: 'native-app',
    aiModel: 'gpt-4o',
    dataSource: 'none',
    template: 'Modern',
    status: 'design',
    progress: 100,
    createdAt: agoIso(1000 * 60 * 60 * 24 * 4),
    updatedAt: agoIso(1000 * 60 * 20),
    instructions: 'A native app for teams to share work and stay in sync.',
    sourceUrl: '',
    repoUrl: '',
    audience: 'Small product teams',
    features: ['See the team’s work', 'Open a project', 'Comment without leaving the app'],
    journeys: [],
    stack: recommendStack('native-app', 'Modern'),
    roadmap: buildRoadmap(true, true, false),
    briefSaved: true,
    planAwaiting: null,
    messages: [],
    files: [],
    tasks: [
      { id: uid('task'), title: 'Write the brief', done: true },
      { id: uid('task'), title: 'Review the five screens', done: false },
    ],
    completedFeatures: ['Brief'],
    activity: [{ id: uid('act'), text: 'Five screens are waiting for approval', at: agoIso(1000 * 60 * 20) }],
    thumb: 'teamflow',
    sample: true,
    analytics: { visitors: null, interactions: null, uptime: null },
    notifyBuilds: true,
  };
  team.journeys = buildJourneys(team.audience, team.features);

  const well: Project = {
    id: wellId,
    ownerId: userId,
    name: 'Wellness Studio',
    description: 'Website · Live',
    type: 'new-website',
    aiModel: 'on-device',
    dataSource: 'none',
    template: 'Soft',
    status: 'live',
    progress: 100,
    createdAt: agoIso(1000 * 60 * 60 * 24 * 12),
    updatedAt: agoIso(1000 * 60 * 60 * 3),
    instructions: 'A website for Wellness Studio.',
    sourceUrl: '',
    repoUrl: '',
    audience: 'People looking for the studio',
    features: ['Understand the studio', 'See the schedule', 'Get in touch'],
    journeys: [],
    stack: recommendStack('new-website', 'Soft'),
    roadmap: buildRoadmap(true, true, true),
    briefSaved: true,
    planAwaiting: null,
    messages: [],
    files: [],
    tasks: [
      { id: uid('task'), title: 'Approved design', done: true },
      { id: uid('task'), title: 'Verified production deployment', done: false },
    ],
    completedFeatures: ['Pages', 'Approved design'],
    activity: [{ id: uid('act'), text: 'Marked live in the sample workspace. Deployment is not verified.', at: agoIso(1000 * 60 * 60 * 3) }],
    thumb: 'wellness',
    sample: true,
    analytics: { visitors: null, interactions: null, uptime: null },
    notifyBuilds: true,
  };
  well.journeys = buildJourneys(well.audience, well.features);

  const teamScreens: DesignScreen[] = [
    screen(teamId, 'Home', 'Show a team what needs attention today.', ['Header', 'Summary', 'List', 'Primary action'], ['A person sees today’s work without opening a menu.', 'The primary action is “New update”.', 'Empty days say so, instead of fake activity.'], ['hero', 'list', 'actions'], 'Modern', 'pending'),
    screen(teamId, 'Projects', 'List the work a team is shipping.', ['Search', 'Project rows', 'Status'], ['Each row shows the name, the state, and the next action.', 'Tapping a row opens the project.'], ['search', 'list'], 'Modern', 'pending'),
    screen(teamId, 'Project', 'Hold one piece of work and its conversation.', ['Title', 'Status', 'Comments', 'Primary action'], ['Comments stay with the project.', 'The next action is visible at the thumb.'], ['hero', 'detail', 'actions'], 'Modern', 'pending'),
    screen(teamId, 'Members', 'Show who is on the team.', ['Member rows', 'Role', 'Invite'], ['A person can see the team without an admin manual.'], ['list', 'actions'], 'Modern', 'pending'),
    screen(teamId, 'Settings', 'Account and notifications.', ['Profile row', 'Switches', 'Sign out'], ['Sign out is explicit.', 'Notification switches say what they change.'], ['list', 'actions'], 'Modern', 'changes'),
  ];

  const ridgeScreens: DesignScreen[] = [
    screen(ridgeId, 'Home', 'Introduce Ridge Builders and the mountain sites.', ['Hero', 'Site list', 'Contact action'], ['The first screen says what Ridge builds.', 'A person can open a site or start a conversation.'], ['hero', 'list', 'actions'], 'Modern', 'approved'),
    screen(ridgeId, 'Site', 'Show one mountain property.', ['Gallery', 'Facts', 'Enquiry'], ['Facts come from the project, not invented awards.', 'Enquiry is the one primary action.'], ['hero', 'detail', 'actions'], 'Modern', 'approved'),
    screen(ridgeId, 'Contact', 'Start a conversation with Ridge.', ['Short form', 'Primary button'], ['The form asks for a name, a way to reply, and the site they mean.'], ['form', 'actions'], 'Modern', 'approved'),
  ];

  const wellScreens: DesignScreen[] = [
    screen(wellId, 'Home', 'Explain Wellness Studio and how to visit.', ['Hero', 'Visit action'], ['One action: plan a visit.', 'No invented testimonials.'], ['hero', 'actions'], 'Soft', 'approved'),
    screen(wellId, 'Schedule', 'Show what is on.', ['List'], ['Times are the studio’s own, not placeholders presented as fact.'], ['list'], 'Soft', 'approved'),
    screen(wellId, 'Contact', 'A way to write to the studio.', ['Form'], ['Name and email are enough to start.'], ['form', 'actions'], 'Soft', 'approved'),
  ];

  const job: DevJob = {
    id: uid('job'),
    projectId: ridgeId,
    ownerId: userId,
    status: 'building',
    provider: 'cursor',
    progress: 72,
    createdAt: agoIso(1000 * 60 * 40),
    updatedAt: agoIso(1000 * 60 * 32),
    verified: false,
    designRevisionIds: ridgeScreens.map((item) => item.approvedRevisionId).filter((id): id is string => Boolean(id)),
    sample: true,
    log: [
      { id: uid('log'), at: agoIso(1000 * 60 * 40), text: 'Job saved on this device with the approved Ridge screens attached.' },
      { id: uid('log'), at: agoIso(1000 * 60 * 36), text: 'Cursor Cloud Agent is not connected from this phone.' },
      { id: uid('log'), at: agoIso(1000 * 60 * 32), text: 'The 72% bar is the sample workspace. No build has been verified.' },
    ],
    versions: [{ id: uid('ver'), at: agoIso(1000 * 60 * 40), note: 'Initial job from the approved design.' }],
  };

  const notifications: Notice[] = [
    { id: uid('note'), userId, type: 'build', title: 'Build completed', message: 'Your app TeamFlow App is ready.', read: false, createdAt: agoIso(1000 * 60 * 2), projectId: teamId, route: `/project/${teamId}` },
    { id: uid('note'), userId, type: 'milestone', title: 'New visitor milestone', message: 'Ridge Builders reached 1,000 visitors!', read: false, createdAt: agoIso(1000 * 60 * 60), projectId: ridgeId, route: `/project/${ridgeId}` },
    { id: uid('note'), userId, type: 'deploy', title: 'Deployment successful', message: 'Wellness Studio is now live.', read: false, createdAt: agoIso(1000 * 60 * 60 * 3), projectId: wellId, route: `/project/${wellId}` },
    { id: uid('note'), userId, type: 'feature', title: 'New feature available', message: 'Try our new AI design assistant.', read: false, createdAt: agoIso(1000 * 60 * 60 * 24), route: '/(tabs)/assets' },
    { id: uid('note'), userId, type: 'welcome', title: 'Welcome to Wren Studio!', message: 'Thanks for joining! Let’s build something amazing.', read: true, createdAt: agoIso(1000 * 60 * 60 * 24 * 2), route: '/(tabs)' },
  ];

  const assets: Asset[] = [
    {
      id: uid('asset'),
      ownerId: userId,
      name: 'Wren astronaut',
      kind: 'illustration',
      prompt: 'Official Wren astronaut, cut from the splash design.',
      status: 'stored',
      bundled: 'astronaut',
      createdAt: agoIso(1000 * 60 * 60 * 5),
      note: 'Taken from the approved splash artwork.',
    },
    {
      id: uid('asset'),
      ownerId: userId,
      name: 'Cabin mark',
      kind: 'text-3d',
      prompt: 'A small cabin mark for Ridge Builders.',
      status: 'provider-unavailable',
      createdAt: agoIso(1000 * 60 * 50),
      note: 'The 3D provider is not connected. The request is stored on this device.',
    },
  ];

  const deployments: Deployment[] = [
    {
      id: uid('dep'),
      projectId: wellId,
      ownerId: userId,
      platform: 'share',
      link: 'https://wren.studio/app/wellness-studio',
      status: 'sample',
      createdAt: agoIso(1000 * 60 * 60 * 3),
      note: 'Sample workspace link. This deployment has not been verified.',
    },
    {
      id: uid('dep'),
      projectId: ridgeId,
      ownerId: userId,
      platform: 'share',
      link: 'https://wren.studio/app/ridge-builders',
      status: 'pending',
      createdAt: agoIso(1000 * 60 * 30),
      note: 'Share link only. The build has not been verified.',
    },
  ];

  return {
    projects: [ridge, team, well],
    screens: [...ridgeScreens, ...teamScreens, ...wellScreens],
    jobs: [job],
    notifications,
    assets,
    deployments,
  };
}

export function emptyDB(): DB {
  return {
    users: [],
    sessionUserId: null,
    onboarded: false,
    deviceAnalytics: false,
    projects: [],
    screens: [],
    jobs: [],
    notifications: [],
    assets: [],
    deployments: [],
    draft: null,
  };
}

export function blankUser(partial: Pick<User, 'id' | 'email' | 'name' | 'provider' | 'passwordHash' | 'salt' | 'avatar'> & Partial<User>): User {
  const now = new Date().toISOString();
  return {
    resetReady: false,
    createdAt: now,
    consent: { termsAt: now, privacyAt: now, analytics: false },
    notificationSettings: { builds: true, designReviews: true, deployments: true, productNews: true },
    preferences: { haptics: true, defaultModel: 'gpt-4o', defaultTemplate: 'Modern' },
    ...partial,
  };
}
