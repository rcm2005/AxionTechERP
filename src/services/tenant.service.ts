import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

export interface TenantBranding {
  nomeExibicao: string;
  corPrimaria: string;
}

interface TenantCurrentResponse {
  id: string;
  nome: string;
  config: {
    branding: TenantBranding;
  };
}

export async function getTenantBranding(): Promise<TenantBranding | null> {
  if (USE_MOCKS) {
    await delay(150);
    return null;
  }
  const { data } = await http.get<TenantCurrentResponse>('/tenants/current');
  return data.config.branding;
}
