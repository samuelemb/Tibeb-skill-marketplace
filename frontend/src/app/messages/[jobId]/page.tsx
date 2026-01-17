"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  MessageSquare,
  Send,
  Search,
  ArrowLeft,
  Loader2,
  Clock,
} from 'lucide-react';
import { jobsApi, messagesApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message, User } from '@/types';

const Messages: React.FC = () => {
  const params = useParams<{ jobId?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = typeof params.jobId === 'string' ? params.jobId : params.jobId?.[0];
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const receiverIdParam = searchParams.get('receiverId') || undefined;

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => messagesApi.getConversations(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', jobId],
    queryFn: () => messagesApi.getMessages(jobId!),
    enabled: !!jobId,
  });

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getById(jobId!),
    enabled: !!jobId,
  });

  // Mark messages as read
  useEffect(() => {
    if (!jobId || !messages || !user?.id) {
      return;
    }

    const unreadMessages = messages.filter(
      (message) => message.receiverId === user.id && !message.isRead
    );

    if (unreadMessages.length === 0) {
      return;
    }

    Promise.all(unreadMessages.map((message) => messagesApi.markAsRead(message.id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    });
  }, [jobId, messages, queryClient, user?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !jobId) {
      return;
    }

    socket.emit('join:job', jobId);

    return () => {
      socket.emit('leave:job', jobId);
    };
  }, [jobId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?.id) {
      return;
    }

    const handleMessageNew = (payload: { message: Message }) => {
      const incoming = payload.message;
      if (!incoming.jobId) {
        return;
      }

      queryClient.setQueryData<Message[]>(['messages', incoming.jobId], (current) => {
        const list = current ? [...current] : [];
        if (list.some((message) => message.id === incoming.id)) {
          return list;
        }
        list.push(incoming);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      });

      queryClient.setQueryData<Conversation[]>(['conversations', user.id], (current) => {
        const list = current ? [...current] : [];
        const otherUser =
          incoming.senderId === user.id ? incoming.receiver : incoming.sender;

        if (!otherUser) {
          return list;
        }

        const unreadDelta = incoming.receiverId === user.id && !incoming.isRead ? 1 : 0;
        const existingIndex = list.findIndex((conv) => conv.jobId === incoming.jobId);
        const updatedConversation: Conversation = existingIndex >= 0
          ? {
              ...list[existingIndex],
              lastMessage: incoming,
              unreadCount: list[existingIndex].unreadCount + unreadDelta,
              otherUser: list[existingIndex].otherUser || otherUser,
              job: list[existingIndex].job || (incoming as Message & { job?: Conversation['job'] }).job,
            }
          : {
              jobId: incoming.jobId,
              job: (incoming as Message & { job?: Conversation['job'] }).job,
              otherUser,
              lastMessage: incoming,
              unreadCount: unreadDelta,
            };

        if (existingIndex >= 0) {
          list.splice(existingIndex, 1);
        }
        list.unshift(updatedConversation);
        return list;
      });
    };

    socket.on('message:new', handleMessageNew);

    return () => {
      socket.off('message:new', handleMessageNew);
    };
  }, [queryClient, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.send,
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', jobId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const selectedConversation = conversations?.find(c => c.jobId === jobId);
  const fallbackOtherUser: User | undefined =
    selectedConversation?.otherUser ||
    (user?.role === 'FREELANCER' ? job?.client : undefined) ||
    (receiverIdParam
      ? { id: receiverIdParam, firstName: 'Freelancer', lastName: '', email: '' }
      : undefined);
  const receiverId = selectedConversation?.otherUser.id || receiverIdParam || (user?.role === 'FREELANCER' ? job?.clientId : undefined);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !jobId || !receiverId) return;

    sendMessageMutation.mutate({
      jobId,
      receiverId,
      content: messageInput.trim(),
    });
  };

  const filteredConversations = conversations?.filter(c =>
    `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${jobId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {conversationsLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations && filteredConversations.length > 0 ? (
                    <div className="divide-y">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.jobId}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            jobId === conv.jobId ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => router.push(`/messages/${conv.jobId}`)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={getMediaUrl(conv.otherUser.avatarUrl)} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {conv.otherUser.firstName.charAt(0)}
                                {conv.otherUser.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {conv.otherUser.firstName} {conv.otherUser.lastName}
                                </p>
                                {conv.lastMessage && (
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate mb-1">
                                {conv.job?.title}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 truncate">
                                  {conv.lastMessage?.content || 'No messages yet'}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-indigo-600 ml-2">{conv.unreadCount}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No conversations yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className={`flex-1 flex flex-col ${!jobId ? 'hidden md:flex' : 'flex'}`}>
                {jobId && (selectedConversation || fallbackOtherUser) ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => router.push('/messages')}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={getMediaUrl(fallbackOtherUser?.avatarUrl)} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                          {fallbackOtherUser?.firstName?.charAt(0) || 'U'}
                          {fallbackOtherUser?.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {fallbackOtherUser?.firstName} {fallbackOtherUser?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {selectedConversation?.job?.title || job?.title}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                              <Skeleton className="h-16 w-64 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => {
                            const isOwn = message.senderId === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    isOwn
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{message.content}</p>
                                  <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">No messages yet</p>
                            <p className="text-sm text-gray-500">Start the conversation!</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={!messageInput.trim() || !receiverId || sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Messages;
