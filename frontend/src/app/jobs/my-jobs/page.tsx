"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Briefcase,
  Plus,
  Clock,
  DollarSign,
  FileText,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import type { Job } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

const MyJobs: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['myJobs', user?.id],
    queryFn: () => jobsApi.getMyJobs(user?.id || '', 1, 50),
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      OPEN: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <PlayCircle className="h-3 w-3 mr-1" />
      },
      IN_PROGRESS: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      COMPLETED: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      DRAFT: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      CONTRACTED: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
    };
    const style = styles[status] || styles.OPEN;
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center`}>
        {style.icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const filterJobs = (status: string) => {
    if (!jobsData?.data) return [];
    if (status === 'all') return jobsData.data;

    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      open: 'OPEN',
      in_progress: 'IN_PROGRESS',
      completed: 'COMPLETED',
    };

    return jobsData.data.filter(j => j.status === statusMap[status]);
  };

  const filteredJobs = filterJobs(activeTab);

  const counts = {
    all: jobsData?.data?.length || 0,
    draft: jobsData?.data?.filter(j => j.status === 'DRAFT').length || 0,
    open: jobsData?.data?.filter(j => j.status === 'OPEN').length || 0,
    in_progress: jobsData?.data?.filter(j => j.status === 'IN_PROGRESS').length || 0,
    completed: jobsData?.data?.filter(j => j.status === 'COMPLETED').length || 0,
  };

  const deleteMutation = useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: jobsApi.publish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  const handleDelete = (jobId: string) => {
    if (deleteMutation.isPending) {
      return;
    }
    const selected = jobsData?.data?.find((item) => item.id === jobId) || null;
    setJobToDelete(selected);
  };

  const JobCard = ({ job }: { job: Job }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 
              className="font-semibold text-lg text-gray-900 hover:text-indigo-600 cursor-pointer mb-1"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              {job.title}
            </h3>
            <p className="text-sm text-gray-500">{job.category}</p>
          </div>
          {getStatusBadge(job.status)}
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-gray-50 text-xs">
            {job.category}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
          {job.budget !== null && job.budget !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Br {job.budget.toLocaleString()}</span>
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/jobs/${job.id}`)}
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          {(job.status === 'DRAFT' || (job.proposalCount || 0) === 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/jobs/${job.id}/edit`)}
            >
              Edit
            </Button>
          )}
          {job.status === 'DRAFT' && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate(job.id)}
              disabled={publishMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Publish
            </Button>
          )}
          {job.status === 'OPEN' && (job.proposalCount || 0) > 0 && (
            <Button
              size="sm"
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Users className="h-4 w-4 mr-1" />
              Review Proposals
            </Button>
          )}
          {job.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
            onClick={() => router.push(`/messages/${job.id}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Message Freelancer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(job.id)}
            disabled={deleteMutation.isPending || publishMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
              <p className="text-gray-600">
                Manage your posted jobs and review proposals
              </p>
            </div>
            <Button onClick={() => router.push('/jobs/post')} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({counts.draft})
              </TabsTrigger>
              <TabsTrigger value="open">
                Open ({counts.open})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({counts.in_progress})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({counts.completed})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/4 mb-4" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {activeTab === 'all' ? 'No jobs yet' : `No ${activeTab.replace('_', ' ')} jobs`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'all' 
                      ? 'Post your first job to start receiving proposals from talented freelancers'
                      : `You don't have any ${activeTab.replace('_', ' ')} jobs at the moment`
                    }
                  </p>
                  <Button onClick={() => router.push('/jobs/post')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      </div>
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{jobToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!jobToDelete || deleteMutation.isPending) return;
                deleteMutation.mutate(jobToDelete.id, {
                  onSettled: () => setJobToDelete(null),
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
};

export default MyJobs;
