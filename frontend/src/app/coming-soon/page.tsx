"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const titleMap: Record<string, string> = {
  projects: "Project Catalog",
  enterprise: "Enterprise",
  payroll: "Payroll Services",
  resources: "Career Resources",
  community: "Community",
  stories: "Success Stories",
  blog: "Blog",
  affiliate: "Affiliate Program",
  careers: "Careers",
  press: "Press",
  contact: "Contact Us",
};

type ComingSoonProps = {
  searchParams?: {
    from?: string;
  };
};

const ComingSoon = ({ searchParams }: ComingSoonProps) => {
  const fromKey = searchParams?.from || "";
  const title = titleMap[fromKey] || "This page";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xl font-semibold">
              CS
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">
              {title} is coming soon
            </h1>
            <p className="text-slate-600 mb-8">
              We are building this feature and will launch it in a future update.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComingSoon;
