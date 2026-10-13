type EvolutionEntry = {
  label: string;
  points: number;
};

type Props = {
  data: readonly EvolutionEntry[];
};

export default function FantasyPointsEvolution({
  data,
}: Props) {
  if (data.length === 0) {
    return (
      <section className="mt-7 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
          Evolución Fantasy
        </p>
        <h2 className="mt-1 text-lg font-black text-zinc-950">
          Tu rendimiento por jornada
        </h2>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          La gráfica aparecerá cuando termine tu primera jornada
          con puntos definitivos.
        </p>
      </section>
    );
  }

  const values = data.map((entry) => entry.points);
  const best = Math.max(...values);
  const worst = Math.min(...values);
  const average =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;

  // Un ancho mínimo permite leer las etiquetas en móvil.
  // Con varias jornadas, el gráfico se puede desplazar en horizontal.
  const width = Math.max(320, data.length * 59 + 65);
  const height = 204;
  const left = 34;
  const right = 20;
  const top = 23;
  const bottom = 37;
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;

  // Siempre incluimos el cero para interpretar correctamente
  // jornadas con puntuaciones negativas y positivas.
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const range = maxValue - minValue;

  function xAt(index: number): number {
    return data.length === 1
      ? left + plotWidth / 2
      : left + (index / (data.length - 1)) * plotWidth;
  }

  function yAt(value: number): number {
    return top + ((maxValue - value) / range) * plotHeight;
  }

  const polyline = data
    .map((entry, index) => `${xAt(index)},${yAt(entry.points)}`)
    .join(" ");

  const axisValues = Array.from(
    new Set(
      minValue < 0
        ? [maxValue, 0, minValue]
        : [maxValue, Math.round(maxValue / 2), 0],
    ),
  );

  return (
    <section
      className="mt-7 rounded-[1.4rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
      aria-labelledby="fantasy-evolution-heading"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
            Evolución Fantasy
          </p>
          <h2
            id="fantasy-evolution-heading"
            className="mt-1 text-lg font-black tracking-tight text-zinc-950"
          >
            Puntos por jornada
          </h2>
        </div>
        <span className="shrink-0 text-[9px] font-semibold text-zinc-400">
          Últimas {data.length} puntuadas
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Summary label="Mejor" value={best} />
        <Summary label="Peor" value={worst} />
        <Summary label="Media" value={average.toFixed(1)} />
      </div>

      <div
        className="mt-4 overflow-x-auto pb-1"
        role="region"
        aria-label="Gráfica desplazable de puntos por jornada"
        tabIndex={0}
      >
        <svg
          role="img"
          aria-label={`Puntos Fantasy por jornada: ${data.map((entry) => `${entry.label}, ${entry.points} puntos`).join("; ")}`}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-none"
        >
          {axisValues.map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke={tick === 0 ? "#94a3a0" : "#e6ece8"}
                strokeDasharray={tick === 0 ? "3 3" : "4 5"}
                strokeWidth={tick === 0 ? 1.4 : 1}
              />
              <text
                x={left - 8}
                y={yAt(tick) + 3}
                textAnchor="end"
                fontSize="10"
                fill="#7a8880"
                fontWeight="600"
              >
                {tick}
              </text>
            </g>
          ))}

          <line
            x1={left}
            x2={width - right}
            y1={yAt(average)}
            y2={yAt(average)}
            stroke="#b58d23"
            strokeDasharray="5 4"
            strokeWidth="1.3"
          />

          {data.length > 1 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="#0f684a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {data.map((entry, index) => (
            <g key={entry.label}>
              <circle
                cx={xAt(index)}
                cy={yAt(entry.points)}
                r="5.5"
                fill={entry.points < 0 ? "#c75c51" : "#0f684a"}
                stroke="white"
                strokeWidth="2"
              >
                <title>
                  {entry.label}: {entry.points} puntos
                </title>
              </circle>
              <text
                x={xAt(index)}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#557368"
              >
                {entry.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-zinc-500">
        <span className="h-0 w-6 border-t-2 border-dashed border-[#b58d23]" />
        Media de las jornadas mostradas
      </div>
      {data.length === 10 && (
        <p className="mt-2 text-[10px] leading-4 text-zinc-400">
          La gráfica muestra las últimas 10 jornadas puntuadas.
          Debajo puedes consultar el histórico completo.
        </p>
      )}
    </section>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl bg-[#f1f5f2] px-2 py-3 text-center">
      <p className="text-lg font-black tabular-nums text-[#0f3d2e]">
        {value}
      </p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-wide text-[#557368]">
        {label}
      </p>
    </div>
  );
}
