"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">About Tibeb</h1>
            <p className="text-slate-600 mb-6">
              Tibeb connects clients with trusted freelancers across Ethiopia. We focus on clear
              workflows, secure payments, and transparent collaboration.
            </p>
            <p className="text-slate-600">
              Our mission is to make it easy for businesses to hire great talent and for freelancers
              to grow their careers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
