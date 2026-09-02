import styles from './InterviewPanel.module.scss';

/**
 * Hero illustration: shows, side by side, the guided interview and the configuration
 * it produces. It is static by design — no typing loop, which would waste
 * CPU without adding information. The entrance is a single staggered CSS fade.
 */

const EXCHANGE = [
  {
    from: 'axion',
    text: 'Como o escritório cobra hoje? Pode ser mais de uma forma.',
  },
  {
    from: 'user',
    text: 'Mensalidade de alguns clientes, e nos trabalhistas a gente ganha percentual do acordo.',
  },
  {
    from: 'axion',
    text:
      'Certo: contrato recorrente + honorário de êxito. Vou ligar o cálculo de êxito ao encerramento do processo.',
  },
] as const;

const APPLIED_CONFIG = [
  { module: 'Processos', detail: 'Justiça do Trabalho, Cível' },
  { module: 'Prazos e audiências', detail: 'Alertas em D-10, D-3, D-1' },
  { module: 'Contratos', detail: 'Recorrente + êxito' },
  { module: 'Financeiro', detail: 'Honorário de êxito no ganho de causa' },
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
          {EXCHANGE.map((msg, i) => (
            <li
              key={msg.text}
              className={msg.from === 'axion' ? styles.msgAxion : styles.msgUser}
              style={{ animationDelay: `${240 + i * 220}ms` }}
            >
              <span className={styles.msgAutor}>{msg.from === 'axion' ? 'Axion' : 'Você'}</span>
              {msg.text}
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
          {APPLIED_CONFIG.map((item, i) => (
            <li
              key={item.module}
              className={styles.configItem}
              style={{ animationDelay: `${900 + i * 130}ms` }}
            >
              <span className={styles.check} aria-hidden="true" />
              <span className={styles.configModulo}>{item.module}</span>
              <span className={styles.configDetalhe}>{item.detail}</span>
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
