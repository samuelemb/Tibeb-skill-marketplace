"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ClientDashboard from './ClientDashboard';
import FreelancerDashboard from './FreelancerDashboard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [isLoading, router, user?.role]);

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </main>
          <Footer />
        </div>
      ) : !user ? null : user.role === 'CLIENT' ? (
        <ClientDashboard />
      ) : user.role === 'ADMIN' ? null : (
        <FreelancerDashboard />
      )}
    </ProtectedRoute>
  );
};

export default Dashboard;
