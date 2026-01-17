"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const ApiDocs = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const docsBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  const docsUrl = `${docsBase}/api-docs`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">API Documentation</h1>
            <p className="text-slate-600 mb-8">
              The full API reference is hosted by the backend Swagger UI. Open the docs to explore
              endpoints, schemas, and example requests.
            </p>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Open Swagger UI
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
