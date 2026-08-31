import styles from './InterviewPanel.module.scss';

/**
 * Ilustração do hero: mostra, lado a lado, a entrevista guiada e a configuração
 * que ela produz. É estática por decisão — nada de loop de digitação, que gastaria
 * CPU sem acrescentar informação. A entrada é um único fade escalonado em CSS.
 */

const TROCA = [
  {
    de: 'axion',
    texto: 'Como o escritório cobra hoje? Pode ser mais de uma forma.',
  },
  {
    de: 'usuario',
    texto: 'Mensalidade de alguns clientes, e nos trabalhistas a gente ganha percentual do acordo.',
  },
  {
    de: 'axion',
    texto:
      'Certo: contrato recorrente + honorário de êxito. Vou ligar o cálculo de êxito ao encerramento do processo.',
  },
] as const;

const CONFIG = [
  { modulo: 'Processos', detalhe: 'Justiça do Trabalho, Cível' },
  { modulo: 'Prazos e audiências', detalhe: 'Alertas em D-10, D-3, D-1' },
  { modulo: 'Contratos', detalhe: 'Recorrente + êxito' },
  { modulo: 'Financeiro', detalhe: 'Honorário de êxito no ganho de causa' },
] as const;

export function InterviewPanel() {
  return (
    <div className={styles.panel} aria-label="Exemplo de entrevista guiada e da configuração resultante">
      <div className={styles.column}>
        <div className={styles.columnHead}>
          <span className={styles.dot} />
          Entrevista guiada
        </div>

        <ul className={styles.chat}>
          {TROCA.map((msg, i) => (
            <li
              key={msg.texto}
              className={msg.de === 'axion' ? styles.msgAxion : styles.msgUser}
              style={{ animationDelay: `${240 + i * 220}ms` }}
            >
              <span className={styles.msgAutor}>{msg.de === 'axion' ? 'Axion' : 'Você'}</span>
              {msg.texto}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.column}>
        <div className={styles.columnHead}>
          <span className={styles.dotAccent} />
          Configuração aplicada
        </div>

        <ul className={styles.config}>
          {CONFIG.map((item, i) => (
            <li
              key={item.modulo}
              className={styles.configItem}
              style={{ animationDelay: `${900 + i * 130}ms` }}
            >
              <span className={styles.check} aria-hidden="true" />
              <span className={styles.configModulo}>{item.modulo}</span>
              <span className={styles.configDetalhe}>{item.detalhe}</span>
            </li>
          ))}
        </ul>

        <p className={styles.rodape}>
          Módulos existentes, ligados e parametrizados — não é código novo escrito na hora.
        </p>
      </div>
    </div>
  );
}
