"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  FileText,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Award,
} from 'lucide-react';
import { jobsApi, proposalsApi, messagesApi, reviewsApi } from '@/lib/api';

const FreelancerDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const justRegistered = localStorage.getItem('tibeb_just_registered') === '1';
    if (justRegistered) {
      setShowWelcome(true);
      localStorage.setItem('tibeb_just_registered', '0');
    }
  }, []);

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['myProposals', user?.id],
    queryFn: () => proposalsApi.getMyProposals(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: conversations, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => messagesApi.getConversations(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['myReviews', user?.id],
    queryFn: () => reviewsApi.getForUser(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['recentJobs'],
    queryFn: () => jobsApi.getAll({ status: 'OPEN' }, 1, 5),
  });

  const pendingProposals = proposals?.filter(p => p.status === 'PENDING').length || 0;
  const acceptedProposals = proposals?.filter(p => p.status === 'ACCEPTED').length || 0;
  const averageRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const stats = [
    { 
      label: 'Pending Proposals', 
      value: pendingProposals, 
      icon: Clock, 
      color: 'bg-orange-100 text-orange-600' 
    },
    { 
      label: 'Active Projects', 
      value: acceptedProposals, 
      icon: Briefcase, 
      color: 'bg-indigo-100 text-indigo-600' 
    },
    { 
      label: 'Average Rating', 
      value: averageRating, 
      icon: Star, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      label: 'Unread Messages', 
      value: conversations?.reduce((acc, c) => acc + c.unreadCount, 0) || 0, 
      icon: MessageSquare, 
      color: 'bg-blue-100 text-blue-600' 
    },
  ];

  const getProposalStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      OFFERED: 'bg-blue-100 text-blue-700',
      ACCEPTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatCategory = (category?: string) => {
    const labels: Record<string, string> = {
      WEB_DEVELOPMENT: 'Web Development',
      MOBILE_DEVELOPMENT: 'Mobile Development',
      DESIGN: 'Design',
      WRITING: 'Writing',
      MARKETING: 'Marketing',
      DATA_ANALYTICS: 'Data Analytics',
      CONSULTING: 'Consulting',
      OTHER: 'Other',
    };
    return category ? labels[category] || category.replace(/_/g, ' ') : 'Other';
  };

  const profileFields = [
    user?.bio,
    user?.skills?.length,
    user?.avatarUrl,
    user?.location,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showWelcome ? 'Welcome' : 'Welcome back'}, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Find new opportunities and manage your freelance career.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Recommended Jobs</CardTitle>
                  <Button onClick={() => router.push('/jobs')} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Browse All Jobs
                  </Button>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentJobs?.data && recentJobs.data.length > 0 ? (
                    <div className="space-y-4">
                      {recentJobs.data.map((job) => (
                        <div
                          key={job.id}
                          className="p-4 border rounded-lg hover:border-orange-200 hover:bg-orange-50/30 transition-colors cursor-pointer"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 hover:text-orange-600">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {job.client?.firstName ? `${job.client.firstName} ${job.client.lastName}` : 'Client'}
                              </p>
                            </div>
                            <Badge variant="outline">{formatCategory(job.category)}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {job.budget !== null && job.budget !== undefined && (
                              <span className="flex items-center gap-1 font-medium text-orange-600">
                                Br {job.budget.toLocaleString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-gray-50">
                              {formatCategory(job.category)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                      <p className="text-gray-600">
                        Check back later for new opportunities.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Your Proposals</CardTitle>
                  <Button onClick={() => router.push('/proposals')} variant="ghost" className="text-orange-600">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {proposalsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : proposals && proposals.length > 0 ? (
                    <div className="space-y-3">
                      {proposals.slice(0, 5).map((proposal) => (
                        <div
                          key={proposal.id}
                          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/jobs/${proposal.jobId}`)}
                        >
                          <div className="h-12 w-12 rounded bg-orange-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {proposal.job?.title || 'Job'}
                            </p>
                            {proposal.proposedAmount !== null && proposal.proposedAmount !== undefined && (
                              <p className="text-sm text-gray-500">
                                Br {proposal.proposedAmount}
                              </p>
                            )}
                          </div>
                          <Badge className={getProposalStatusBadge(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 mb-3">No proposals yet</p>
                      <Button onClick={() => router.push('/jobs')} className="bg-orange-500 hover:bg-orange-600">
                        Find Jobs to Apply
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Profile Strength
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Completion</span>
                      <span className="text-sm font-medium">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>
                  {profileCompletion < 100 && (
                    <div className="space-y-2 text-sm">
                      {!user?.bio && (
                        <p className="text-gray-600">- Add a professional bio</p>
                      )}
                      {!user?.skills?.length && (
                        <p className="text-gray-600">- Add your skills</p>
                      )}
                      {!user?.avatarUrl && (
                        <p className="text-gray-600">- Upload a profile photo</p>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => router.push('/profile')}
                  >
                    Complete Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <div className="space-y-3">
                      {conversations.slice(0, 4).map((conv) => (
                        <div
                          key={conv.jobId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/messages/${conv.jobId}`)}
                        >
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {conv.otherUser.firstName.charAt(0)}{conv.otherUser.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {conv.otherUser.firstName} {conv.otherUser.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-orange-500">{conv.unreadCount}</Badge>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-full text-orange-600"
                        onClick={() => router.push('/messages')}
                      >
                        View All Messages
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No messages yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{reviews?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold text-green-600">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">On-time Delivery</span>
                    <span className="font-semibold text-green-600">98%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreelancerDashboard;
