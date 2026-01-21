"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
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
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
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

const PostJob: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const createJobMutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (job) => {
      toast.success('Draft saved successfully!');
      router.push(`/jobs/${job.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create job');
    },
  });

  const onSubmit = (data: JobFormData) => {
    setError(null);
    createJobMutation.mutate({
      ...data,
    });
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Job Draft</h1>
            <p className="text-gray-600">
              Save your job as a draft, then publish it when you're ready
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Job Title
                </CardTitle>
                <CardDescription>
                  Write a clear and descriptive title for your job
                </CardDescription>
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

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Job Description
                </CardTitle>
                <CardDescription>
                  Provide detailed information about the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your project in detail. Include requirements, deliverables, and any specific qualifications needed..."
                  rows={8}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Required Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-600" />
                  Required Skills
                </CardTitle>
                <CardDescription>
                  List the key skills needed for this job (comma separated)
                </CardDescription>
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

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Timeline
                </CardTitle>
                <CardDescription>
                  When do you expect this job to be completed?
                </CardDescription>
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

            {/* Category */}
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

            {/* Budget */}
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

            {/* Submit */}
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
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Draft
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

export default PostJob;
