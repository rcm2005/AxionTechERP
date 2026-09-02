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
}

export async function getTenantConfig(): Promise<{ branding: TenantBranding; navegacao: { itens: NavItem[] } } | null> {
  if (USE_MOCKS) {
    await delay(150);
    return null;
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return data.config;
}
