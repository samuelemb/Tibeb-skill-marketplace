"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage: React.FC = () => (
  <ProtectedRoute>
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Update your preferences and account settings here. More options will be added soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  </ProtectedRoute>
);

export default SettingsPage;
