import { useLocation } from 'react-router';
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  FileText,
  Settings,
  LayoutDashboard,
  type LucideIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHead } from '@/components/ui/PageHead/PageHead';
import { Button } from '@/components/ui/Button/Button';
import { paths } from '@/routes/paths';
import { USE_MOCKS } from '@/services/mockAdapter';
import { db } from '@/mocks';
import styles from './PlaceholderPage.module.scss';

interface ModuleConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
  features: string[];
  tag: string;
}

const MODULES_CONFIG: Record<string, ModuleConfig> = {
  vendas: {
    title: 'Vendas & Comercial',
    subtitle: 'Gestão completa do funil de vendas, pedidos e comissionamento.',
    icon: ShoppingCart,
    tag: 'Módulo Comercial',
    description:
      'Emissão de pedidos de venda, propostas comerciais, orçamentos, cálculo de comissões por vendedor e integração com faturamento.',
    features: [
      'Emissão de Pedidos de Venda e Orçamentos',
      'Tabelas de Preços Personalizadas por Canal e Cliente',
      'Controle de Comissões e Metas da Equipe Comercial',
      'Faturamento Direto e Integração com Estoque & Financeiro',
    ],
  },
  compras: {
    title: 'Compras & Suprimentos',
    subtitle: 'Controle de cotações, ordens de compra e gestão de fornecedores.',
    icon: ShoppingBag,
    tag: 'Módulo Suprimentos',
    description:
      'Gestão centralizada de compras corporativas, cotação com múltiplos fornecedores parceiros e recebimento fiscal com importação de XML de NF-e.',
    features: [
      'Ordens de Compra e Pedidos de Suprimentos',
      'Cotação Comparativa de Preços e Prazos com Fornecedores',
      'Importação Automática de XML de NF-e de Entrada',
      'Integração com Contas a Pagar e Entrada em Estoque',
    ],
  },
  estoque: {
    title: 'Controle de Estoque',
    subtitle: 'Movimentações físicas, múltiplos almoxarifados, lotes e inventário.',
    icon: Package,
    tag: 'Módulo Almoxarifado',
    description:
      'Rastreabilidade total de produtos, matérias-primas e insumos em estoque, com suporte a múltiplos depósitos, lotes, validade e ponto de pedido.',
    features: [
      'Saldos Físicos e Financeiros por Depósito/Almoxarifado',
      'Rastreabilidade por Lote, Série e Validade',
      'Inventário Periódico e Ajustes com Trilha de Auditoria',
      'Alertas de Estoque Mínimo e Sugestão de Reposição',
    ],
  },
  fiscal: {
    title: 'Fiscal & Tributário',
    subtitle: 'Emissão de documentos fiscais, escrituração e SPED.',
    icon: FileText,
    tag: 'Módulo Tributário',
    description:
      'Motor tributário com suporte a Simples Nacional, Lucro Presumido e Lucro Real, emissão de NF-e/NFC-e, MDF-e, cálculo automático de impostos (ICMS, IPI, PIS/COFINS, ISS) e geração de SPED.',
    features: [
      'Emissão e Autorização de NF-e / NFC-e / NFS-e',
      'Motor de Regras Tributárias e Matriz de CFOP/CST',
      'Geração de Arquivos SPED Fiscal e Contribuições',
      'Painel de Conformidade e Auditoria Tributária',
    ],
  },
  configuracoes: {
    title: 'Configurações do Tenant',
    subtitle: 'Parâmetros corporativos, controle de acesso e integrações.',
    icon: Settings,
    tag: 'Administração SaaS',
    description:
      'Parametrização global da empresa ativa, gestão de usuários corporativos, perfis de permissão RBAC, certificados digitais A1 e webhooks de integração.',
    features: [
      'Dados Cadastrais, Logotipo e Parâmetros da Empresa',
      'Gestão de Usuários, Convites e Perfis de Acesso',
      'Instalação de Certificados Digitais A1 (e-CNPJ)',
      'Logs de Auditoria e Configuração de Webhooks/APIs',
    ],
  },
};

interface PlaceholderPageProps {
  moduleOverride?: string;
}

export function PlaceholderPage({ moduleOverride }: PlaceholderPageProps) {
  const location = useLocation();
  const { empresaAtivaId } = useAuth();

  const moduleKey =
    moduleOverride ||
    location.pathname.replace('/', '').split('/')[0] ||
    'vendas';

  const config = MODULES_CONFIG[moduleKey] || {
    title: 'Módulo Corporativo',
    subtitle: 'Funcionalidade em desenvolvimento no Roadmap Enterprise.',
    icon: Sparkles,
    tag: 'Roadmap SaaS',
    description: 'Este módulo está sendo estruturado para o ecossistema corporativo multi-tenant.',
    features: [
      'Integração nativa com os demais módulos do ERP',
      'Segregação segura por Tenant e Unidade de Negócio',
      'Trilha de auditoria e conformidade LGPD',
    ],
  };

  useDocumentTitle(config.title);

  const IconComponent = config.icon;
  const activeTenant = USE_MOCKS ? db.tenants.find((t) => t.id === empresaAtivaId) : null;

  return (
    <section className={styles.root}>
      <PageHead
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Button variant="default" to={paths.dashboard}>
            <LayoutDashboard size={16} />
            Voltar ao Dashboard
          </Button>
        }
      />

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.badge}>
            <Sparkles size={13} />
            <span>{config.tag}</span>
          </div>

          <div className={styles.iconCircle}>
            <IconComponent size={36} />
          </div>

          <h2 className={styles.cardTitle}>{config.title}</h2>
          <p className={styles.cardDesc}>{config.description}</p>

          {activeTenant && (
            <div className={styles.tenantInfo}>
              <Building2 size={16} className={styles.tenantIcon} />
              <span>
                Empresa Ativa: <strong>{activeTenant.nomeFantasia || activeTenant.razaoSocial}</strong> ({activeTenant.cnpj})
              </span>
            </div>
          )}

          <div className={styles.featuresSection}>
            <h3 className={styles.featuresTitle}>Recursos em Estruturação:</h3>
            <ul className={styles.featuresList}>
              {config.features.map((feat, i) => (
                <li key={i} className={styles.featureItem}>
                  <ShieldCheck size={16} className={styles.checkIcon} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" to={paths.dashboard}>
              <span>Acessar Painel Principal</span>
              <ArrowRight size={16} />
            </Button>
            <Button variant="ghost" to={paths.financeiro}>
              Ver Módulo Financeiro
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
