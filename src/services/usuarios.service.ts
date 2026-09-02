import { db } from '@/mocks';
import { USE_MOCKS, delay } from './mockAdapter';
import { http } from './http';

/**
 * Real shape of `GET /api/usuarios` — leaner than `Usuario` (which
 * carries fields from a multi-tenant/accountant model that the API does not have,
 * see `auth.service.ts`). Using this type here avoids asserting fields
 * (`nomeExibicao`, `iniciais`, `tenantIds`...) that only exist in the mock.
 */
export interface UserSummary {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

/**
 * Minimal (read-only) users service.
 *
 * Currently exists only to populate the "assignee" select in the schedule.
 * User mutations (invitation, roles, deactivation) are out of scope.
 */
export async function listUsers(): Promise<UserSummary[]> {
  if (USE_MOCKS) {
    await delay();
    return db.usuarios.map((u) => ({
      id: u.id,
      tenant_id: u.tenantAtivoId ?? u.tenantIds[0] ?? '',
      name: u.nome,
      email: u.email,
      role: u.role === 'admin' ? 'admin' : 'user',
      created_at: u.criadoEm,
    }));
  }
  const { data } = await http.get<Array<{ id: string; tenant_id: string; nome: string; email: string; role: 'admin' | 'user'; created_at: string }>>('/usuarios');
  return data.map((u) => ({
    id: u.id,
    tenant_id: u.tenant_id,
    name: u.nome,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
  }));
}
