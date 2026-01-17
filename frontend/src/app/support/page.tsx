"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">Help &amp; Support</h1>
            <p className="text-slate-600 mb-6">
              Need help? Reach out to our support team and we will respond as soon as possible.
            </p>
            <div className="space-y-2 text-slate-700">
              <p>Email: hello@tibeb.shop</p>
              <p>Phone: +251 963 474 290</p>
              <p>Hours: Mon - Fri, 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
