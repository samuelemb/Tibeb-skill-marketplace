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
import {
  Briefcase,
  Plus,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { jobsApi, messagesApi } from '@/lib/api';

const ClientDashboard: React.FC = () => {
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

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['myJobs', user?.id],
    queryFn: () => jobsApi.getMyJobs(user?.id || '', 1, 5),
    enabled: !!user?.id,
  });

  const { data: conversations, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => messagesApi.getConversations(user?.id || ''),
    enabled: !!user?.id,
  });

  const stats = [
    {
      label: 'Active Jobs',
      value:
        jobsData?.data.filter(j =>
          ['OPEN', 'IN_PROGRESS', 'CONTRACTED'].includes(j.status)
        ).length || 0,
      icon: Briefcase,
      color: 'bg-indigo-100 text-indigo-600'
    },
    { 
      label: 'Total Proposals', 
      value: jobsData?.data.reduce((acc, job) => acc + (job.proposalCount || 0), 0) || 0, 
      icon: FileText, 
      color: 'bg-orange-100 text-orange-600' 
    },
    {
      label: 'Completed',
      value: jobsData?.data.filter(j => j.status === 'COMPLETED').length || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    { 
      label: 'Unread Messages', 
      value: conversations?.reduce((acc, c) => acc + c.unreadCount, 0) || 0, 
      icon: MessageSquare, 
      color: 'bg-blue-100 text-blue-600' 
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      DRAFT: 'bg-gray-100 text-gray-700',
      CONTRACTED: 'bg-orange-100 text-orange-700',
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

  const formatStatus = (status?: string) => {
    return status ? status.replace(/_/g, ' ') : '';
  };

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
              Manage your jobs and connect with talented freelancers.
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
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Your Jobs</CardTitle>
                  <Button onClick={() => router.push('/jobs/post')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
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
                  ) : jobsData?.data && jobsData.data.length > 0 ? (
                    <div className="space-y-4">
                      {jobsData.data.map((job) => (
                        <div
                          key={job.id}
                          className="p-4 border rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 hover:text-indigo-600">
                              {job.title}
                            </h3>
                            <Badge className={getStatusBadge(job.status)}>
                              {formatStatus(job.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {job.budget !== null && job.budget !== undefined && (
                              <span className="flex items-center gap-1">
                                Br {job.budget.toLocaleString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {job.proposalCount || 0} proposals
                            </span>
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
                      <Button
                        variant="ghost"
                        className="w-full text-indigo-600"
                        onClick={() => router.push('/jobs/my-jobs')}
                      >
                        View All Jobs
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                      <p className="text-gray-600 mb-4">
                        Post your first job to start receiving proposals from talented freelancers.
                      </p>
                      <Button onClick={() => router.push('/jobs/post')} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Job
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Messages</CardTitle>
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
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
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
                            <Badge className="bg-indigo-600">{conv.unreadCount}</Badge>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-full text-indigo-600"
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
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/jobs/post')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a New Job
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/jobs')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Browse Freelancers
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/profile')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
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

export default ClientDashboard;
