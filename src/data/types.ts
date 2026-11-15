import type { ThumbKey } from '../theme/images';

export type ProjectType =
  | 'new-website'
  | 'web-app'
  | 'native-app'
  | 'rebuild-website'
  | 'rebuild-app'
  | 'design-to-code'
  | 'feature';

export type ProjectStatus = 'planning' | 'design' | 'building' | 'live' | 'attention';

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  salt: string | null;
  provider: 'password' | 'google';
  avatar: 'alex' | 'custom' | 'none';
  avatarUri?: string;
  createdAt: string;
  resetReady: boolean;
  consent: { termsAt: string; privacyAt: string; analytics: boolean };
  notificationSettings: {
    builds: boolean;
    designReviews: boolean;
    deployments: boolean;
    productNews: boolean;
  };
  preferences: {
    haptics: boolean;
    defaultModel: string;
    defaultTemplate: string;
  };
};

export type ProjectFile = {
  id: string;
  name: string;
  uri: string;
  mime: string;
  kind: 'image' | 'document' | 'archive' | 'audio' | 'model' | 'other';
  size?: number;
};

export type PlanMessage = {
  id: string;
  role: 'wren' | 'user';
  text: string;
};

export type Journey = { name: string; steps: string[] };

export type RoadmapPhase = {
  id: string;
  title: string;
  detail: string;
  state: 'done' | 'now' | 'next';
};

export type Task = { id: string; title: string; done: boolean };

export type Activity = { id: string; text: string; at: string };

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  type: ProjectType;
  aiModel: string;
  dataSource: string;
  template: string;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  instructions: string;
  sourceUrl: string;
  repoUrl: string;
  audience: string;
  features: string[];
  journeys: Journey[];
  stack: string[];
  roadmap: RoadmapPhase[];
  briefSaved: boolean;
  planAwaiting: 'audience' | 'features' | null;
  messages: PlanMessage[];
  files: ProjectFile[];
  tasks: Task[];
  completedFeatures: string[];
  activity: Activity[];
  thumb?: ThumbKey;
  sample?: boolean;
  analytics: {
    visitors: number | null;
    interactions: number | null;
    uptime: number | null;
    visitorDelta?: string;
    interactionDelta?: string;
    uptimeDelta?: string;
  };
  notifyBuilds: boolean;
};

export type Revision = {
  id: string;
  createdAt: string;
  note: string;
  variant: number;
  blocks: string[];
  spec: string;
};

export type ScreenStatus = 'pending' | 'approved' | 'rejected' | 'changes';

export type DesignScreen = {
  id: string;
  projectId: string;
  name: string;
  purpose: string;
  components: string[];
  requirements: string[];
  status: ScreenStatus;
  approvedRevisionId?: string;
  revisions: Revision[];
};

export type JobStatus = 'queued' | 'building' | 'attention' | 'failed';

export type DevJob = {
  id: string;
  projectId: string;
  ownerId: string;
  status: JobStatus;
  provider: 'cursor' | 'fallback';
  progress: number;
  createdAt: string;
  updatedAt: string;
  verified: false;
  designRevisionIds: string[];
  log: { id: string; at: string; text: string }[];
  versions: { id: string; at: string; note: string }[];
  sample?: boolean;
};

export type Notice = {
  id: string;
  userId: string;
  type: 'build' | 'milestone' | 'deploy' | 'feature' | 'welcome' | 'design';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  projectId?: string;
  route?: string;
};

export type AssetKind = 'image' | 'logo' | 'icon' | 'illustration' | 'image-3d' | 'text-3d' | 'model';

export type Asset = {
  id: string;
  ownerId: string;
  projectId?: string;
  name: string;
  kind: AssetKind;
  prompt: string;
  status: 'saved' | 'provider-unavailable' | 'stored';
  uri?: string;
  bundled?: 'astronaut' | 'hero' | 'icon';
  fileName?: string;
  mime?: string;
  size?: number;
  createdAt: string;
  note: string;
};

export type Deployment = {
  id: string;
  projectId: string;
  ownerId: string;
  platform: 'web' | 'app-store' | 'play' | 'share';
  link: string;
  status: 'pending' | 'link-saved' | 'sample';
  deployedAt?: string;
  createdAt: string;
  note: string;
};

export type BuilderDraft = {
  mode: 'create' | 'edit' | 'feature';
  step: number;
  projectId?: string;
  type: ProjectType;
  name: string;
  description: string;
  aiModel: string;
  dataSource: string;
  template: string;
  instructions: string;
  sourceUrl: string;
  audience: string;
  features: string;
  voiceUri?: string;
  voiceTranscript?: string;
  files: ProjectFile[];
  screenNames: string[];
};

export type DB = {
  users: User[];
  sessionUserId: string | null;
  onboarded: boolean;
  deviceAnalytics: boolean;
  projects: Project[];
  screens: DesignScreen[];
  jobs: DevJob[];
  notifications: Notice[];
  assets: Asset[];
  deployments: Deployment[];
  draft: BuilderDraft | null;
};
