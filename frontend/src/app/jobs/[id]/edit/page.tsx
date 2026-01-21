"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Briefcase,
  Tag,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const categories = [
  { label: 'Web Development', value: 'WEB_DEVELOPMENT' },
  { label: 'Mobile Development', value: 'MOBILE_DEVELOPMENT' },
  { label: 'Design', value: 'DESIGN' },
  { label: 'Writing', value: 'WRITING' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Data Analytics', value: 'DATA_ANALYTICS' },
  { label: 'Consulting', value: 'CONSULTING' },
  { label: 'Other', value: 'OTHER' },
];

const jobSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requiredSkills: z.string().min(2, 'Required skills are required').max(500, 'Required skills are too long'),
  timeline: z.string().min(2, 'Timeline is required').max(200, 'Timeline is too long'),
  category: z.string().min(1, 'Please select a category'),
  budget: z.number().min(1, 'Please enter a valid budget'),
});

type JobFormData = z.infer<typeof jobSchema>;

const EditJob: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      requiredSkills: '',
      timeline: '',
      category: '',
      budget: undefined,
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills || '',
        timeline: job.timeline || '',
        category: job.category,
        budget: job.budget ?? undefined,
      });
    }
  }, [job, reset]);

  const updateJobMutation = useMutation({
    mutationFn: (data: JobFormData) => jobsApi.update(id!, data),
    onSuccess: (updated) => {
      toast.success('Job updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      router.push(`/jobs/${updated.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update job');
    },
  });

  const onSubmit = (data: JobFormData) => {
    setError(null);
    updateJobMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-64" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">This job may have been removed.</p>
            <Button onClick={() => router.push('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === job.clientId;

  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You can only edit your own jobs.</p>
            <Button onClick={() => router.push('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (job.status !== 'DRAFT' && (job.proposalCount || 0) > 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Editing Locked</h2>
            <p className="text-gray-600 mb-4">
              This job already has proposals, so it can no longer be edited.
            </p>
            <Button onClick={() => router.push(`/jobs/${job.id}`)}>Back to Job</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-8">
              <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job</h1>
              <p className="text-gray-600">Update your job details before publishing</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Job Title
                  </CardTitle>
                  <CardDescription>Write a clear and descriptive title for your job</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., Senior React Developer for E-commerce Platform"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Job Description
                  </CardTitle>
                  <CardDescription>Provide detailed information about the project</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe your project in detail..."
                    rows={8}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-indigo-600" />
                    Required Skills
                  </CardTitle>
                  <CardDescription>List the key skills needed (comma separated)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="e.g., React, TypeScript, Node.js"
                    rows={3}
                    {...register('requiredSkills')}
                  />
                  {errors.requiredSkills && (
                    <p className="text-sm text-red-500 mt-1">{errors.requiredSkills.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Timeline
                  </CardTitle>
                  <CardDescription>When do you expect this job to be completed?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., 2 weeks, by end of March"
                    {...register('timeline')}
                  />
                  {errors.timeline && (
                    <p className="text-sm text-red-500 mt-1">{errors.timeline.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-indigo-600" />
                    Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    {...register('category')}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      type="number"
                      placeholder="Estimated budget in Br"
                      {...register('budget', {
                        setValueAs: (value) => (value === '' ? undefined : Number(value)),
                      })}
                    />
                    {errors.budget && (
                      <p className="text-sm text-red-500">{errors.budget.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={updateJobMutation.isPending}
                >
                  {updateJobMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default EditJob;
