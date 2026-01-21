"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Clock,
  Briefcase,
  Calendar,
  FileText,
  Send,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { jobsApi, proposalsApi, reviewsApi, paymentsApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

const proposalSchema = z.object({
  message: z
    .string()
    .min(50, 'Message must be at least 50 characters')
    .refine((value) => !/^\d+$/.test(value.trim()), 'Message cannot be only numbers'),
  relevantExperience: z.string().min(2, 'Relevant experience is required').max(500, 'Relevant experience is too long'),
  deliveryTime: z.string().min(2, 'Delivery time is required').max(200, 'Delivery time is too long'),
  proposedAmount: z.number().positive('Please enter a valid amount').optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;
type ReviewFormData = z.infer<typeof reviewSchema>;

const JobDetail: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
  });

  const { data: proposals } = useQuery({
    queryKey: ['jobProposals', id],
    queryFn: () => proposalsApi.getForJob(id!),
    enabled: !!id && user?.role === 'CLIENT',
  });

  const { data: escrow } = useQuery({
    queryKey: ['escrow', id],
    queryFn: () => paymentsApi.getEscrowStatus(id!),
    enabled: !!id && user?.id === job?.clientId,
  });

  const { data: myProposals } = useQuery({
    queryKey: ['myProposals', user?.id],
    queryFn: () => proposalsApi.getMyProposals(user?.id || ''),
    enabled: user?.role === 'FREELANCER' && !!user?.id,
  });

  const hasSubmittedProposal = myProposals?.some(p => p.jobId === id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  });

  const {
    register: registerReview,
    handleSubmit: handleSubmitReview,
    formState: { errors: reviewErrors },
    reset: resetReview,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const submitProposalMutation = useMutation({
    mutationFn: proposalsApi.create,
    onSuccess: () => {
      toast.success('Proposal submitted successfully!');
      setShowProposalDialog(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['myProposals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit proposal');
    },
  });

  const publishJobMutation = useMutation({
    mutationFn: jobsApi.publish,
    onSuccess: () => {
      toast.success('Job published');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish job');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => jobsApi.updateStatus(id!, status),
    onSuccess: () => {
      toast.success('Job status updated');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const fundEscrowMutation = useMutation({
    mutationFn: () => paymentsApi.initEscrow(id!),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start escrow payment');
    },
  });

  const refundEscrowMutation = useMutation({
    mutationFn: (reason: string) => paymentsApi.refundEscrow(id!, reason),
    onSuccess: () => {
      toast.success('Refund request submitted for admin review');
      setIsRefundDialogOpen(false);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to refund escrow');
    },
  });

  const disputeEscrowMutation = useMutation({
    mutationFn: (reason: string) => paymentsApi.disputeEscrow(id!, reason),
    onSuccess: () => {
      toast.success('Dispute submitted for admin review');
      setIsDisputeDialogOpen(false);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open dispute');
    },
  });

  const offerProposalMutation = useMutation({
    mutationFn: proposalsApi.offer,
    onSuccess: () => {
      toast.success('Offer sent!');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobProposals', id] });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: proposalsApi.reject,
    onSuccess: () => {
      toast.success('Proposal rejected');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobProposals', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject proposal');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => {
      toast.success('Review submitted');
      setReviewSubmitted(true);
      resetReview();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const reportJobMutation = useMutation({
    mutationFn: (reason: string) => jobsApi.report(id!, reason),
    onSuccess: () => {
      toast.success('Report submitted to admin');
      setIsReportDialogOpen(false);
      setReportReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit report');
    },
  });


  const onSubmitProposal = (data: ProposalFormData) => {
    if (!id) return;
    submitProposalMutation.mutate({
      jobId: id,
      message: data.message,
      relevantExperience: data.relevantExperience,
      deliveryTime: data.deliveryTime,
      proposedAmount: data.proposedAmount,
    });
  };


  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      OPEN: { bg: 'bg-green-100', text: 'text-green-700' },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-700' },
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
      CONTRACTED: { bg: 'bg-orange-100', text: 'text-orange-700' },
    };
    const style = styles[status] || styles.OPEN;
    return <Badge className={`${style.bg} ${style.text}`}>{status.replace('_', ' ')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full mb-6" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div>
                <Skeleton className="h-48 w-full" />
              </div>
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
            <p className="text-gray-600 mb-4">This job may have been removed or doesn't exist.</p>
            <Button onClick={() => router.push('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === job?.clientId;
  const contractFreelancerId = job?.contract?.freelancerId || job?.contract?.freelancer?.id;
  const isFreelancerOnJob = user?.id && contractFreelancerId ? user.id === contractFreelancerId : false;
  const revieweeId =
    user?.role === 'CLIENT'
      ? contractFreelancerId
      : user?.role === 'FREELANCER'
        ? job?.clientId
        : undefined;
  const canReview =
    job?.status === 'COMPLETED' && (isOwner || isFreelancerOnJob) && !!revieweeId;
  const escrowPaid = escrow?.status === 'PAID';
  const canRefundEscrow = isOwner && job?.status === 'CONTRACTED' && escrowPaid;
  const canDisputeEscrow = escrowPaid && (isOwner || isFreelancerOnJob);

  const onSubmitReview = (data: ReviewFormData) => {
    if (!id || !revieweeId) return;
    createReviewMutation.mutate({
      jobId: id,
      revieweeId,
      rating: data.rating,
      comment: data.comment ?? "",
    });
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
  if (job.status === 'DRAFT' && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Published</h2>
            <p className="text-gray-600 mb-4">This job is still a draft and is not visible yet.</p>
            <Button onClick={() => router.push('/jobs')}>Browse Jobs</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Job Header */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(job.status)}
                  <Badge variant="outline">{formatCategory(job.category)}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <p className="text-gray-600">
                  Posted by{' '}
                  {job.client?.id ? (
                    <Link
                      href={`/freelancers/${job.client.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {job.client?.firstName} {job.client?.lastName}
                    </Link>
                  ) : (
                    `${job.client?.firstName} ${job.client?.lastName}`
                  )}
                </p>
              </div>
              <div className="text-right">
                {job.budget !== null && job.budget !== undefined && (
                  <p className="text-3xl font-bold text-indigo-600">
                    Br {job.budget.toLocaleString()}
                  </p>
                )}
                {isOwner && (
                  <div className="mt-3 flex flex-col gap-2 items-end">
                    {(job.status === 'DRAFT' || (job.proposalCount || 0) === 0) && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/jobs/${job.id}/edit`)}
                      >
                        Edit Job
                      </Button>
                    )}
                    {job.status === 'DRAFT' && (
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => publishJobMutation.mutate(job.id)}
                        disabled={publishJobMutation.isPending}
                      >
                        {publishJobMutation.isPending ? 'Publishing...' : 'Publish Job'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {job.proposalCount || 0} proposals
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap break-words text-gray-700">{job.description}</p>
                  </div>
                  {(job.requiredSkills || job.timeline) && (
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      {job.requiredSkills && (
                        <p>
                          <span className="font-medium text-gray-700">Required skills:</span>{' '}
                          {job.requiredSkills}
                        </p>
                      )}
                      {job.timeline && (
                        <p>
                          <span className="font-medium text-gray-700">Timeline:</span> {job.timeline}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Proposals (for client) */}
              {isOwner && job.status !== 'DRAFT' && proposals && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proposals ({proposals.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {proposals.length > 0 ? (
                      <div className="space-y-4">
                        {proposals.map((proposal) => (
                          <div key={proposal.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={getMediaUrl(proposal.freelancer?.avatarUrl)} />
                                  <AvatarFallback>
                                    {proposal.freelancer?.firstName?.charAt(0)}
                                    {proposal.freelancer?.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link
                                    href={`/freelancers/${proposal.freelancerId}`}
                                    className="font-medium text-indigo-600 hover:underline"
                                  >
                                    {proposal.freelancer?.firstName} {proposal.freelancer?.lastName}
                                  </Link>
                                  {proposal.proposedAmount !== null && proposal.proposedAmount !== undefined && (
                                    <p className="text-sm text-gray-500">
                                      Br {proposal.proposedAmount}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge className={
                                proposal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                proposal.status === 'OFFERED' ? 'bg-blue-100 text-blue-700' :
                                proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {proposal.status}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-4">{proposal.message}</p>
                            {proposal.relevantExperience && (
                              <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium text-gray-700">Relevant experience:</span>{' '}
                                {proposal.relevantExperience}
                              </p>
                            )}
                            {proposal.deliveryTime && (
                              <p className="text-sm text-gray-600 mb-4">
                                <span className="font-medium text-gray-700">Delivery time:</span>{' '}
                                {proposal.deliveryTime}
                              </p>
                            )}
                            {proposal.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => offerProposalMutation.mutate(proposal.id)}
                                  disabled={offerProposalMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Send Offer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectProposalMutation.mutate(proposal.id)}
                                  disabled={rejectProposalMutation.isPending}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/messages/${job.id}?receiverId=${proposal.freelancerId}`)}
                                >
                                  Message
                                </Button>
                              </div>
                            )}
                            {proposal.status === 'ACCEPTED' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/messages/${job.id}?receiverId=${proposal.freelancerId}`)}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Message Freelancer
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No proposals yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {isOwner && job.status === 'DRAFT' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proposals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No proposals yet.</p>
                      <p className="text-sm text-gray-500">
                        Once you publish this job, freelancers will be able to apply.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {canReview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Leave a Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewSubmitted ? (
                      <Alert>
                        <AlertDescription>Thanks for your feedback! Your review has been submitted.</AlertDescription>
                      </Alert>
                    ) : (
                      <form onSubmit={handleSubmitReview(onSubmitReview)} className="space-y-4">
                        <div>
                          <Label htmlFor="rating">Rating (1-5)</Label>
                          <Input
                            id="rating"
                            type="number"
                            min={1}
                            max={5}
                            {...registerReview('rating', {
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                            })}
                          />
                          {reviewErrors.rating && (
                            <p className="text-sm text-red-500 mt-1">{reviewErrors.rating.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="comment">Comment (optional)</Label>
                          <Textarea
                            id="comment"
                            rows={4}
                            placeholder="Share your experience..."
                            {...registerReview('comment')}
                          />
                          {reviewErrors.comment && (
                            <p className="text-sm text-red-500 mt-1">{reviewErrors.comment.message}</p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={createReviewMutation.isPending}
                        >
                          {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {job.contract && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contract</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Status</span>
                      <span className="font-medium text-gray-900">
                        {job.contract.status || 'ACTIVE'}
                      </span>
                    </div>
                    {job.contract.agreedAmount !== null && job.contract.agreedAmount !== undefined && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Agreed Amount</span>
                        <span className="font-medium text-gray-900">
                          Br {job.contract.agreedAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {job.contract.freelancer && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Freelancer</span>
                        <Link
                          href={`/freelancers/${job.contract.freelancer.id}`}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {job.contract.freelancer.firstName} {job.contract.freelancer.lastName}
                        </Link>
                      </div>
                    )}
                    {escrow && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Escrow</span>
                        <span className="font-medium text-gray-900">{escrow.status}</span>
                      </div>
                    )}
                    {isOwner && job.status === 'CONTRACTED' && !escrowPaid && (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => fundEscrowMutation.mutate()}
                        disabled={fundEscrowMutation.isPending}
                      >
                        Fund Escrow
                      </Button>
                    )}
                    {canRefundEscrow && (
                      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                            Request Refund
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request a refund</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Label htmlFor="refundReason">Reason</Label>
                            <Textarea
                              id="refundReason"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              rows={4}
                              placeholder="Tell us why you need a refund..."
                            />
                            <Button
                              className="w-full bg-red-600 hover:bg-red-700"
                              onClick={() => refundEscrowMutation.mutate(refundReason)}
                              disabled={refundEscrowMutation.isPending}
                            >
                              {refundEscrowMutation.isPending ? 'Submitting...' : 'Submit Request'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {canDisputeEscrow && (
                      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            Open Dispute
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Open a dispute</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Label htmlFor="disputeReason">Reason</Label>
                            <Textarea
                              id="disputeReason"
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                              rows={4}
                              placeholder="Describe the issue..."
                            />
                            <Button
                              className="w-full bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => disputeEscrowMutation.mutate(disputeReason)}
                              disabled={disputeEscrowMutation.isPending}
                            >
                              {disputeEscrowMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {isOwner && job.status === 'CONTRACTED' && (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                        disabled={!escrowPaid || updateStatusMutation.isPending}
                      >
                        Mark In Progress
                      </Button>
                    )}
                    {isOwner && job.status === 'IN_PROGRESS' && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatusMutation.mutate('COMPLETED')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Apply Card */}
              {!isOwner && user?.role === 'FREELANCER' && job.status === 'OPEN' && (
                <Card>
                  <CardContent className="p-6">
                    {hasSubmittedProposal ? (
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Proposal Submitted</h3>
                        <p className="text-sm text-gray-600">
                          You've already submitted a proposal for this job.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900 mb-4">Interested in this job?</h3>
                        <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                              <Send className="h-4 w-4 mr-2" />
                              Submit Proposal
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Submit Your Proposal</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmitProposal)} className="space-y-4">
                              <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                  id="message"
                                  placeholder="Describe your approach, timeline, and relevant experience for this job."
                                  rows={5}
                                  {...register('message')}
                                />
                                {errors.message && (
                                  <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="relevantExperience">Relevant experience / skills</Label>
                                <Textarea
                                  id="relevantExperience"
                                  placeholder="Share relevant experience, past projects, or skills..."
                                  rows={3}
                                  {...register('relevantExperience')}
                                />
                                {errors.relevantExperience && (
                                  <p className="text-sm text-red-500 mt-1">{errors.relevantExperience.message}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="deliveryTime">Delivery time</Label>
                                <Input
                                  id="deliveryTime"
                                  placeholder="e.g., 2 weeks, 10 business days"
                                  {...register('deliveryTime')}
                                />
                                {errors.deliveryTime && (
                                  <p className="text-sm text-red-500 mt-1">{errors.deliveryTime.message}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="proposedAmount">Proposed Amount (Br)</Label>
                                <Input
                                  id="proposedAmount"
                                  type="number"
                                  placeholder="0"
                                  {...register('proposedAmount', {
                                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                                  })}
                                />
                                {errors.proposedAmount && (
                                  <p className="text-sm text-red-500 mt-1">{errors.proposedAmount.message}</p>
                                )}
                              </div>
                              <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                disabled={submitProposalMutation.isPending}
                              >
                                {submitProposalMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Proposal'
                                )}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-3">
                              Report Job
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Report this job</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="reportReason">Reason</Label>
                                <Textarea
                                  id="reportReason"
                                  rows={4}
                                  value={reportReason}
                                  onChange={(e) => setReportReason(e.target.value)}
                                  placeholder="Tell us why you are reporting this job..."
                                />
                              </div>
                              <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => reportJobMutation.mutate(reportReason)}
                                disabled={reportJobMutation.isPending || reportReason.trim().length < 10}
                              >
                                {reportJobMutation.isPending ? 'Submitting...' : 'Submit Report'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getMediaUrl(job.client?.avatarUrl)} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">
                        {job.client?.firstName?.charAt(0)}{job.client?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{job.client?.firstName} {job.client?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Member since {job.client?.createdAt ? new Date(job.client.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                  {job.client?.id && user?.id !== job.client.id && (
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => router.push(`/freelancers/${job.client?.id}`)}
                    >
                      View Profile
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Similar Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle>Similar Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    Browse more jobs in {formatCategory(job.category)}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/jobs?category=${encodeURIComponent(job.category)}`)}
                  >
                    View Similar Jobs
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

export default JobDetail;
