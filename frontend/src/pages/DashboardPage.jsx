import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DailyCashflowLineChart from '../components/charts/DailyCashflowLineChart';
import ExpenseCategoryBarChart from '../components/charts/ExpenseCategoryBarChart';
import IncomeExpenseDoughnut from '../components/charts/IncomeExpenseDoughnut';
import Spinner from '../components/Spinner';
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from '../services/transactionService';

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function computeTotals(list) {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    const n = Number(t.amount);
    if (t.type === 'income') income += n;
    else expense += n;
  }
  return { income, expense, balance: income - expense };
}

const emptyAddForm = () => ({
  type: 'expense',
  amount: '',
  category: '',
  date: toInputDate(new Date().toISOString()),
});

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async (options = {}) => {
    const notifyRefresh = options.notify === true;
    setListError('');
    setLoading(true);
    try {
      const res = await fetchTransactions();
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
        if (notifyRefresh) {
          toast.success('Transactions refreshed');
        }
      } else {
        const msg = res.message || 'Could not load transactions.';
        setListError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load transactions.';
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => computeTotals(items), [items]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    const amount = Number(addForm.amount);
    if (addForm.amount === '' || Number.isNaN(amount) || amount < 0) {
      const msg = 'Enter a valid amount (0 or more).';
      setAddError(msg);
      toast.error(msg);
      return;
    }
    if (!addForm.category.trim()) {
      const msg = 'Category is required.';
      setAddError(msg);
      toast.error(msg);
      return;
    }
    setAdding(true);
    try {
      const res = await createTransaction({
        amount,
        type: addForm.type,
        category: addForm.category.trim(),
        date: addForm.date || undefined,
      });
      if (res.success && res.data) {
        setItems((prev) => [res.data, ...prev]);
        setAddForm(emptyAddForm());
        toast.success('Transaction added');
      } else {
        const msg = res.message || 'Could not add transaction.';
        setAddError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not add transaction.';
      setAddError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (row) => {
    setEditError('');
    setEditing(row);
    setEditForm({
      amount: String(row.amount),
      type: row.type,
      category: row.category,
      date: toInputDate(row.date),
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(null);
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing || !editForm) return;
    setEditError('');
    const amount = Number(editForm.amount);
    if (editForm.amount === '' || Number.isNaN(amount) || amount < 0) {
      const msg = 'Enter a valid amount (0 or more).';
      setEditError(msg);
      toast.error(msg);
      return;
    }
    if (!editForm.category.trim()) {
      const msg = 'Category is required.';
      setEditError(msg);
      toast.error(msg);
      return;
    }
    setSavingEdit(true);
    try {
      const res = await updateTransaction(editing.id, {
        amount,
        type: editForm.type,
        category: editForm.category.trim(),
        date: editForm.date,
      });
      if (res.success && res.data) {
        setItems((prev) => prev.map((t) => (t.id === res.data.id ? res.data : t)));
        closeEdit();
        toast.success('Transaction updated');
      } else {
        const msg = res.message || 'Could not update transaction.';
        setEditError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not update transaction.';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this ${row.type} — ${money.format(row.amount)}?`)) return;
    try {
      const res = await deleteTransaction(row.id);
      if (res.success) {
        setItems((prev) => prev.filter((t) => t.id !== row.id));
        toast.success('Transaction removed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Delete failed.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
          Overview of income, spending, and trends—optimized for desktop and mobile.
        </p>
      </header>

      <section aria-label="Summary" className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <p className="text-sm font-medium text-slate-500">Total income</p>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">
              {money.format(totals.income)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
              <p className="text-sm font-medium text-slate-500">Total expenses</p>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700 sm:text-3xl">
              {money.format(totals.expense)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-sm text-white sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden />
              <p className="text-sm font-medium text-slate-300">Balance</p>
            </div>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${
                totals.balance >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {money.format(totals.balance)}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Insights" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Insights</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Visual breakdown of how you earn, spend, and net over time.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900">Income vs expenses</h3>
            <p className="text-xs text-slate-500">Share of your recorded cash flow</p>
            <div className="mt-2">
              <IncomeExpenseDoughnut income={totals.income} expense={totals.expense} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900">Spending by category</h3>
            <p className="text-xs text-slate-500">Top expense categories (combines smaller ones)</p>
            <div className="mt-4">
              <ExpenseCategoryBarChart items={items} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900">Daily net cash flow</h3>
          <p className="text-xs text-slate-500">Income minus expenses per calendar day</p>
          <div className="mt-4">
            <DailyCashflowLineChart items={items} />
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add transaction</h2>
        <form className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end" onSubmit={handleAdd}>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-slate-600" htmlFor="add-type">
              Type
            </label>
            <select
              id="add-type"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={addForm.type}
              onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label className="block text-xs font-medium text-slate-600" htmlFor="add-amount">
              Amount
            </label>
            <input
              id="add-amount"
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={addForm.amount}
              onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="w-full min-w-[8rem] flex-1 sm:max-w-xs">
            <label className="block text-xs font-medium text-slate-600" htmlFor="add-category">
              Category
            </label>
            <input
              id="add-category"
              type="text"
              placeholder="e.g. Salary, Groceries"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-xs font-medium text-slate-600" htmlFor="add-date">
              Date
            </label>
            <input
              id="add-date"
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={addForm.date}
              onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {addError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {addError}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
          <button
            type="button"
            onClick={() => load({ notify: true })}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 sm:px-6">
            <Spinner className="h-9 w-9" />
            <p className="text-sm text-slate-500">Loading transactions…</p>
          </div>
        ) : listError ? (
          <p className="px-4 py-10 text-center text-red-600 sm:px-6" role="alert">
            {listError}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-slate-500 sm:px-6">
            No transactions yet. Add one above.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((row) => (
                <li key={row.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{row.category}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(row.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-right text-base font-semibold tabular-nums ${
                        row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {row.type === 'expense' ? '− ' : '+ '}
                      {money.format(Number(row.amount))}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.type === 'income'
                          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
                          : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/20'
                      }`}
                    >
                      {row.type}
                    </span>
                    <div className="ml-auto flex gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-rose-600 hover:text-rose-800"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-3 text-slate-700 tabular-nums">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-slate-900">{row.category}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.type === 'income'
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
                            : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/20'
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-medium tabular-nums ${
                        row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {row.type === 'expense' ? '− ' : '+ '}
                      {money.format(Number(row.amount))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        className="mr-3 text-emerald-600 font-medium hover:text-emerald-800"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-rose-600 font-medium hover:text-rose-800"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {editing && editForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-transparent"
            aria-label="Close dialog"
            onClick={closeEdit}
          />
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dialog-title"
          >
            <h3 id="edit-dialog-title" className="text-lg font-semibold text-slate-900">
              Edit transaction
            </h3>
            <form className="mt-4 space-y-4" onSubmit={handleSaveEdit}>
              {editError ? (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
                  {editError}
                </div>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="edit-type">
                  Type
                </label>
                <select
                  id="edit-type"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={editForm.type}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="edit-amount">
                  Amount
                </label>
                <input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="edit-category">
                  Category
                </label>
                <input
                  id="edit-category"
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600" htmlFor="edit-date">
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingEdit ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
