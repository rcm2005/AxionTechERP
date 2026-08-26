interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 200, formatValue }: BarChartProps) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = 48;
  const gap = 16;
  const padL = 8;
  const padB = 38;
  const padT = 24;
  const chartH = height - padB - padT;
  const totalW = data.length * (barW + gap) + padL;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalW} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
      role="img"
      aria-label="Gráfico de barras"
    >
      {data.map((d, i) => {
        const bH = Math.max((d.value / maxVal) * chartH, 2);
        const x = padL + i * (barW + gap);
        const y = padT + chartH - bH;
        return (
          <g key={`${d.label}-${i}`}>
            <rect x={x} y={y} width={barW} height={bH} rx={4} fill={d.color} opacity={0.85} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fontFamily="var(--font-sans)" fill="var(--color-muted)">
              {formatValue ? formatValue(d.value) : String(d.value)}
            </text>
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize={10} fontFamily="var(--font-sans)" fill="var(--color-muted)">
              {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
