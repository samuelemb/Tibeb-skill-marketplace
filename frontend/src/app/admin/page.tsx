"use client";

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function adminRequest(path: string, method = 'POST', body?: Record<string, unknown>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tibeb_token') : null;
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

const AdminPage = () => {
  const [userId, setUserId] = useState('');
  const [jobId, setJobId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [escrowJobId, setEscrowJobId] = useState('');
  const [reason, setReason] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const response = await adminRequest('/admin/reports?status=OPEN', 'GET');
      setReports(response.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="text-slate-600">Moderation and escrow resolution tools.</p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Reason (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a reason for the action..."
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="users" className="space-y-6">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="proposals">Proposals</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="escrow">Escrow</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Moderation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="User ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/users/${userId}/suspend`, 'PATCH', { reason }),
                            'User suspended'
                          )
                        }
                        disabled={!userId}
                      >
                        Suspend
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/users/${userId}/unsuspend`, 'PATCH', { reason }),
                            'User unsuspended'
                          )
                        }
                        disabled={!userId}
                      >
                        Unsuspend
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Moderation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Job ID"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/jobs/${jobId}/hide`, 'PATCH', { reason }),
                            'Job hidden'
                          )
                        }
                        disabled={!jobId}
                      >
                        Hide
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/jobs/${jobId}/unhide`, 'PATCH', { reason }),
                            'Job unhidden'
                          )
                        }
                        disabled={!jobId}
                      >
                        Unhide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="proposals">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Moderation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Proposal ID"
                      value={proposalId}
                      onChange={(e) => setProposalId(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/proposals/${proposalId}/hide`, 'PATCH', { reason }),
                            'Proposal hidden'
                          )
                        }
                        disabled={!proposalId}
                      >
                        Hide
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/proposals/${proposalId}/unhide`, 'PATCH', { reason }),
                            'Proposal unhidden'
                          )
                        }
                        disabled={!proposalId}
                      >
                        Unhide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Moderation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Review ID"
                      value={reviewId}
                      onChange={(e) => setReviewId(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/reviews/${reviewId}/hide`, 'PATCH', { reason }),
                            'Review hidden'
                          )
                        }
                        disabled={!reviewId}
                      >
                        Hide
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/reviews/${reviewId}/unhide`, 'PATCH', { reason }),
                            'Review unhidden'
                          )
                        }
                        disabled={!reviewId}
                      >
                        Unhide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="escrow">
                <Card>
                  <CardHeader>
                    <CardTitle>Escrow Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Job ID"
                      value={escrowJobId}
                      onChange={(e) => setEscrowJobId(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/escrow/${escrowJobId}/hold`, 'POST', { reason }),
                            'Escrow held'
                          )
                        }
                        disabled={!escrowJobId}
                      >
                        Hold
                      </Button>
                      <Button
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/escrow/${escrowJobId}/release`, 'POST', { reason }),
                            'Escrow released'
                          )
                        }
                        disabled={!escrowJobId}
                      >
                        Release
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/escrow/${escrowJobId}/refund`, 'POST', { reason }),
                            'Escrow refunded'
                          )
                        }
                        disabled={!escrowJobId}
                      >
                        Refund
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAction(
                            () => adminRequest(`/admin/escrow/${escrowJobId}/reject`, 'POST', { reason }),
                            'Dispute rejected'
                          )
                        }
                        disabled={!escrowJobId}
                      >
                        Reject Dispute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={loadReports} disabled={reportsLoading}>
                      {reportsLoading ? 'Loading...' : 'Load Open Reports'}
                    </Button>
                    {reports.length === 0 ? (
                      <p className="text-sm text-slate-600">No open reports.</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((report) => (
                          <div key={report.id} className="border rounded-lg p-3 space-y-2">
                            <div className="text-sm text-slate-600">
                              <div><span className="font-medium text-slate-800">Report ID:</span> {report.id}</div>
                              <div><span className="font-medium text-slate-800">Job ID:</span> {report.jobId}</div>
                              <div><span className="font-medium text-slate-800">Reporter:</span> {report.reporter?.firstName} {report.reporter?.lastName}</div>
                              {report.reason && (
                                <div><span className="font-medium text-slate-800">Reason:</span> {report.reason}</div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAction(
                                    () => adminRequest(`/admin/reports/${report.id}`, 'PATCH', { status: 'RESOLVED', reason }),
                                    'Report resolved'
                                  )
                                }
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAction(
                                    () => adminRequest(`/admin/reports/${report.id}`, 'PATCH', { status: 'REJECTED', reason }),
                                    'Report rejected'
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
