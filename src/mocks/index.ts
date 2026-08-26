import type {
  Tenant,
  Usuario,
  Produto,
  Pessoa,
  LancamentoFinanceiro,
} from '@/types';
import { tenantsMock } from './tenants.mock';
import { usuariosMock } from './usuarios.mock';
import { produtosMock } from './produtos.mock';
import { pessoasMock } from './pessoas.mock';
import { lancamentosMock } from './lancamentos.mock';

const DB_KEY = 'axion_enterprise_erp_db_v1';

export interface DbSchema {
  tenants: Tenant[];
  usuarios: Usuario[];
  produtos: Produto[];
  pessoas: Pessoa[];
  lancamentos: LancamentoFinanceiro[];
}

function getDefaultDB(): DbSchema {
  return {
    tenants: [...tenantsMock],
    usuarios: [...usuariosMock],
    produtos: [...produtosMock],
    pessoas: [...pessoasMock],
    lancamentos: [...lancamentosMock],
  };
}

function initDB(): DbSchema {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<DbSchema>;
      // Valida integridade do schema
      if (
        Array.isArray(parsed.tenants) &&
        Array.isArray(parsed.usuarios) &&
        Array.isArray(parsed.produtos) &&
        Array.isArray(parsed.pessoas) &&
        Array.isArray(parsed.lancamentos)
      ) {
        return parsed as DbSchema;
      }
      console.warn('[DB] Schema antigo ou corrompido detectado no LocalStorage. Reinicializando...');
    } catch (e) {
      console.error('[DB] Erro ao ler DB do LocalStorage, restaurando padrão:', e);
    }
  }

  const defaultDb = getDefaultDB();
  localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
  return defaultDb;
}

export const db: DbSchema = initDB();

export function saveDB(): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDB(): DbSchema {
  const defaultDb = getDefaultDB();
  db.tenants = defaultDb.tenants;
  db.usuarios = defaultDb.usuarios;
  db.produtos = defaultDb.produtos;
  db.pessoas = defaultDb.pessoas;
  db.lancamentos = defaultDb.lancamentos;
  localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
  return db;
}

// Helpers de conveniência para contexto multi-tenant
export function getTenantById(tenantId: string): Tenant | undefined {
  return db.tenants.find((t) => t.id === tenantId);
}

export function getProdutosByTenant(tenantId: string): Produto[] {
  return db.produtos.filter((p) => p.tenantId === tenantId);
}

export function getPessoasByTenant(tenantId: string): Pessoa[] {
  return db.pessoas.filter((p) => p.tenantId === tenantId);
}

export function getLancamentosByTenant(tenantId: string): LancamentoFinanceiro[] {
  return db.lancamentos.filter((l) => l.tenantId === tenantId);
}

export * from './tenants.mock';
export * from './usuarios.mock';
export * from './produtos.mock';
export * from './pessoas.mock';
export * from './lancamentos.mock';
