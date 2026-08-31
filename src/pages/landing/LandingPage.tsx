import { useEffect } from 'react';
import { Link } from 'react-router';
import { CalendarClock, Gavel, ReceiptText, Users } from 'lucide-react';
import { EarlyAccessForm } from '@/components/landing/EarlyAccessForm';
import { InterviewPanel } from '@/components/landing/InterviewPanel';
import { LandingNav } from '@/components/landing/LandingNav';
import { Reveal } from '@/components/landing/Reveal';
import { COMPANY_NAME, SUPPORT_EMAIL } from '@/config/app';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import styles from './LandingPage.module.scss';

const CAMINHOS = [
  {
    rotulo: 'Caminho 1',
    titulo: 'ERP genérico de prateleira',
    texto:
      'Serve a todo mundo e a ninguém. Você adapta o escritório ao software, contrata consultoria para configurar campos e passa a chamar de "processo" um campo que se chama "ordem de serviço".',
    tom: 'problema' as const,
  },
  {
    rotulo: 'Caminho 2',
    titulo: 'Software sob medida gerado por IA',
    texto:
      'Rápido de demonstrar, caro de manter. Cada cliente vira uma base de código diferente, sem ninguém que a conheça, e o primeiro bug fiscal sério não tem a quem recorrer.',
    tom: 'problema' as const,
  },
  {
    rotulo: 'O nosso',
    titulo: 'Template vertical configurado por entrevista',
    texto:
      'Um ERP profundo, escrito e testado por gente, para um setor específico. A IA não escreve o sistema — ela entende o seu escritório e liga as peças certas do sistema que já existe.',
    tom: 'axion' as const,
  },
];

const PASSOS = [
  {
    numero: '01',
    titulo: 'A entrevista',
    texto:
      'Trinta a quarenta minutos de conversa em português, sem jargão de TI. Como vocês cobram, quem aprova o quê, quais prazos não podem passar, o que hoje mora numa planilha. Você não precisa saber o que é um ERP para responder.',
  },
  {
    numero: '02',
    titulo: 'A configuração',
    texto:
      'Suas respostas viram parâmetros de um template que já existe: módulos ligados, papéis e permissões, tipos de contrato, regras de honorário, alertas de prazo. É configuração revisável — dá para ler, conferir e mudar depois.',
  },
  {
    numero: '03',
    titulo: 'A operação',
    texto:
      'Você entra em um sistema que já fala a sua língua no primeiro dia. Quando a rotina mudar, muda-se a configuração — não se reescreve o software, e a atualização do produto continua chegando para você.',
  },
];

const MODULOS = [
  {
    Icone: Gavel,
    titulo: 'Processos e andamentos',
    texto:
      'Cadastro por número, vara e cliente, com histórico de andamentos, partes envolvidas e documentos anexados ao processo — não a uma pasta solta no drive.',
  },
  {
    Icone: CalendarClock,
    titulo: 'Prazos e audiências',
    texto:
      'Agenda com prazo fatal separado de prazo interno, alertas escalonados e visão por responsável. O que vence esta semana aparece antes de você procurar.',
  },
  {
    Icone: Users,
    titulo: 'Clientes e contratos',
    texto:
      'Pessoa física e jurídica, contratos recorrentes ou por causa, e a ligação entre o cliente, os processos dele e o que ainda está em aberto.',
  },
  {
    Icone: ReceiptText,
    titulo: 'Financeiro com êxito',
    texto:
      'Contas a pagar e a receber, honorários fixos e o cálculo de honorário de êxito amarrado ao desfecho do processo — a parte que quase nenhum ERP genérico modela.',
  },
];

const VERTICAIS = [
  {
    nome: 'Advocacia',
    estado: 'No ar',
    ativo: true,
    texto: 'Primeira vertical, em acesso antecipado com um número limitado de escritórios.',
  },
  {
    nome: 'Varejo',
    estado: 'Em construção',
    ativo: false,
    texto: 'Estoque, SKUs, compras e frente de caixa — módulos já em desenvolvimento no produto.',
  },
  {
    nome: 'Agronegócio',
    estado: 'Planejado',
    ativo: false,
    texto: 'Safra, insumos e custo por talhão. Ainda em pesquisa: nada prometido com data.',
  },
];

export function LandingPage() {
  useDocumentTitle('ERP configurado por entrevista');

  // Scroll suave apenas nesta página: `scroll-behavior` só surte efeito no
  // elemento que rola (html), e o CSS da landing é empacotado junto com o do
  // app — então ligamos e desligamos aqui em vez de declarar globalmente.
  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const raiz = document.documentElement;
    const anterior = raiz.style.scrollBehavior;
    raiz.style.scrollBehavior = 'smooth';
    return () => {
      raiz.style.scrollBehavior = anterior;
    };
  }, []);

  return (
    <div className={`theme-landing ${styles.page}`} id="topo">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <Reveal>
                  <p className={styles.eyebrow}>
                    <span className={styles.eyebrowDot} aria-hidden="true" />
                    Acesso antecipado · Vertical jurídico
                  </p>
                </Reveal>

                <Reveal delay={80}>
                  <h1 className={styles.h1}>
                    Você descreve o escritório.
                    <br />
                    <em className={styles.em}>Nós entregamos o ERP.</em>
                  </h1>
                </Reveal>

                <Reveal delay={160}>
                  <p className={styles.lead}>
                    A Axion conduz uma entrevista guiada por IA — em português, sem jargão — e usa as
                    suas respostas para configurar um ERP vertical que já existe, já foi testado e já
                    tem manutenção. Você não precisa saber o que é um ERP para sair com um.
                  </p>
                </Reveal>

                <Reveal delay={240}>
                  <div className={styles.heroActions}>
                    <a href="#acesso" className={styles.btnPrimary}>
                      Entrar na lista de acesso
                    </a>
                    <a href="#como-funciona" className={styles.btnGhost}>
                      Ver como funciona
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={300}>
                  <p className={styles.heroNota}>
                    Uma vertical no ar hoje: escritórios de advocacia. Sem cartão para entrar na lista.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={200} className={styles.heroVisual}>
                <InterviewPanel />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Posicionamento */}
        <section className={styles.section} id="produto">
          <div className={styles.container}>
            <Reveal>
              <p className={styles.kicker}>O problema</p>
              <h2 className={styles.h2}>
                Quem precisa de um ERP costuma ter <em className={styles.em}>duas saídas ruins</em>.
              </h2>
            </Reveal>

            <div className={styles.caminhos}>
              {CAMINHOS.map((c, i) => (
                <Reveal
                  key={c.titulo}
                  delay={i * 90}
                  className={c.tom === 'axion' ? styles.caminhoAxion : styles.caminho}
                >
                  <p className={styles.caminhoRotulo}>{c.rotulo}</p>
                  <h3 className={styles.h3}>{c.titulo}</h3>
                  <p className={styles.body}>{c.texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className={styles.sectionAlt} id="como-funciona">
          <div className={styles.container}>
            <Reveal>
              <p className={styles.kicker}>Como funciona</p>
              <h2 className={styles.h2}>Da conversa ao sistema em três etapas.</h2>
            </Reveal>

            <ol className={styles.passos}>
              {PASSOS.map((p, i) => (
                <Reveal as="li" key={p.numero} delay={i * 90} className={styles.passo}>
                  <span className={styles.passoNumero}>{p.numero}</span>
                  <div>
                    <h3 className={styles.h3}>{p.titulo}</h3>
                    <p className={styles.body}>{p.texto}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Vertical jurídica */}
        <section className={styles.section}>
          <div className={styles.container}>
            <Reveal>
              <p className={styles.kicker}>Vertical jurídica</p>
              <h2 className={styles.h2}>
                Modelado para escritório de advocacia —{' '}
                <em className={styles.em}>não adaptado de um genérico</em>.
              </h2>
              <p className={styles.sectionLead}>
                A profundidade é o ponto. Um template vertical nasce sabendo que prazo fatal não é a
                mesma coisa que lembrete, e que honorário de êxito não é uma parcela comum.
              </p>
            </Reveal>

            <div className={styles.modulos}>
              {MODULOS.map(({ Icone, titulo, texto }, i) => (
                <Reveal key={titulo} delay={i * 80} className={styles.modulo}>
                  <Icone className={styles.moduloIcone} size={20} strokeWidth={1.6} aria-hidden="true" />
                  <h3 className={styles.h3}>{titulo}</h3>
                  <p className={styles.body}>{texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Verticais / roadmap */}
        <section className={styles.sectionAlt} id="verticais">
          <div className={styles.container}>
            <Reveal>
              <p className={styles.kicker}>Verticais</p>
              <h2 className={styles.h2}>Uma de cada vez, com profundidade.</h2>
              <p className={styles.sectionLead}>
                Cada vertical é um produto inteiro, não um tema de cores. Por isso são poucas — e por
                isso dizemos exatamente em que estágio cada uma está.
              </p>
            </Reveal>

            <div className={styles.verticais}>
              {VERTICAIS.map((v, i) => (
                <Reveal
                  key={v.nome}
                  delay={i * 80}
                  className={v.ativo ? styles.verticalAtiva : styles.vertical}
                >
                  <div className={styles.verticalTopo}>
                    <h3 className={styles.h3}>{v.nome}</h3>
                    <span className={v.ativo ? styles.selo : styles.seloDim}>{v.estado}</span>
                  </div>
                  <p className={styles.body}>{v.texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta} id="acesso">
          <div className={styles.container}>
            <div className={styles.ctaGrid}>
              <Reveal>
                <p className={styles.kicker}>Acesso antecipado</p>
                <h2 className={styles.h2}>
                  Estamos abrindo para um <em className={styles.em}>número pequeno</em> de escritórios.
                </h2>
                <p className={styles.sectionLead}>
                  O produto é novo e a lista é curta de propósito: cada escritório que entra agora
                  passa pela entrevista com a gente junto e influencia o que o template vira. Se isso
                  soa cedo demais para você, provavelmente é — e tudo bem.
                </p>
                <p className={styles.ctaContato}>
                  Prefere escrever direto?{' '}
                  <a className={styles.ctaLink} href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </Reveal>

              <Reveal delay={120} className={styles.ctaForm}>
                <EarlyAccessForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerBrand}>Axion Tech</p>
              <p className={styles.footerTagline}>
                ERPs verticais configurados por entrevista. Produto em acesso antecipado.
              </p>
            </div>
            <nav className={styles.footerLinks} aria-label="Links do rodapé">
              <a href="#como-funciona">Como funciona</a>
              <a href="#produto">O produto</a>
              <a href="#verticais">Verticais</a>
              <a href={`mailto:${SUPPORT_EMAIL}`}>Contato</a>
              <Link to={paths.login}>Entrar</Link>
            </nav>
          </div>
          <p className={styles.footerLegal}>
            © {new Date().getFullYear()} {COMPANY_NAME}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
