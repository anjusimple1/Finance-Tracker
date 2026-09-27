import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Personal Finance Tracker</h1>
      <p className="mt-3 text-slate-600 max-w-xl">
        Track income and expenses, see your balance at a glance, and manage transactions in one
        clean dashboard.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Sign in
            </Link>
          </>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-semibold text-slate-900">Income &amp; expenses</p>
          <p className="mt-1 text-sm text-slate-600">Log transactions with category and date.</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-semibold text-slate-900">Totals</p>
          <p className="mt-1 text-sm text-slate-600">See income, spending, and net balance.</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="font-semibold text-slate-900">Edit anytime</p>
          <p className="mt-1 text-sm text-slate-600">Update or remove entries from your list.</p>
        </div>
      </div>
    </div>
  );
}
