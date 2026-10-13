import Link from 'next/link';
import { Home, FolderX } from 'lucide-react';

export default function BuilderNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
          <FolderX className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-800">Resource Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested project inventory, lead details, or settings page does not exist or has been removed.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/builder-dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Home className="w-3.5 h-3.5" /> Return to Builder Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
