"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const Contracts = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">Contracts</h1>
            <p className="text-slate-600 mb-8">
              View active contracts and track progress. This page will connect to live contract data.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
              <p className="text-slate-600 mb-6">No contracts to show yet.</p>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contracts;
