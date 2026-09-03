import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface TenantBranding {
  nomeExibicao: string;
  corPrimaria: string;
}

export interface NavItem {
  id: string;
  label: string;
  visivel: boolean;
}

export interface TenantConfig {
  branding: TenantBranding;
  navegacao: {
    itens: NavItem[];
  };
}

interface TenantCurrentResponse {
  id: string;
  nome: string;
  config: {
    branding: TenantBranding;
    navegacao: {
      itens: NavItem[];
    };
  };
  /** ISO timestamp or null — null means this tenant predates trial tracking (e.g. seed/demo
   * tenants) or was never granted one. Never treat a missing value as "trial active" or
   * "trial expired" with a made-up date — it means "no trial data for this tenant". */
  trial_ends_at: string | null;
}

export async function getTenantConfig(): Promise<{ branding: TenantBranding; navegacao: { itens: NavItem[] } } | null> {
  if (USE_MOCKS) {
    await delay(150);
    return null;
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return data.config;
}

export interface TenantTrial {
  trialEndsAt: string | null;
}

export async function getTenantTrial(): Promise<TenantTrial> {
  if (USE_MOCKS) {
    await delay(150);
    // Mock mode has no persisted trial state — `src/mocks/tenants.mock.ts` models a different,
    // pre-existing multi-tenant-switcher concept unrelated to this backend field. Same convention
    // as `processos.service.ts`'s in-memory store: a value computed relative to "today" so the
    // countdown looks alive during local demos, never persisted, never presented as real data —
    // this branch never runs against a real tenant (gated by USE_MOCKS/VITE_USE_MOCKS).
    const nineDaysFromNow = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    return { trialEndsAt: nineDaysFromNow.toISOString() };
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return { trialEndsAt: data.trial_ends_at };
}
