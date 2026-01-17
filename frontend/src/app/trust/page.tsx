"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Trust = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">Trust &amp; Safety</h1>
            <p className="text-slate-600">
              This page outlines how Tibeb keeps the marketplace safe. Full policies will be added
              before launch.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trust;
