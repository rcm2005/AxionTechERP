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
import { db } from '@/mocks';
import styles from './PlaceholderPage.module.scss';

interface ModuloConfig {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  descricao: string;
  funcionalidades: string[];
  tag: string;
}

const MODULOS_CONFIG: Record<string, ModuloConfig> = {
  vendas: {
    titulo: 'Vendas & Comercial',
    subtitulo: 'Gestão completa do funil de vendas, pedidos e comissionamento.',
    icon: ShoppingCart,
    tag: 'Módulo Comercial',
    descricao:
      'Emissão de pedidos de venda, propostas comerciais, orçamentos, cálculo de comissões por vendedor e integração com faturamento.',
    funcionalidades: [
      'Emissão de Pedidos de Venda e Orçamentos',
      'Tabelas de Preços Personalizadas por Canal e Cliente',
      'Controle de Comissões e Metas da Equipe Comercial',
      'Faturamento Direto e Integração com Estoque & Financeiro',
    ],
  },
  compras: {
    titulo: 'Compras & Suprimentos',
    subtitulo: 'Controle de cotações, ordens de compra e gestão de fornecedores.',
    icon: ShoppingBag,
    tag: 'Módulo Suprimentos',
    descricao:
      'Gestão centralizada de compras corporativas, cotação com múltiplos fornecedores parceiros e recebimento fiscal com importação de XML de NF-e.',
    funcionalidades: [
      'Ordens de Compra e Pedidos de Suprimentos',
      'Cotação Comparativa de Preços e Prazos com Fornecedores',
      'Importação Automática de XML de NF-e de Entrada',
      'Integração com Contas a Pagar e Entrada em Estoque',
    ],
  },
  estoque: {
    titulo: 'Controle de Estoque',
    subtitulo: 'Movimentações físicas, múltiplos almoxarifados, lotes e inventário.',
    icon: Package,
    tag: 'Módulo Almoxarifado',
    descricao:
      'Rastreabilidade total de produtos, matérias-primas e insumos em estoque, com suporte a múltiplos depósitos, lotes, validade e ponto de pedido.',
    funcionalidades: [
      'Saldos Físicos e Financeiros por Depósito/Almoxarifado',
      'Rastreabilidade por Lote, Série e Validade',
      'Inventário Periódico e Ajustes com Trilha de Auditoria',
      'Alertas de Estoque Mínimo e Sugestão de Reposição',
    ],
  },
  fiscal: {
    titulo: 'Fiscal & Tributário',
    subtitulo: 'Emissão de documentos fiscais, escrituração e SPED.',
    icon: FileText,
    tag: 'Módulo Tributário',
    descricao:
      'Motor tributário com suporte a Simples Nacional, Lucro Presumido e Lucro Real, emissão de NF-e/NFC-e, MDF-e, cálculo automático de impostos (ICMS, IPI, PIS/COFINS, ISS) e geração de SPED.',
    funcionalidades: [
      'Emissão e Autorização de NF-e / NFC-e / NFS-e',
      'Motor de Regras Tributárias e Matriz de CFOP/CST',
      'Geração de Arquivos SPED Fiscal e Contribuições',
      'Painel de Conformidade e Auditoria Tributária',
    ],
  },
  configuracoes: {
    titulo: 'Configurações do Tenant',
    subtitulo: 'Parâmetros corporativos, controle de acesso e integrações.',
    icon: Settings,
    tag: 'Administração SaaS',
    descricao:
      'Parametrização global da empresa ativa, gestão de usuários corporativos, perfis de permissão RBAC, certificados digitais A1 e webhooks de integração.',
    funcionalidades: [
      'Dados Cadastrais, Logotipo e Parâmetros da Empresa',
      'Gestão de Usuários, Convites e Perfis de Acesso',
      'Instalação de Certificados Digitais A1 (e-CNPJ)',
      'Logs de Auditoria e Configuração de Webhooks/APIs',
    ],
  },
};

interface PlaceholderPageProps {
  moduloOverride?: string;
}

export function PlaceholderPage({ moduloOverride }: PlaceholderPageProps) {
  const location = useLocation();
  const { empresaAtivaId } = useAuth();

  const moduloKey =
    moduloOverride ||
    location.pathname.replace('/', '').split('/')[0] ||
    'vendas';

  const config = MODULOS_CONFIG[moduloKey] || {
    titulo: 'Módulo Corporativo',
    subtitulo: 'Funcionalidade em desenvolvimento no Roadmap Enterprise.',
    icon: Sparkles,
    tag: 'Roadmap SaaS',
    descricao: 'Este módulo está sendo estruturado para o ecossistema corporativo multi-tenant.',
    funcionalidades: [
      'Integração nativa com os demais módulos do ERP',
      'Segregação segura por Tenant e Unidade de Negócio',
      'Trilha de auditoria e conformidade LGPD',
    ],
  };

  useDocumentTitle(config.titulo);

  const IconComponent = config.icon;
  const empresaAtiva = db.tenants.find((t) => t.id === empresaAtivaId);

  return (
    <section className={styles.root}>
      <PageHead
        title={config.titulo}
        subtitle={config.subtitulo}
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

          <h2 className={styles.cardTitle}>{config.titulo}</h2>
          <p className={styles.cardDesc}>{config.descricao}</p>

          {empresaAtiva && (
            <div className={styles.tenantInfo}>
              <Building2 size={16} className={styles.tenantIcon} />
              <span>
                Empresa Ativa: <strong>{empresaAtiva.nomeFantasia || empresaAtiva.razaoSocial}</strong> ({empresaAtiva.cnpj})
              </span>
            </div>
          )}

          <div className={styles.featuresSection}>
            <h3 className={styles.featuresTitle}>Recursos em Estruturação:</h3>
            <ul className={styles.featuresList}>
              {config.funcionalidades.map((feat, i) => (
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
