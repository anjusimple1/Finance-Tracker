import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

const COMPACT = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function ExpenseCategoryBarChart({ items }) {
  const { labels, values } = useMemo(() => {
    const map = new Map();
    for (const t of items) {
      if (t.type !== 'expense') continue;
      const k = t.category?.trim() || 'Other';
      map.set(k, (map.get(k) || 0) + Number(t.amount));
    }
    const pairs = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top = pairs.slice(0, 8);
    if (pairs.length > 8) {
      const rest = pairs.slice(8).reduce((s, [, v]) => s + v, 0);
      if (rest > 0) top.push(['Other', rest]);
    }
    return {
      labels: top.map(([label]) => label),
      values: top.map(([, v]) => v),
    };
  }, [items]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Spent',
          data: values,
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderColor: 'rgb(225, 29, 72)',
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 22,
        },
      ],
    }),
    [labels, values]
  );

  const options = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: {
            callback: (value) => COMPACT.format(Number(value)),
          },
        },
        y: {
          grid: { display: false },
          ticks: { autoSkip: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              return COMPACT.format(Number(ctx.raw));
            },
          },
        },
      },
    }),
    []
  );

  if (!labels.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-sm text-slate-500">
        No expense categories yet. Log expenses to see a breakdown.
      </div>
    );
  }

  return (
    <div className="relative h-[240px] w-full sm:h-[280px]">
      <Bar data={data} options={options} />
    </div>
  );
}
