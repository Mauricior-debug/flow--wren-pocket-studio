import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { persistUpload } from '../lib/files';
import { fileKind, passwordOk, shareLink, titleFromIdea, uid, validEmail } from '../lib/format';
import { hapticSuccess, hapticWarning } from '../lib/haptics';
import {
  buildJourneys,
  buildRoadmap,
  modelMeta,
  nextReply,
  openingQuestion,
  proposeScreens,
  recommendStack,
  revisionFor,
} from '../lib/planner';
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, blankUser, buildDemoRecords, emptyDB } from './seed';
import type {
  Asset,
  AssetKind,
  BuilderDraft,
  DB,
  Deployment,
  DesignScreen,
  DevJob,
  Notice,
  Project,
  ProjectFile,
  ProjectType,
  User,
} from './types';

const KEY = 'wren-pocket-studio-v1';

type Result = { ok: true } | { ok: false; error: string };

type StoreValue = {
  ready: boolean;
  error: string | null;
  toast: string | null;
  onboarded: boolean;
  user: User | null;
  projects: Project[];
  screens: DesignScreen[];
  jobs: DevJob[];
  notifications: Notice[];
  assets: Asset[];
  deployments: Deployment[];
  draft: BuilderDraft | null;
  unread: number;
  retry: () => void;
  resetDevice: () => Promise<void>;
  clearToast: () => void;
  completeOnboarding: (analytics: boolean) => void;
  signUp: (input: { name: string; email: string; password: string; confirm: string }) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signInWithGoogle: (email: string, name: string) => Promise<Result>;
  enterDemo: () => Promise<Result>;
  signOut: () => void;
  requestPasswordReset: (email: string) => Result;
  setNewPasswordFromReset: (email: string, password: string, confirm: string) => Promise<Result>;
  updateProfile: (input: { name: string; email: string; avatarUri?: string }) => Promise<Result>;
  changePassword: (current: string, next: string, confirm: string) => Promise<Result>;
  updateNotificationSettings: (patch: Partial<User['notificationSettings']>) => void;
  updatePreferences: (patch: Partial<User['preferences']>) => void;
  setConsentAnalytics: (value: boolean) => void;
  deleteAccount: () => Promise<void>;
  exportJson: () => string;
  setDraft: (draft: BuilderDraft | null) => void;
  patchDraft: (patch: Partial<BuilderDraft>) => void;
  saveBuilder: () => Promise<{ ok: true; projectId: string } | { ok: false; error: string }>;
  startFromPrompt: (text: string, extra?: { voiceUri?: string; type?: ProjectType }) => string | null;
  sendPlanMessage: (projectId: string, text: string) => void;
  saveBrief: (projectId: string) => void;
  generateScreens: (projectId: string) => void;
  approveScreen: (screenId: string) => void;
  rejectScreen: (screenId: string) => void;
  regenerateScreen: (screenId: string) => void;
  requestScreenChange: (screenId: string, note: string) => void;
  approveAll: (projectId: string) => void;
  createJob: (projectId: string) => { ok: true; jobId: string } | { ok: false; error: string };
  addJobInstruction: (jobId: string, text: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  addAsset: (input: { name: string; kind: AssetKind; prompt: string; uri?: string; fileName?: string; mime?: string; size?: number; projectId?: string }) => Asset | null;
  requestDeploy: (projectId: string, platform: Deployment['platform']) => void;
  saveRepo: (projectId: string, repoUrl: string) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  addFeature: (projectId: string, text: string) => void;
  deleteProject: (projectId: string) => void;
  attachFiles: (target: 'draft' | 'project', projectId: string | undefined, files: { uri: string; name: string; mime: string; size?: number }[]) => Promise<void>;
};

const Ctx = createContext<StoreValue | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function normalize(raw: Partial<DB> | null): DB {
  const base = emptyDB();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    users: Array.isArray(raw.users) ? raw.users : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    screens: Array.isArray(raw.screens) ? raw.screens : [],
    jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
    notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
    assets: Array.isArray(raw.assets) ? raw.assets : [],
    deployments: Array.isArray(raw.deployments) ? raw.deployments : [],
    draft: raw.draft ?? null,
    onboarded: Boolean(raw.onboarded),
    sessionUserId: raw.sessionUserId ?? null,
  };
}

function welcomeNotice(userId: string): Notice {
  return {
    id: uid('note'),
    userId,
    type: 'welcome',
    title: 'Welcome to Wren Studio!',
    message: 'Thanks for joining! Let’s build something amazing.',
    read: false,
    createdAt: new Date().toISOString(),
    route: '/(tabs)',
  };
}

function emptyDraft(partial: Partial<BuilderDraft>): BuilderDraft {
  return {
    mode: 'create',
    step: 1,
    type: 'new-website',
    name: '',
    description: '',
    aiModel: 'gpt-4o',
    dataSource: 'none',
    template: 'Modern',
    instructions: '',
    sourceUrl: '',
    audience: '',
    features: '',
    files: [],
    screenNames: [],
    ...partial,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dbRef = useRef<DB | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (next: DB) => {
    dbRef.current = next;
    setDb(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      setError('The workspace could not be saved on this device.');
    });
  };

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const next = normalize(raw ? (JSON.parse(raw) as Partial<DB>) : null);
      dbRef.current = next;
      setDb(next);
      setError(null);
    } catch {
      setError('The workspace on this device could not be read.');
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const value = useMemo<StoreValue>(() => {
    const current = db ?? emptyDB();
    const user = current.users.find((item) => item.id === current.sessionUserId) ?? null;
    const hapticsOn = user?.preferences.haptics !== false;
    const projects = user ? current.projects.filter((item) => item.ownerId === user.id) : [];
    const projectIds = new Set(projects.map((item) => item.id));
    const screens = current.screens.filter((item) => projectIds.has(item.projectId));
    const jobs = current.jobs.filter((item) => projectIds.has(item.projectId));
    const notifications = user ? current.notifications.filter((item) => item.userId === user.id) : [];
    const assets = user ? current.assets.filter((item) => item.ownerId === user.id) : [];
    const deployments = user ? current.deployments.filter((item) => item.ownerId === user.id) : [];

    const commit = (recipe: (draft: DB) => void) => {
      const base = dbRef.current;
      if (!base) return;
      const next = clone(base);
      recipe(next);
      persist(next);
    };

    const pushNotice = (draft: DB, notice: Omit<Notice, 'id' | 'createdAt' | 'read' | 'userId'> & { userId?: string }) => {
      const owner = notice.userId ?? draft.sessionUserId;
      if (!owner) return;
      const account = draft.users.find((item) => item.id === owner);
      if (notice.type === 'build' && account && !account.notificationSettings.builds) return;
      if (notice.type === 'design' && account && !account.notificationSettings.designReviews) return;
      if (notice.type === 'deploy' && account && !account.notificationSettings.deployments) return;
      if ((notice.type === 'feature' || notice.type === 'welcome') && account && !account.notificationSettings.productNews) return;
      draft.notifications.unshift({
        id: uid('note'),
        createdAt: new Date().toISOString(),
        read: false,
        userId: owner,
        ...notice,
      });
    };

    const touchProject = (draft: DB, projectId: string, recipe: (project: Project) => void) => {
      const project = draft.projects.find((item) => item.id === projectId);
      if (!project) return;
      recipe(project);
      project.updatedAt = new Date().toISOString();
    };

    return {
      ready,
      error,
      toast,
      onboarded: current.onboarded,
      user,
      projects,
      screens,
      jobs,
      notifications,
      assets,
      deployments,
      draft: current.draft,
      unread: notifications.filter((item) => !item.read).length,
      retry: () => {
        setReady(false);
        load();
      },
      resetDevice: async () => {
        await AsyncStorage.removeItem(KEY);
        const next = emptyDB();
        dbRef.current = next;
        setDb(next);
        setError(null);
        setReady(true);
      },
      clearToast: () => setToast(null),
      completeOnboarding: (analytics) => {
        commit((draft) => {
          draft.onboarded = true;
          draft.deviceAnalytics = analytics;
        });
      },
      signUp: async ({ name, email, password, confirm }) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Wren user';
        if (!validEmail(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
        if (!passwordOk(password)) return { ok: false, error: 'Use at least 8 characters with a letter and a number.' };
        if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
        const base = dbRef.current;
        if (!base) return { ok: false, error: 'The workspace is still loading.' };
        if (base.users.some((item) => item.email === cleanEmail)) return { ok: false, error: 'That email is already in use.' };
        const salt = Crypto.randomUUID();
        const passwordHash = await hashPassword(password, salt);
        commit((draft) => {
          const account = blankUser({
            id: uid('user'),
            email: cleanEmail,
            name: cleanName,
            provider: 'password',
            passwordHash,
            salt,
            avatar: 'none',
            consent: {
              termsAt: new Date().toISOString(),
              privacyAt: new Date().toISOString(),
              analytics: draft.deviceAnalytics,
            },
          });
          draft.users.push(account);
          draft.sessionUserId = account.id;
          draft.onboarded = true;
          if (account.notificationSettings.productNews) draft.notifications.unshift(welcomeNotice(account.id));
        });
        await hapticSuccess(true);
        return { ok: true };
      },
      signIn: async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        const base = dbRef.current;
        if (!base) return { ok: false, error: 'The workspace is still loading.' };
        const account = base.users.find((item) => item.email === cleanEmail);
        if (!account || !account.passwordHash || !account.salt) return { ok: false, error: 'Those credentials don’t match an account on this device.' };
        const hashed = await hashPassword(password, account.salt);
        if (hashed !== account.passwordHash) return { ok: false, error: 'Those credentials don’t match an account on this device.' };
        commit((draft) => {
          draft.sessionUserId = account.id;
          draft.onboarded = true;
        });
        await hapticSuccess(account.preferences.haptics);
        return { ok: true };
      },
      signInWithGoogle: async (email, name) => {
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();
        if (!validEmail(cleanEmail)) return { ok: false, error: 'Enter the email on the Google account.' };
        if (cleanName.length < 2) return { ok: false, error: 'Enter the name on the Google account.' };
        const base = dbRef.current;
        if (!base) return { ok: false, error: 'The workspace is still loading.' };
        const existing = base.users.find((item) => item.email === cleanEmail);
        if (existing && existing.provider === 'password') {
          return { ok: false, error: 'That email already uses a password on this device.' };
        }
        commit((draft) => {
          let account = draft.users.find((item) => item.email === cleanEmail);
          if (!account) {
            account = blankUser({
              id: uid('user'),
              email: cleanEmail,
              name: cleanName,
              provider: 'google',
              passwordHash: null,
              salt: null,
              avatar: 'none',
            });
            draft.users.push(account);
            draft.notifications.unshift(welcomeNotice(account.id));
          } else {
            account.name = cleanName;
          }
          draft.sessionUserId = account.id;
          draft.onboarded = true;
        });
        await hapticSuccess(hapticsOn);
        return { ok: true };
      },
      enterDemo: async () => {
        const base = dbRef.current ?? emptyDB();
        let account = base.users.find((item) => item.email === DEMO_EMAIL);
        if (!account) {
          const salt = Crypto.randomUUID();
          const passwordHash = await hashPassword(DEMO_PASSWORD, salt);
          const id = uid('user');
          const records = buildDemoRecords(id);
          account = blankUser({
            id,
            email: DEMO_EMAIL,
            name: DEMO_NAME,
            provider: 'password',
            passwordHash,
            salt,
            avatar: 'alex',
          });
          commit((draft) => {
            draft.users.push(account as User);
            draft.projects.push(...records.projects);
            draft.screens.push(...records.screens);
            draft.jobs.push(...records.jobs);
            draft.notifications.push(...records.notifications);
            draft.assets.push(...records.assets);
            draft.deployments.push(...records.deployments);
            draft.sessionUserId = id;
            draft.onboarded = true;
          });
          await hapticSuccess(true);
          return { ok: true };
        }
        if (!account.salt || !account.passwordHash) return { ok: false, error: 'The demo account has no password on this device.' };
        const hashed = await hashPassword(DEMO_PASSWORD, account.salt);
        if (hashed !== account.passwordHash) return { ok: false, error: 'The demo password was changed on this device.' };
        commit((draft) => {
          draft.sessionUserId = account?.id ?? null;
          draft.onboarded = true;
        });
        await hapticSuccess(account.preferences.haptics);
        return { ok: true };
      },
      signOut: () => {
        commit((draft) => {
          draft.sessionUserId = null;
          draft.draft = null;
        });
      },
      requestPasswordReset: (email) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!validEmail(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
        const base = dbRef.current;
        const account = base?.users.find((item) => item.email === cleanEmail);
        if (!account) return { ok: false, error: 'No account on this device uses that email.' };
        if (account.provider === 'google' && !account.passwordHash) {
          commit((draft) => {
            const match = draft.users.find((item) => item.email === cleanEmail);
            if (match) match.resetReady = true;
          });
          return { ok: true };
        }
        commit((draft) => {
          const match = draft.users.find((item) => item.email === cleanEmail);
          if (match) match.resetReady = true;
        });
        return { ok: true };
      },
      setNewPasswordFromReset: async (email, password, confirm) => {
        const cleanEmail = email.trim().toLowerCase();
        const base = dbRef.current;
        const account = base?.users.find((item) => item.email === cleanEmail);
        if (!account?.resetReady) return { ok: false, error: 'Request a reset for this email first.' };
        if (!passwordOk(password)) return { ok: false, error: 'Use at least 8 characters with a letter and a number.' };
        if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
        const salt = Crypto.randomUUID();
        const passwordHash = await hashPassword(password, salt);
        commit((draft) => {
          const match = draft.users.find((item) => item.email === cleanEmail);
          if (!match) return;
          match.salt = salt;
          match.passwordHash = passwordHash;
          match.resetReady = false;
          match.provider = 'password';
        });
        await hapticSuccess(account.preferences.haptics);
        showToast('Password updated');
        return { ok: true };
      },
      updateProfile: async ({ name, email, avatarUri }) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (cleanName.length < 2) return { ok: false, error: 'Enter your name.' };
        if (!validEmail(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
        const base = dbRef.current;
        if (!user || !base) return { ok: false, error: 'Sign in first.' };
        if (base.users.some((item) => item.email === cleanEmail && item.id !== user.id)) {
          return { ok: false, error: 'That email is already in use.' };
        }
        let stored = user.avatarUri;
        if (avatarUri && avatarUri !== user.avatarUri) stored = await persistUpload(avatarUri, 'avatars', 'avatar.jpg');
        commit((draft) => {
          const account = draft.users.find((item) => item.id === user.id);
          if (!account) return;
          account.name = cleanName;
          account.email = cleanEmail;
          if (stored) {
            account.avatar = 'custom';
            account.avatarUri = stored;
          }
        });
        await hapticSuccess(hapticsOn);
        showToast('Profile saved');
        return { ok: true };
      },
      changePassword: async (currentPassword, next, confirm) => {
        if (!user) return { ok: false, error: 'Sign in first.' };
        if (user.provider === 'google' && !user.passwordHash) {
          if (!passwordOk(next)) return { ok: false, error: 'Use at least 8 characters with a letter and a number.' };
          if (next !== confirm) return { ok: false, error: 'Passwords do not match.' };
          const salt = Crypto.randomUUID();
          const passwordHash = await hashPassword(next, salt);
          commit((draft) => {
            const account = draft.users.find((item) => item.id === user.id);
            if (!account) return;
            account.salt = salt;
            account.passwordHash = passwordHash;
          });
          await hapticSuccess(hapticsOn);
          showToast('Password saved');
          return { ok: true };
        }
        if (!user.salt || !user.passwordHash) return { ok: false, error: 'This account has no password yet.' };
        const hashed = await hashPassword(currentPassword, user.salt);
        if (hashed !== user.passwordHash) return { ok: false, error: 'The current password is wrong.' };
        if (!passwordOk(next)) return { ok: false, error: 'Use at least 8 characters with a letter and a number.' };
        if (next !== confirm) return { ok: false, error: 'Passwords do not match.' };
        const salt = Crypto.randomUUID();
        const passwordHash = await hashPassword(next, salt);
        commit((draft) => {
          const account = draft.users.find((item) => item.id === user.id);
          if (!account) return;
          account.salt = salt;
          account.passwordHash = passwordHash;
        });
        await hapticSuccess(hapticsOn);
        showToast('Password updated');
        return { ok: true };
      },
      updateNotificationSettings: (patch) => {
        if (!user) return;
        commit((draft) => {
          const account = draft.users.find((item) => item.id === user.id);
          if (!account) return;
          account.notificationSettings = { ...account.notificationSettings, ...patch };
        });
      },
      updatePreferences: (patch) => {
        if (!user) return;
        commit((draft) => {
          const account = draft.users.find((item) => item.id === user.id);
          if (!account) return;
          account.preferences = { ...account.preferences, ...patch };
        });
      },
      setConsentAnalytics: (analytics) => {
        if (!user) return;
        commit((draft) => {
          const account = draft.users.find((item) => item.id === user.id);
          if (!account) return;
          account.consent.analytics = analytics;
          draft.deviceAnalytics = analytics;
        });
      },
      deleteAccount: async () => {
        if (!user) return;
        await hapticWarning(hapticsOn);
        commit((draft) => {
          const id = user.id;
          draft.users = draft.users.filter((item) => item.id !== id);
          const ids = new Set(draft.projects.filter((item) => item.ownerId === id).map((item) => item.id));
          draft.projects = draft.projects.filter((item) => item.ownerId !== id);
          draft.screens = draft.screens.filter((item) => !ids.has(item.projectId));
          draft.jobs = draft.jobs.filter((item) => item.ownerId !== id);
          draft.notifications = draft.notifications.filter((item) => item.userId !== id);
          draft.assets = draft.assets.filter((item) => item.ownerId !== id);
          draft.deployments = draft.deployments.filter((item) => item.ownerId !== id);
          draft.sessionUserId = null;
          draft.draft = null;
        });
      },
      exportJson: () => {
        if (!user) return '{}';
        return JSON.stringify(
          {
            user: { id: user.id, email: user.email, name: user.name, preferences: user.preferences, notificationSettings: user.notificationSettings },
            projects,
            screens,
            jobs: jobs.map((job) => ({ ...job, verified: job.verified })),
            notifications,
            assets,
            deployments,
          },
          null,
          2,
        );
      },
      setDraft: (draft) => {
        commit((state) => {
          state.draft = draft;
        });
      },
      patchDraft: (patch) => {
        commit((state) => {
          state.draft = { ...(state.draft ?? emptyDraft({})), ...patch };
        });
      },
      saveBuilder: async () => {
        const draft = dbRef.current?.draft;
        const owner = dbRef.current?.users.find((item) => item.id === dbRef.current?.sessionUserId);
        if (!draft || !owner) return { ok: false, error: 'Sign in before saving a project.' };
        if (draft.mode === 'feature') {
          if (!draft.projectId) return { ok: false, error: 'Choose the project this feature belongs to.' };
          if (draft.instructions.trim().length < 8) return { ok: false, error: 'Describe the feature in a sentence.' };
          const feature = draft.instructions.trim();
          commit((state) => {
            touchProject(state, draft.projectId as string, (project) => {
              project.tasks.push({ id: uid('task'), title: feature, done: false });
              project.activity.unshift({ id: uid('act'), text: `Feature requested: ${feature}`, at: new Date().toISOString() });
              if (!project.features.includes(feature)) project.features.push(feature);
            });
            const job = state.jobs.find((item) => item.projectId === draft.projectId);
            if (job) {
              job.log.push({ id: uid('log'), at: new Date().toISOString(), text: `Additional instruction: ${feature}` });
              job.versions.push({ id: uid('ver'), at: new Date().toISOString(), note: feature });
              job.updatedAt = new Date().toISOString();
              job.verified = false;
            }
            pushNotice(state, {
              type: 'feature',
              title: 'Feature added to the brief',
              message: feature,
              projectId: draft.projectId,
              route: `/project/${draft.projectId}`,
            });
            state.draft = null;
          });
          await hapticSuccess(owner.preferences.haptics);
          return { ok: true, projectId: draft.projectId };
        }
        if (draft.name.trim().length < 2) return { ok: false, error: 'Give the app a name.' };
        if (draft.mode === 'edit' && draft.projectId) {
          commit((state) => {
            touchProject(state, draft.projectId as string, (project) => {
              project.name = draft.name.trim();
              project.description = draft.description.trim();
              project.type = draft.type;
              project.aiModel = draft.aiModel;
              project.dataSource = draft.dataSource;
              project.template = draft.template;
              project.instructions = draft.instructions.trim() || project.instructions;
              project.sourceUrl = draft.sourceUrl.trim();
              project.files = draft.files.length ? draft.files : project.files;
              project.activity.unshift({ id: uid('act'), text: 'Project details updated. Approved screens were kept.', at: new Date().toISOString() });
            });
            state.draft = null;
          });
          await hapticSuccess(owner.preferences.haptics);
          return { ok: true, projectId: draft.projectId };
        }
        const features = draft.features.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);
        const audience = draft.audience.trim();
        const id = uid('proj');
        const proposed = proposeScreens({
          type: draft.type,
          name: draft.name.trim(),
          audience,
          features,
          template: draft.template,
        }).filter((item) => draft.screenNames.length === 0 || draft.screenNames.includes(item.name));
        const designScreens: DesignScreen[] = proposed.map((item) => ({
          id: uid('screen'),
          projectId: id,
          name: item.name,
          purpose: item.purpose,
          components: item.components,
          requirements: item.requirements,
          status: 'pending',
          revisions: [revisionFor(item, draft.template, 0, 'First design')],
        }));
        const project: Project = {
          id,
          ownerId: owner.id,
          name: draft.name.trim(),
          description: draft.description.trim() || draft.instructions.trim(),
          type: draft.type,
          aiModel: draft.aiModel,
          dataSource: draft.dataSource,
          template: draft.template,
          status: 'design',
          progress: designScreens.length ? 40 : 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructions: draft.instructions.trim(),
          sourceUrl: draft.sourceUrl.trim(),
          repoUrl: '',
          audience,
          features,
          journeys: buildJourneys(audience, features),
          stack: recommendStack(draft.type, draft.template),
          roadmap: buildRoadmap(Boolean(audience || features.length), designScreens.length > 0, false),
          briefSaved: Boolean(audience || features.length || draft.description.trim()),
          planAwaiting: null,
          messages: [],
          files: draft.files,
          tasks: [
            { id: uid('task'), title: 'Review the brief', done: Boolean(audience) },
            { id: uid('task'), title: 'Approve the screens', done: false },
            { id: uid('task'), title: 'Start a remote development job', done: false },
          ],
          completedFeatures: [],
          activity: [{ id: uid('act'), text: 'Project created on this device.', at: new Date().toISOString() }],
          analytics: { visitors: null, interactions: null, uptime: null },
          notifyBuilds: true,
        };
        if (draft.voiceUri) {
          project.files.push({
            id: uid('file'),
            name: 'Voice note',
            uri: draft.voiceUri,
            mime: 'audio/m4a',
            kind: 'audio',
          });
        }
        commit((state) => {
          state.projects.unshift(project);
          state.screens.push(...designScreens);
          pushNotice(state, {
            type: 'design',
            title: 'Screens are ready to review',
            message: `${project.name} has ${designScreens.length} screen${designScreens.length === 1 ? '' : 's'} waiting.`,
            projectId: id,
            route: `/design/${id}`,
          });
          state.draft = null;
        });
        await hapticSuccess(owner.preferences.haptics);
        showToast(modelMeta(draft.aiModel).remote ? 'Saved. Remote model unavailable — brief is on this device.' : 'Project saved');
        return { ok: true, projectId: id };
      },
      startFromPrompt: (text, extra) => {
        const owner = dbRef.current?.users.find((item) => item.id === dbRef.current?.sessionUserId);
        const idea = text.trim();
        if (!owner) return null;
        if (idea.length < 4 && !extra?.voiceUri) return null;
        const opened = openingQuestion(idea);
        const id = uid('proj');
        const project: Project = {
          id,
          ownerId: owner.id,
          name: titleFromIdea(idea || 'Voice note'),
          description: idea,
          type: extra?.type ?? 'native-app',
          aiModel: owner.preferences.defaultModel,
          dataSource: extra?.voiceUri ? 'files' : 'none',
          template: owner.preferences.defaultTemplate,
          status: 'planning',
          progress: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructions: idea,
          sourceUrl: '',
          repoUrl: '',
          audience: opened.audience,
          features: opened.features,
          journeys: [],
          stack: [],
          roadmap: buildRoadmap(false, false, false),
          briefSaved: false,
          planAwaiting: opened.awaiting,
          messages: [
            { id: uid('msg'), role: 'wren', text: 'Tell me what you want to build, and I’ll plan it before anything is designed.' },
            ...(idea ? [{ id: uid('msg'), role: 'user' as const, text: idea }] : []),
            { id: uid('msg'), role: 'wren', text: opened.reply },
          ],
          files: extra?.voiceUri
            ? [{ id: uid('file'), name: 'Voice note', uri: extra.voiceUri, mime: 'audio/m4a', kind: 'audio' }]
            : [],
          tasks: [{ id: uid('task'), title: 'Finish the brief', done: false }],
          completedFeatures: [],
          activity: [{ id: uid('act'), text: 'Planning started.', at: new Date().toISOString() }],
          analytics: { visitors: null, interactions: null, uptime: null },
          notifyBuilds: true,
        };
        commit((state) => {
          state.projects.unshift(project);
        });
        return id;
      },
      sendPlanMessage: (projectId, text) => {
        const answer = text.trim();
        if (!answer) return;
        commit((state) => {
          touchProject(state, projectId, (project) => {
            project.messages.push({ id: uid('msg'), role: 'user', text: answer });
            if (project.planAwaiting) {
              const next = nextReply(project.planAwaiting, answer, project.audience);
              project.audience = next.audience || project.audience;
              if (next.features.length) project.features = next.features;
              project.planAwaiting = next.awaiting;
              project.messages.push({ id: uid('msg'), role: 'wren', text: next.reply });
              if (!next.awaiting) {
                project.journeys = buildJourneys(project.audience, project.features);
                project.stack = recommendStack(project.type, project.template);
                project.roadmap = buildRoadmap(false, false, false);
              }
            } else {
              project.instructions = `${project.instructions}\n${answer}`.trim();
              project.messages.push({
                id: uid('msg'),
                role: 'wren',
                text: 'Added to the brief. Save it when you want the screens drafted.',
              });
            }
          });
        });
      },
      saveBrief: (projectId) => {
        commit((state) => {
          touchProject(state, projectId, (project) => {
            project.briefSaved = true;
            project.journeys = buildJourneys(project.audience, project.features);
            project.stack = recommendStack(project.type, project.template);
            project.roadmap = buildRoadmap(true, state.screens.some((item) => item.projectId === projectId), false);
            project.status = project.status === 'planning' ? 'planning' : project.status;
            project.tasks = project.tasks.map((task) => (task.title === 'Finish the brief' ? { ...task, done: true } : task));
            project.activity.unshift({ id: uid('act'), text: 'Brief saved.', at: new Date().toISOString() });
            project.messages.push({ id: uid('msg'), role: 'wren', text: 'Brief saved on this device. Generate the screens when you want to review them.' });
          });
        });
        showToast('Brief saved');
      },
      generateScreens: (projectId) => {
        const base = dbRef.current;
        const project = base?.projects.find((item) => item.id === projectId);
        if (!project) return;
        const existing = new Set((base?.screens ?? []).filter((item) => item.projectId === projectId).map((item) => item.name));
        const proposed = proposeScreens({
          type: project.type,
          name: project.name,
          audience: project.audience,
          features: project.features,
          template: project.template,
        }).filter((item) => !existing.has(item.name));
        commit((state) => {
          proposed.forEach((item) => {
            state.screens.push({
              id: uid('screen'),
              projectId,
              name: item.name,
              purpose: item.purpose,
              components: item.components,
              requirements: item.requirements,
              status: 'pending',
              revisions: [revisionFor(item, project.template, 0, 'Generated from the brief')],
            });
          });
          touchProject(state, projectId, (item) => {
            item.status = item.status === 'live' || item.status === 'building' ? item.status : 'design';
            item.progress = Math.max(item.progress, 40);
            item.roadmap = buildRoadmap(true, true, false);
            item.activity.unshift({ id: uid('act'), text: `${proposed.length} screen${proposed.length === 1 ? '' : 's'} drafted.`, at: new Date().toISOString() });
          });
          pushNotice(state, {
            type: 'design',
            title: 'Designs are ready',
            message: `${project.name} has screens to approve.`,
            projectId,
            route: `/design/${projectId}`,
          });
        });
        showToast('Screens drafted');
      },
      approveScreen: (screenId) => {
        commit((state) => {
          const screen = state.screens.find((item) => item.id === screenId);
          if (!screen) return;
          const latest = screen.revisions[screen.revisions.length - 1];
          screen.status = 'approved';
          screen.approvedRevisionId = latest?.id;
          touchProject(state, screen.projectId, (project) => {
            project.activity.unshift({ id: uid('act'), text: `Approved “${screen.name}”.`, at: new Date().toISOString() });
          });
        });
        hapticSuccess(hapticsOn);
      },
      rejectScreen: (screenId) => {
        commit((state) => {
          const screen = state.screens.find((item) => item.id === screenId);
          if (!screen) return;
          screen.status = 'rejected';
          screen.approvedRevisionId = undefined;
          touchProject(state, screen.projectId, (project) => {
            project.activity.unshift({ id: uid('act'), text: `Rejected “${screen.name}”.`, at: new Date().toISOString() });
          });
        });
      },
      regenerateScreen: (screenId) => {
        commit((state) => {
          const screen = state.screens.find((item) => item.id === screenId);
          const project = state.projects.find((item) => item.id === screen?.projectId);
          if (!screen || !project) return;
          const latest = screen.revisions[screen.revisions.length - 1];
          const next = revisionFor(
            { name: screen.name, purpose: screen.purpose, blocks: latest?.blocks ?? ['hero', 'list', 'actions'] },
            project.template,
            (latest?.variant ?? 0) + 1,
            'Regenerated on this device',
          );
          screen.revisions.push(next);
          if (screen.status === 'approved') screen.status = 'changes';
          else screen.status = 'pending';
          touchProject(state, project.id, (item) => {
            item.activity.unshift({ id: uid('act'), text: `New revision of “${screen.name}”. The approved one stays until you accept it.`, at: new Date().toISOString() });
          });
        });
      },
      requestScreenChange: (screenId, note) => {
        const text = note.trim();
        if (!text) return;
        commit((state) => {
          const screen = state.screens.find((item) => item.id === screenId);
          const project = state.projects.find((item) => item.id === screen?.projectId);
          if (!screen || !project) return;
          const latest = screen.revisions[screen.revisions.length - 1];
          screen.revisions.push(
            revisionFor(
              { name: screen.name, purpose: screen.purpose, blocks: latest?.blocks ?? ['hero', 'list'] },
              project.template,
              (latest?.variant ?? 0) + 1,
              text,
            ),
          );
          screen.status = 'changes';
          touchProject(state, project.id, (item) => {
            item.activity.unshift({ id: uid('act'), text: `Change requested on “${screen.name}”.`, at: new Date().toISOString() });
          });
        });
      },
      approveAll: (projectId) => {
        commit((state) => {
          state.screens.forEach((screen) => {
            if (screen.projectId !== projectId || screen.status === 'rejected') return;
            const latest = screen.revisions[screen.revisions.length - 1];
            screen.status = 'approved';
            screen.approvedRevisionId = latest?.id;
          });
          touchProject(state, projectId, (project) => {
            project.roadmap = buildRoadmap(true, true, true);
            project.tasks = project.tasks.map((task) => (task.title.startsWith('Approve') ? { ...task, done: true } : task));
            project.activity.unshift({ id: uid('act'), text: 'Design approved.', at: new Date().toISOString() });
          });
        });
        hapticSuccess(hapticsOn);
        showToast('Design approved');
      },
      createJob: (projectId) => {
        const base = dbRef.current;
        const owner = base?.users.find((item) => item.id === base.sessionUserId);
        const project = base?.projects.find((item) => item.id === projectId);
        if (!owner || !project) return { ok: false, error: 'That project is not on this device.' };
        const related = (base?.screens ?? []).filter((item) => item.projectId === projectId && item.status !== 'rejected');
        if (!related.length) return { ok: false, error: 'Generate screens before starting a development job.' };
        if (related.some((item) => !item.approvedRevisionId)) {
          return { ok: false, error: 'Approve every screen before development. A requested change keeps the last approved revision.' };
        }
        const jobId = uid('job');
        const revisionIds = related.map((item) => item.approvedRevisionId).filter((id): id is string => Boolean(id));
        commit((state) => {
          const job: DevJob = {
            id: jobId,
            projectId,
            ownerId: owner.id,
            status: 'queued',
            provider: 'cursor',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            verified: false,
            designRevisionIds: revisionIds,
            log: [
              { id: uid('log'), at: new Date().toISOString(), text: 'Job created. Approved design revisions are attached.' },
              { id: uid('log'), at: new Date().toISOString(), text: 'Cursor Cloud Agent is not connected from this device. Nothing has been built or verified.' },
            ],
            versions: [{ id: uid('ver'), at: new Date().toISOString(), note: 'Job opened from the approved design.' }],
          };
          state.jobs.unshift(job);
          touchProject(state, projectId, (item) => {
            item.status = 'building';
            item.progress = Math.max(item.progress, 5);
            item.activity.unshift({ id: uid('act'), text: 'Development job queued. Not verified.', at: new Date().toISOString() });
          });
          pushNotice(state, {
            type: 'build',
            title: 'Development job queued',
            message: `${project.name} is waiting for a remote agent. Nothing is verified yet.`,
            projectId,
            route: `/job/${jobId}`,
          });
        });
        hapticSuccess(owner.preferences.haptics);
        return { ok: true, jobId };
      },
      addJobInstruction: (jobId, text) => {
        const note = text.trim();
        if (!note) return;
        commit((state) => {
          const job = state.jobs.find((item) => item.id === jobId);
          if (!job) return;
          job.log.push({ id: uid('log'), at: new Date().toISOString(), text: `Instruction: ${note}` });
          job.versions.push({ id: uid('ver'), at: new Date().toISOString(), note });
          job.updatedAt = new Date().toISOString();
          job.verified = false;
          job.status = job.status === 'failed' ? 'attention' : job.status;
          touchProject(state, job.projectId, (project) => {
            project.activity.unshift({ id: uid('act'), text: 'Instruction added without restarting the project.', at: new Date().toISOString() });
          });
        });
        showToast('Instruction added');
      },
      markRead: (id) => {
        commit((state) => {
          const notice = state.notifications.find((item) => item.id === id);
          if (notice) notice.read = true;
        });
      },
      markAllRead: () => {
        if (!user) return;
        commit((state) => {
          state.notifications.forEach((item) => {
            if (item.userId === user.id) item.read = true;
          });
        });
      },
      clearNotifications: () => {
        if (!user) return;
        commit((state) => {
          state.notifications = state.notifications.filter((item) => item.userId !== user.id);
        });
      },
      addAsset: (input) => {
        if (!user) return null;
        const remote = input.kind === 'image' || input.kind === 'logo' || input.kind === 'icon' || input.kind === 'illustration' || input.kind === 'image-3d' || input.kind === 'text-3d';
        const hasFile = Boolean(input.uri);
        const asset: Asset = {
          id: uid('asset'),
          ownerId: user.id,
          projectId: input.projectId,
          name: input.name.trim() || 'Untitled asset',
          kind: input.kind,
          prompt: input.prompt.trim(),
          status: hasFile ? 'stored' : remote ? 'provider-unavailable' : 'saved',
          uri: input.uri,
          fileName: input.fileName,
          mime: input.mime,
          size: input.size,
          createdAt: new Date().toISOString(),
          note: hasFile
            ? 'File stored on this device.'
            : 'No generation provider is connected. The request is saved here and was not rendered.',
        };
        commit((state) => {
          state.assets.unshift(asset);
        });
        return asset;
      },
      requestDeploy: (projectId, platform) => {
        const ownerId = user?.id;
        const project = projects.find((item) => item.id === projectId);
        if (!ownerId || !project) return;
        const record: Deployment = {
          id: uid('dep'),
          projectId,
          ownerId,
          platform,
          link: shareLink(project.name),
          status: 'pending',
          createdAt: new Date().toISOString(),
          note: 'Requested on this device. This is not a verified deployment.',
        };
        commit((state) => {
          state.deployments.unshift(record);
          touchProject(state, projectId, (item) => {
            item.activity.unshift({ id: uid('act'), text: `Deployment requested (${platform}). Not verified.`, at: new Date().toISOString() });
          });
        });
        showToast('Deployment requested. It stays pending until a build is verified.');
      },
      saveRepo: (projectId, repoUrl) => {
        commit((state) => {
          touchProject(state, projectId, (project) => {
            project.repoUrl = repoUrl.trim();
          });
        });
        showToast('Repository link saved');
      },
      toggleTask: (projectId, taskId) => {
        commit((state) => {
          touchProject(state, projectId, (project) => {
            project.tasks = project.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));
          });
        });
      },
      addFeature: (projectId, text) => {
        const feature = text.trim();
        if (!feature) return;
        commit((state) => {
          touchProject(state, projectId, (project) => {
            project.tasks.push({ id: uid('task'), title: feature, done: false });
            project.features.push(feature);
            project.activity.unshift({ id: uid('act'), text: `Feature requested: ${feature}`, at: new Date().toISOString() });
          });
          const job = [...state.jobs].reverse().find((item) => item.projectId === projectId) ?? state.jobs.find((item) => item.projectId === projectId);
          if (job) {
            job.log.push({ id: uid('log'), at: new Date().toISOString(), text: `Additional instruction: ${feature}` });
            job.versions.push({ id: uid('ver'), at: new Date().toISOString(), note: feature });
            job.updatedAt = new Date().toISOString();
            job.verified = false;
          }
        });
        showToast('Feature added to the project');
      },
      deleteProject: (projectId) => {
        hapticWarning(hapticsOn);
        commit((state) => {
          state.projects = state.projects.filter((item) => item.id !== projectId);
          state.screens = state.screens.filter((item) => item.projectId !== projectId);
          state.jobs = state.jobs.filter((item) => item.projectId !== projectId);
          state.deployments = state.deployments.filter((item) => item.projectId !== projectId);
        });
      },
      attachFiles: async (target, projectId, files) => {
        const stored: ProjectFile[] = [];
        for (const file of files) {
          const uri = await persistUpload(file.uri, projectId ?? 'draft', file.name);
          stored.push({
            id: uid('file'),
            name: file.name,
            uri,
            mime: file.mime,
            size: file.size,
            kind: fileKind(file.mime, file.name),
          });
        }
        commit((state) => {
          if (target === 'draft' && state.draft) state.draft.files.push(...stored);
          if (target === 'project' && projectId) {
            touchProject(state, projectId, (project) => {
              project.files.push(...stored);
              project.activity.unshift({ id: uid('act'), text: `${stored.length} file${stored.length === 1 ? '' : 's'} added.`, at: new Date().toISOString() });
            });
          }
        });
      },
    };
  }, [db, ready, error, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Store missing');
  return ctx;
}
