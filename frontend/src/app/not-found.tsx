"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const returnHref = isAuthenticated ? "/dashboard" : "/";

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="w-full max-w-xl text-center p-10 rounded-2xl border border-slate-200 bg-white shadow-xl animate-slide-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-2xl font-bold">
          404
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Page not found</h1>
        <p className="text-slate-600 mb-8">
          The page you are looking for doesn&apos;t exist or was moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={returnHref}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Return to {isAuthenticated ? "Dashboard" : "Home"}
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
