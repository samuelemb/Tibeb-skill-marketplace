"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { proposalsApi } from '@/lib/api';
import type { Proposal } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const MyProposals: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['myProposals', user?.id],
    queryFn: () => proposalsApi.getMyProposals(user?.id || ''),
    enabled: !!user?.id,
  });

  const withdrawMutation = useMutation({
    mutationFn: proposalsApi.withdraw,
    onSuccess: () => {
      toast.success('Proposal withdrawn');
      queryClient.invalidateQueries({ queryKey: ['myProposals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw proposal');
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: proposalsApi.accept,
    onSuccess: () => {
      toast.success('Offer accepted');
      queryClient.invalidateQueries({ queryKey: ['myProposals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept offer');
    },
  });

  const rejectOfferMutation = useMutation({
    mutationFn: proposalsApi.reject,
    onSuccess: () => {
      toast.success('Offer rejected');
      queryClient.invalidateQueries({ queryKey: ['myProposals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject offer');
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      PENDING: {
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      ACCEPTED: {
        bg: 'bg-green-100', 
        text: 'text-green-700',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      REJECTED: {
        bg: 'bg-red-100', 
        text: 'text-red-700',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      OFFERED: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
      WITHDRAWN: {
        bg: 'bg-gray-100', 
        text: 'text-gray-700',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
    };
    const style = styles[status] || styles.PENDING;
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterProposals = (status: string) => {
    if (!proposals) return [];
    if (status === 'all') return proposals;
    const statusMap: Record<string, string> = {
      pending: 'PENDING',
      offered: 'OFFERED',
      accepted: 'ACCEPTED',
      rejected: 'REJECTED',
    };
    return proposals.filter(p => p.status === statusMap[status]);
  };

  const filteredProposals = filterProposals(activeTab);

  const ProposalCard = ({ proposal }: { proposal: Proposal }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 
              className="font-semibold text-lg text-gray-900 hover:text-indigo-600 cursor-pointer mb-1"
              onClick={() => router.push(`/jobs/${proposal.jobId}`)}
            >
              {proposal.job?.title || 'Job'}
            </h3>
            <p className="text-sm text-gray-500">
              {proposal.job?.client?.firstName
                ? `${proposal.job.client.firstName} ${proposal.job.client.lastName}`
                : 'Client'}
            </p>
          </div>
          {getStatusBadge(proposal.status)}
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {proposal.message}
        </p>
        {proposal.relevantExperience && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
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

        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
          {proposal.proposedAmount !== null && proposal.proposedAmount !== undefined && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Br {proposal.proposedAmount}</span>
            </span>
          )}
          <span className="text-gray-400">
            Submitted {new Date(proposal.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/jobs/${proposal.jobId}`)}
          >
            View Job
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          {proposal.status === 'ACCEPTED' && (
            <Button
              size="sm"
            onClick={() => router.push(`/messages/${proposal.jobId}?receiverId=${proposal.job?.client?.id || ''}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Message Client
            </Button>
          )}
          {proposal.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => withdrawMutation.mutate(proposal.id)}
              disabled={withdrawMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          )}
          {proposal.status === 'OFFERED' && (
            <>
              <Button
                size="sm"
                onClick={() => acceptOfferMutation.mutate(proposal.id)}
                disabled={acceptOfferMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Offer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectOfferMutation.mutate(proposal.id)}
                disabled={rejectOfferMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject Offer
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const counts = {
    all: proposals?.length || 0,
    pending: proposals?.filter(p => p.status === 'PENDING').length || 0,
    offered: proposals?.filter(p => p.status === 'OFFERED').length || 0,
    accepted: proposals?.filter(p => p.status === 'ACCEPTED').length || 0,
    rejected: proposals?.filter(p => p.status === 'REJECTED').length || 0,
  };

  return (
    <ProtectedRoute allowedRoles={['FREELANCER']}>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proposals</h1>
            <p className="text-gray-600">
              Track and manage your job proposals
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="offered">
                Offered ({counts.offered})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({counts.accepted})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({counts.rejected})
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
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProposals.length > 0 ? (
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <ProposalCard key={proposal.id} proposal={proposal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {activeTab === 'all' ? 'No proposals yet' : `No ${activeTab} proposals`}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'all' 
                      ? 'Start applying to jobs to see your proposals here'
                      : `You don't have any ${activeTab} proposals at the moment`
                    }
                  </p>
                  <Button onClick={() => router.push('/jobs')} className="bg-indigo-600 hover:bg-indigo-700">
                    Browse Jobs
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default MyProposals;
