"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Menu,
  X,
  User,
  Briefcase,
  MessageSquare,
  LogOut,
  Settings,
  LayoutDashboard,
  FileText,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { messagesApi, notificationsApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications for badge count
  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => notificationsApi.getAll({ limit: 5, offset: 0 }),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const { data: unreadMessages } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: messagesApi.getUnreadCount,
    enabled: isAuthenticated,
  });

  const unreadMessagesCount = unreadMessages?.unreadCount || 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = isAuthenticated
    ? user?.role === 'ADMIN'
      ? [
          { href: '/admin', label: 'Admin', icon: LayoutDashboard },
        ]
      : user?.role === 'CLIENT'
        ? [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/jobs/my-jobs', label: 'My Jobs', icon: Briefcase },
            { href: '/messages', label: 'Messages', icon: MessageSquare },
          ]
        : [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/jobs', label: 'Find Jobs', icon: Search },
            { href: '/proposals', label: 'My Proposals', icon: FileText },
            { href: '/messages', label: 'Messages', icon: MessageSquare },
          ]
    : [];

  const logoHref = isAuthenticated ? '/dashboard' : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={logoHref} className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Tibeb"
              width={80}
              height={80}
              priority
              className="h-20 w-20 rounded-lg object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {!isAuthenticated && (
              <>
                <Link
                  href="/jobs"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/jobs')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Browse Jobs
                </Link>
                <Link
                  href="/#how-it-works"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/#how-it-works')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  How It Works
                </Link>
              </>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(link.href)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.href === '/messages' && unreadMessagesCount > 0 && (
                  <Badge className="ml-1 h-5 px-2 py-0 text-xs bg-orange-500">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <span className="font-semibold">Notifications</span>
                      <Link href="/notifications" className="text-sm text-indigo-600 hover:underline">
                        View all
                      </Link>
                    </div>
                    {notifications && notifications.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                            <span className={`text-sm ${notification.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                              {notification.title}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">{notification.message}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getMediaUrl(user?.avatarUrl)} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                          {getInitials(user?.firstName, user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium text-gray-700">
                        {user?.firstName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {user?.role}
                      </Badge>
                    </div>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')} className="hidden sm:inline-flex">
                  Sign In
                </Button>
                <Button onClick={() => router.push('/register')} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-1">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/jobs"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </Link>
                </>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isActive(link.href)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.href === '/messages' && unreadMessagesCount > 0 && (
                    <Badge className="ml-1 h-5 px-2 py-0 text-xs bg-orange-500">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Badge>
                  )}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-4 px-4 flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { router.push('/login'); setMobileMenuOpen(false); }} className="w-full">
                    Sign In
                  </Button>
                  <Button onClick={() => { router.push('/register'); setMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700">
                    Get Started
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
