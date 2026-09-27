import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const SHORT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export default function DailyCashflowLineChart({ items }) {
  const { labels, nets } = useMemo(() => {
    const map = new Map();
    for (const t of items) {
      const key = dayKey(t.date);
      if (!key) continue;
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const b = map.get(key);
      const n = Number(t.amount);
      if (t.type === 'income') b.income += n;
      else b.expense += n;
    }
    const keys = [...map.keys()].sort();
    const nets = keys.map((k) => {
      const { income, expense } = map.get(k);
      return income - expense;
    });
    const labels = keys.map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return SHORT.format(new Date(y, m - 1, d));
    });
    return { labels, nets };
  }, [items]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Net (income − expenses)',
          data: nets,
          borderColor: 'rgb(13, 148, 136)',
          backgroundColor: 'rgba(13, 148, 136, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(13, 148, 136)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    }),
    [labels, nets]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 16 },
        },
      },
    }),
    []
  );

  if (!labels.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-sm text-slate-500">
        Cash flow appears once you add dated transactions.
      </div>
    );
  }

  return (
    <div className="relative h-[220px] w-full sm:h-[260px]">
      <Line data={data} options={options} />
    </div>
  );
}
