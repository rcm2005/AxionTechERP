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

export function BarChart({ data, height = 180, formatValue }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 48;
  const gap = 16;
  const padLeft = 16;
  const padBottom = 36;
  const padTop = 16;
  const chartH = height - padBottom - padTop;
  const totalW = data.length * (barWidth + gap) + padLeft;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalW} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
      aria-label="Gráfico de barras"
    >
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * chartH, 2);
        const x = padLeft + i * (barWidth + gap);
        const y = padTop + chartH - barH;

        return (
          <g key={d.label}>
            {/* barra */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={d.color}
              opacity={0.85}
            />
            {/* valor no topo */}
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-sans)"
              fill="var(--color-muted)"
            >
              {formatValue ? formatValue(d.value) : d.value}
            </text>
            {/* label embaixo */}
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--font-sans)"
              fill="var(--color-muted)"
            >
              {d.label.length > 10 ? d.label.slice(0, 10) + '…' : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
