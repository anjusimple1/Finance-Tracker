import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function IncomeExpenseDoughnut({ income, expense }) {
  const hasFlow = income > 0 || expense > 0;

  const data = useMemo(
    () => ({
      labels: ['Income', 'Expenses'],
      datasets: [
        {
          data: [Math.max(income, 0), Math.max(expense, 0)],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(244, 63, 94, 0.85)',
          ],
          borderColor: ['rgb(5, 150, 105)', 'rgb(225, 29, 72)'],
          borderWidth: 1,
          hoverOffset: 6,
        },
      ],
    }),
    [income, expense]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 18,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const v = context.parsed;
              const total = income + expense || 1;
              const pct = ((v / total) * 100).toFixed(1);
              return `${context.label}: ${money.format(v)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '66%',
    }),
    [income, expense]
  );

  if (!hasFlow) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-sm text-slate-500">
        Add income or expenses to see how they compare.
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[280px] sm:h-[260px] sm:max-w-none">
      <Doughnut data={data} options={options} />
    </div>
  );
}
