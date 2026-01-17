"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const clientSteps = [
  {
    title: "Post a job",
    detail: "Create a draft with your budget, category, and requirements.",
  },
  {
    title: "Publish and receive proposals",
    detail: "Publish the job to make it visible to freelancers.",
  },
  {
    title: "Send an offer",
    detail: "Review proposals and send an offer to the best fit.",
  },
  {
    title: "Start work",
    detail: "Fund escrow and move the job to In Progress.",
  },
  {
    title: "Complete and review",
    detail: "Mark the job complete and leave a review.",
  },
];

const freelancerSteps = [
  {
    title: "Create your profile",
    detail: "Add your skills, portfolio, and profile details.",
  },
  {
    title: "Find open jobs",
    detail: "Browse and search jobs that match your skills.",
  },
  {
    title: "Submit a proposal",
    detail: "Pitch your approach and propose your rate.",
  },
  {
    title: "Accept an offer",
    detail: "Review the offer and confirm the contract.",
  },
  {
    title: "Deliver and get paid",
    detail: "Complete the work and receive payment to your wallet.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">How Tibeb works</h1>
            <p className="text-slate-600 mb-10">
              A simple workflow designed for clients and freelancers to collaborate with clarity.
            </p>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
                    For Clients
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">How to hire</h2>
                </div>
                {clientSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                        <p className="text-slate-600">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                    For Freelancers
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">How to find work</h2>
                </div>
                {freelancerSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                        <p className="text-slate-600">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
