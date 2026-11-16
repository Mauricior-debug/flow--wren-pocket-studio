import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { authApi, deskApi, employeesApi, promptApi, ApiError } from '../lib/api';
import { clearToken, getApiBase, getToken, setApiBase, setToken, DEFAULT_API_BASE } from '../lib/session';
import { WREN_ROLE_ID } from '../lib/wrenConstants';

export type CrmUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  role?: string;
  [key: string]: any;
};

export type Prospect = {
  id: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  websiteUrl?: string;
  status?: string;
  buildRequest?: string;
  jobFiles?: any[];
  buildDelivery?: any;
  lastError?: string;
  analysis?: any;
  outreach?: any;
  demoVideo?: any;
  previewUrl?: string;
  recommendationLabel?: string;
  [key: string]: any;
};

export type LiveSite = {
  id: string;
  companyName?: string;
  status?: string;
  runStatus?: string;
  activity?: string;
  current?: string;
  note?: string;
  speech?: string;
  repoUrl?: string;
  prUrl?: string;
  agentUrl?: string;
  vercelUrl?: string;
  appKind?: string;
  expoQrUrl?: string;
  expoGoUrl?: string;
  expoEmbedUrl?: string;
  expoError?: string;
  error?: string;
  changes?: any;
  startedAt?: string;
  [key: string]: any;
};

type CrmValue = {
  ready: boolean;
  onboarded: boolean;
  apiBase: string;
  user: CrmUser | null;
  employee: any | null;
  prospects: Prospect[];
  kpis: any;
  liveMap: Record<string, LiveSite>;
  toast: string | null;
  error: string | null;
  loadingDesk: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  showToast: (message: string) => void;
  setOnboarded: (value: boolean) => Promise<void>;
  updateApiBase: (base: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string; requires2FA?: boolean; challengeToken?: string; email?: string }>;
  verify2fa: (email: string, code: string, challengeToken: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  findWren: () => Promise<any | null>;
  loadDesk: (status?: string) => Promise<void>;
  runTasks: (tasks: string[]) => Promise<{ ok: boolean; error?: string; summary?: string }>;
  prospectAction: (prospectId: string, action: string, extra?: Record<string, any>) => Promise<{ ok: boolean; error?: string; data?: any }>;
  followUp: (body: { text?: string; jobFiles?: any[]; prospectId?: string; company?: string }) => Promise<{ ok: boolean; error?: string; data?: any }>;
  cookJob: (body: { websiteUrl?: string; buildRequest?: string; jobFiles?: any[]; stack?: string }) => Promise<{ ok: boolean; error?: string; data?: any }>;
  saveArchitectConfig: (architectConfig: Record<string, any>) => Promise<{ ok: boolean; error?: string }>;
  wrenPrompt: (body: Record<string, any>) => Promise<any>;
};

const CrmContext = createContext<CrmValue | null>(null);
const ONBOARD_KEY = 'wren.onboarded.v2';

async function readOnboarded() {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return (await AsyncStorage.getItem(ONBOARD_KEY)) === '1';
  } catch {
    return false;
  }
}

async function writeOnboarded(value: boolean) {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  if (value) await AsyncStorage.setItem(ONBOARD_KEY, '1');
  else await AsyncStorage.removeItem(ONBOARD_KEY);
}

function mergeLive(prospect: Prospect, live?: LiveSite) {
  if (!live) return prospect;
  return {
    ...prospect,
    buildDelivery: {
      ...(prospect.buildDelivery || {}),
      ...live,
      agentId: prospect.buildDelivery?.agentId || live.id,
    },
  };
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [apiBase, setApiBaseState] = useState(DEFAULT_API_BASE);
  const [user, setUser] = useState<CrmUser | null>(null);
  const [employee, setEmployee] = useState<any | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [liveMap, setLiveMap] = useState<Record<string, LiveSite>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDesk, setLoadingDesk] = useState(false);
  const [statusFilter, setStatusFilter] = useState('work');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<any>(null);
  const employeeIdRef = useRef<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const stopLive = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {
        /* ignore */
      }
      esRef.current = null;
    }
  }, []);

  const findWren = useCallback(async () => {
    const data = await employeesApi.list();
    const list = Array.isArray(data?.employees) ? data.employees : [];
    const wren = list.find((item: any) => item.roleId === WREN_ROLE_ID) || null;
    setEmployee(wren);
    employeeIdRef.current = wren?._id || wren?.id || null;
    return wren;
  }, []);

  const loadDesk = useCallback(
    async (status?: string) => {
      const id = employeeIdRef.current;
      if (!id) return;
      setLoadingDesk(true);
      setError(null);
      try {
        const data = await deskApi.load(id, status ?? statusFilter, 40);
        setEmployee((prev: any) => ({ ...(prev || {}), ...(data.employee || {}) }));
        setProspects(Array.isArray(data.prospects) ? data.prospects : []);
        setKpis(data.kpis || {});
      } catch (err: any) {
        setError(err?.message || 'Could not load the desk.');
      } finally {
        setLoadingDesk(false);
      }
    },
    [statusFilter],
  );

  const startLive = useCallback(async () => {
    stopLive();
    const id = employeeIdRef.current;
    if (!id) return;
    const token = await getToken();
    const base = await getApiBase();
    if (!token) return;

    const building = true;
    const poll = () => {
      loadDesk().catch(() => undefined);
    };

    if (Platform.OS === 'web' && typeof EventSource !== 'undefined') {
      try {
        // Prefer cookie-less Bearer via query only if server supports it; otherwise poll.
        const source = new EventSource(`${base.replace(/\/$/, '')}/api/ai-employees/${id}/wren-live`, { withCredentials: true } as any);
        esRef.current = source;
        source.addEventListener('site', (event: any) => {
          try {
            const site = JSON.parse(event.data);
            if (!site?.id) return;
            setLiveMap((prev) => ({ ...prev, [site.id]: site }));
          } catch {
            /* ignore */
          }
        });
        source.addEventListener('ready', () => undefined);
        source.addEventListener('bye', () => {
          source.close();
          esRef.current = null;
          poll();
          pollRef.current = setInterval(poll, 4000);
        });
        source.onerror = () => {
          source.close();
          esRef.current = null;
          poll();
          if (!pollRef.current) pollRef.current = setInterval(poll, 4000);
        };
        return;
      } catch {
        /* fall through to poll */
      }
    }

    if (building) {
      pollRef.current = setInterval(poll, 4000);
    }
  }, [loadDesk, stopLive]);

  const refreshSession = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setEmployee(null);
      setProspects([]);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me.user || null);
      const wren = await findWren();
      if (wren) {
        await loadDesk();
        await startLive();
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setError(err?.message || 'Session restore failed.');
      }
    }
  }, [findWren, loadDesk, startLive]);

  useEffect(() => {
    (async () => {
      const [base, boarded] = await Promise.all([getApiBase(), readOnboarded()]);
      setApiBaseState(base);
      setOnboardedState(boarded);
      await refreshSession();
      setReady(true);
    })();
    return () => stopLive();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user && employeeIdRef.current) {
        loadDesk().catch(() => undefined);
        startLive().catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [user, loadDesk, startLive]);

  useEffect(() => {
    if (!user || !employeeIdRef.current) return;
    loadDesk(statusFilter).catch(() => undefined);
  }, [statusFilter]);

  const value = useMemo<CrmValue>(() => {
    const merged = prospects.map((item) => {
      const liveKey = item.buildDelivery?.agentId || item.id;
      return mergeLive(item, liveMap[liveKey] || liveMap[item.id]);
    });

    return {
      ready,
      onboarded,
      apiBase,
      user,
      employee,
      prospects: merged,
      kpis,
      liveMap,
      toast,
      error,
      loadingDesk,
      statusFilter,
      setStatusFilter,
      showToast,
      setOnboarded: async (next) => {
        await writeOnboarded(next);
        setOnboardedState(next);
      },
      updateApiBase: async (base) => {
        const next = await setApiBase(base);
        setApiBaseState(next);
      },
      login: async (email, password) => {
        try {
          const data = await authApi.login(email.trim(), password);
          if (data.requires2FA) {
            return { ok: false, error: data.message || 'Enter your verification code.', requires2FA: true, challengeToken: data.challengeToken, email: data.email || email };
          }
          if (!data.token) return { ok: false, error: data.message || 'Sign-in failed.' };
          await setToken(data.token);
          setUser(data.user || null);
          await writeOnboarded(true);
          setOnboardedState(true);
          const wren = await findWren();
          if (wren) {
            await loadDesk();
            await startLive();
          }
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Sign-in failed.' };
        }
      },
      verify2fa: async (email, code, challengeToken) => {
        try {
          const data = await authApi.verify2fa(email.trim(), code.trim(), challengeToken);
          if (!data.token) return { ok: false, error: data.message || 'Verification failed.' };
          await setToken(data.token);
          setUser(data.user || null);
          await writeOnboarded(true);
          setOnboardedState(true);
          const wren = await findWren();
          if (wren) {
            await loadDesk();
            await startLive();
          }
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Verification failed.' };
        }
      },
      logout: async () => {
        stopLive();
        await clearToken();
        setUser(null);
        setEmployee(null);
        setProspects([]);
        setLiveMap({});
        setKpis({});
      },
      refreshSession,
      findWren,
      loadDesk,
      runTasks: async (tasks) => {
        const id = employeeIdRef.current;
        if (!id) return { ok: false, error: 'Wren was not found on this account.' };
        try {
          const data = await deskApi.run(id, tasks);
          await loadDesk();
          showToast(data.summary || 'Mission started.');
          return { ok: true, summary: data.summary };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Mission failed.' };
        }
      },
      prospectAction: async (prospectId, action, extra = {}) => {
        const id = employeeIdRef.current;
        if (!id) return { ok: false, error: 'Wren was not found on this account.' };
        try {
          const data = await deskApi.patch(id, { prospectId, action, ...extra });
          await loadDesk();
          return { ok: true, data };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Action failed.' };
        }
      },
      followUp: async (body) => {
        const id = employeeIdRef.current;
        if (!id) return { ok: false, error: 'Wren was not found on this account.' };
        try {
          const data = await deskApi.patch(id, { action: 'follow_up', ...body });
          await loadDesk();
          showToast(data.queued ? 'Follow-up queued.' : 'Follow-up sent.');
          return { ok: true, data };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Follow-up failed.' };
        }
      },
      cookJob: async (body) => {
        const id = employeeIdRef.current;
        if (!id) return { ok: false, error: 'Wren was not found on this account.' };
        try {
          const data = await deskApi.patch(id, { action: 'add_website', ...body });
          await loadDesk();
          await startLive();
          showToast('Wren is cooking that job.');
          return { ok: true, data };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Could not cook the job.' };
        }
      },
      saveArchitectConfig: async (architectConfig) => {
        const id = employeeIdRef.current;
        if (!id) return { ok: false, error: 'Wren was not found on this account.' };
        try {
          const data = await employeesApi.update(id, { architectConfig });
          setEmployee((prev: any) => ({ ...(prev || {}), architectConfig: data?.architectConfig || architectConfig }));
          showToast('Desk options saved.');
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err?.message || 'Could not save options.' };
        }
      },
      wrenPrompt: async (body) => {
        const id = employeeIdRef.current;
        if (!id) throw new Error('Wren was not found on this account.');
        return promptApi.post(id, body);
      },
    };
  }, [ready, onboarded, apiBase, user, employee, prospects, kpis, liveMap, toast, error, loadingDesk, statusFilter, showToast, findWren, loadDesk, refreshSession, startLive, stopLive]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
