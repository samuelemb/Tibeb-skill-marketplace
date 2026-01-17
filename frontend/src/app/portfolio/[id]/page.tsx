"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { portfolioApi } from '@/lib/api';

const PortfolioItemPage: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];

  const { data: item, isLoading } = useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfolioApi.getById(id!),
    enabled: !!id,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : item ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {item.user?.firstName} {item.user?.lastName}
                    </p>
                  </div>
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm"
                    >
                      Visit Project <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{item.description}</p>
                {item.technologies && (
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.split(',').map((tech) => (
                      <Badge key={tech.trim()} variant="secondary">
                        {tech.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-600">
                Portfolio item not found.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PortfolioItemPage;
