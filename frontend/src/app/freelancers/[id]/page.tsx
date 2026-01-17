"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { portfolioApi, reviewsApi, usersApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import { Star } from 'lucide-react';

const FreelancerProfile: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['publicProfile', id],
    queryFn: () => usersApi.getPublicProfile(id!),
    enabled: !!id,
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', 'public', id],
    queryFn: () => portfolioApi.getByUser(id!),
    enabled: !!id,
  });

  const { data: reviewAverage } = useQuery({
    queryKey: ['publicReviewAverage', id],
    queryFn: () => reviewsApi.getAverage(id!),
    enabled: !!id,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <Card>
            <CardContent className="p-6">
              {profileLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ) : profile ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getMediaUrl(profile.avatarUrl)} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                      {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-sm text-gray-500 capitalize">{profile.role?.toLowerCase()}</p>
                    {reviewAverage && reviewAverage.totalReviews > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {reviewAverage.averageRating.toFixed(1)} ({reviewAverage.totalReviews} reviews)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Profile not found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolioLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : portfolio && portfolio.length > 0 ? (
                portfolio.map((item) => (
                  <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {item.projectUrl && (
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Visit project
                      </a>
                    )}
                    <div className="mt-2">
                      <a href={`/portfolio/${item.id}`} className="text-sm text-gray-700 hover:underline">
                        Public portfolio view
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No portfolio items yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreelancerProfile;
