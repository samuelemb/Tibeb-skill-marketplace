"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Bell,
  FileText,
  MessageSquare,
  CheckCircle,
  Briefcase,
  CheckCheck,
} from 'lucide-react';
import { notificationsApi, proposalsApi } from '@/lib/api';
import type { Notification, NotificationType } from '@/types';

const Notifications: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', offset],
    queryFn: () => notificationsApi.getPage({ limit, offset }),
  });
  const notifications = data?.data || [];
  const pagination = data?.pagination;

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const hasMarkedAllRef = useRef(false);

  useEffect(() => {
    if (!notifications || hasMarkedAllRef.current) {
      return;
    }

    const hasUnread = notifications.some((notification) => !notification.isRead);
    if (hasUnread && !markAllAsReadMutation.isPending) {
      hasMarkedAllRef.current = true;
      markAllAsReadMutation.mutate();
    }
  }, [notifications, markAllAsReadMutation]);

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
      PROPOSAL_RECEIVED: {
        icon: <FileText className="h-5 w-5 text-indigo-600" />,
        bg: 'bg-indigo-100'
      },
      OFFER_SENT: {
        icon: <FileText className="h-5 w-5 text-blue-600" />,
        bg: 'bg-blue-100'
      },
      OFFER_ACCEPTED: {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        bg: 'bg-green-100'
      },
      OFFER_REJECTED: {
        icon: <FileText className="h-5 w-5 text-red-600" />,
        bg: 'bg-red-100'
      },
      NEW_MESSAGE: {
        icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
        bg: 'bg-blue-100'
      },
      proposal: {
        icon: <FileText className="h-5 w-5 text-indigo-600" />,
        bg: 'bg-indigo-100'
      },
      proposal_accepted: {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        bg: 'bg-green-100'
      },
      proposal_rejected: {
        icon: <FileText className="h-5 w-5 text-red-600" />,
        bg: 'bg-red-100'
      },
      proposal_offered: {
        icon: <FileText className="h-5 w-5 text-blue-600" />,
        bg: 'bg-blue-100'
      },
      message: {
        icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
        bg: 'bg-blue-100'
      },
      job_status_change: {
        icon: <Briefcase className="h-5 w-5 text-green-600" />,
        bg: 'bg-green-100'
      },
    };
    return icons[type] || { icon: <Bell className="h-5 w-5 text-gray-600" />, bg: 'bg-gray-100' };
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.link) {
      if (notification.link.startsWith('/proposals/')) {
        const proposalId = notification.link.split('/').pop();
        if (proposalId) {
          try {
            const proposal = await proposalsApi.getById(proposalId);
            router.push(`/jobs/${proposal.jobId}`);
            return;
          } catch (error) {
            router.push('/proposals');
            return;
          }
        }
      }
      router.push(notification.link);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const canGoPrev = offset > 0;
  const canGoNext = pagination ? pagination.offset + pagination.limit < pagination.total : false;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const { icon, bg } = getNotificationIcon(notification.type);
                return (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.isRead ? 'bg-indigo-50/50 border-indigo-200' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${bg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-indigo-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pagination && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={!canGoPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setOffset(offset + limit)}
                    disabled={!canGoNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                You're all caught up! We'll notify you when something happens.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Notifications;
