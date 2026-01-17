"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import PortfolioManager from '@/components/profile/PortfolioManager';

const PortfolioPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
                <p className="text-gray-600">Showcase your best work</p>
              </div>
            </div>
            <PortfolioManager />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default PortfolioPage;
