import { useNavigate } from 'react-router';
import styles from './LandingPage.module.scss';
import { paths } from '@/routes/paths';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.landingContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>Axion Tech</div>
        <nav className={styles.nav}>
          <button className={styles.loginBtn} onClick={() => navigate(paths.login)}>
            Login
          </button>
        </nav>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.mainTitle}>
              O ERP que coloca a <span className={styles.highlight}>Inteligência Artificial</span> e a <span className={styles.highlight}>Reforma Tributária</span> para trabalhar pela sua Indústria
            </h1>
            <p className={styles.subtitle}>
              Automatize sua produção, antecipe-se às regras do IBS/CBS e integre tudo com seu contador em tempo real.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryBtn} onClick={() => navigate(paths.login)}>Agendar Diagnóstico</button>
              <button className={styles.secondaryBtn}>Como Funciona</button>
            </div>
          </div>
        </section>

        {/* 2. Social Proof Logos */}
        <section className={styles.socialProof}>
          <p>Empresas e Contadores que já confiam</p>
          <div className={styles.logosContainer}>
            <span className={styles.placeholderLogo}>Empresa Alfa</span>
            <span className={styles.placeholderLogo}>Indústria Beta</span>
            <span className={styles.placeholderLogo}>Contabilidade Tech</span>
            <span className={styles.placeholderLogo}>Varejo Omega</span>
          </div>
        </section>

        {/* 3. Features (Bento Grid) */}
        <section className={styles.featuresSection}>
          <h2>Tecnologia que transforma a operação</h2>
          <div className={styles.bentoGrid}>
            <article className={styles.bentoCard}>
              <h3>Motor Fiscal IBS/CBS</h3>
              <p>Atualização em 48h com os novos layouts da Receita Federal. Evite multas e simplifique a transição tributária.</p>
            </article>
            <article className={styles.bentoCard}>
              <h3>Motor Industrial MRP</h3>
              <p>Gestão avançada de Estoque e Ordens de Produção. Controle matéria-prima e custos com precisão cirúrgica.</p>
            </article>
            <article className={styles.bentoCard}>
              <h3>IA Nativa</h3>
              <p>Extração automática de NFs por OCR e suporte inteligente via Copilot ERP para decisões ágeis.</p>
            </article>
            <article className={styles.bentoCard}>
              <h3>Portal do Contador</h3>
              <p>Acesso multi-tenant para seu escritório contábil, eliminando envio manual de arquivos e fechamentos demorados.</p>
            </article>
          </div>
        </section>

        {/* 4. Métricas de Impacto */}
        <section className={styles.metricsSection}>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>+500h</span>
            <span className={styles.metricLabel}>Horas salvas mensalmente</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Compliance Fiscal (IBS/CBS)</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>3x</span>
            <span className={styles.metricLabel}>Integrações mais rápidas</span>
          </div>
        </section>

        {/* 5. Call To Action Final */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2>Pronto para escalar sua Indústria?</h2>
            <p>Descubra como o Axion ERP pode revolucionar sua gestão hoje.</p>
            <button className={styles.primaryBtn} onClick={() => navigate(paths.login)}>Ver Planos e Preços</button>
          </div>
        </section>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Axion Tech. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
