"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import type { JobFilters } from '@/types';

const categories = [
  'All Categories',
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Data Analytics',
  'Consulting',
  'Other',
];

const categoryMap: Record<string, string> = {
  'Web Development': 'WEB_DEVELOPMENT',
  'Mobile Development': 'MOBILE_DEVELOPMENT',
  Design: 'DESIGN',
  Writing: 'WRITING',
  Marketing: 'MARKETING',
  'Data Analytics': 'DATA_ANALYTICS',
  Consulting: 'CONSULTING',
  Other: 'OTHER',
};

const JobsList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All Categories');
  const [status, setStatus] = useState(searchParams.get('status') || 'OPEN');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [budgetType, setBudgetType] = useState('');
  const [budgetRange, setBudgetRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const filters: JobFilters = {
    search: searchQuery || undefined,
    category: category !== 'All Categories' ? categoryMap[category] : undefined,
    minBudget: budgetRange[0] > 0 ? budgetRange[0] : undefined,
    maxBudget: budgetRange[1] < 10000 ? budgetRange[1] : undefined,
    status: status === 'ALL' ? undefined : (status as JobFilters['status']),
    sortBy: sortBy as JobFilters['sortBy'],
  };

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', filters, page],
    queryFn: () => jobsApi.getAll(filters, page, 12),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category !== 'All Categories') params.set('category', category);
    if (status && status !== 'ALL') params.set('status', status);
    if (sortBy) params.set('sortBy', sortBy);
    const query = params.toString();
    router.push(query ? `/jobs?${query}` : '/jobs');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('All Categories');
    setStatus('OPEN');
    setSortBy('date');
    setBudgetType('');
    setBudgetRange([0, 10000]);
    router.push('/jobs');
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    category !== 'All Categories' ||
    budgetRange[0] > 0 ||
    budgetRange[1] < 10000 ||
    status !== 'OPEN' ||
    sortBy !== 'date';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Jobs</h1>
            <p className="text-gray-600">
              Browse {jobsData?.total || 0} available opportunities
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search jobs by title, skills, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CONTRACTED">Contracted</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest</SelectItem>
                  <SelectItem value="budget_desc">Highest Budget</SelectItem>
                  <SelectItem value="budget_asc">Lowest Budget</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </form>

            {/* Advanced Filters */}
            <div className={`mt-4 pt-4 border-t ${showFilters ? 'block' : 'hidden md:block'}`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Budget Range:</span>
                  <div className="flex-1 max-w-xs">
                    <Slider
                      value={budgetRange}
                      onValueChange={setBudgetRange}
                      min={0}
                      max={10000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Br {budgetRange[0]}</span>
                      <span>Br {budgetRange[1]}+</span>
                    </div>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Jobs Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobsData?.data && jobsData.data.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobsData.data.map((job) => (
                  <Card
                    key={job.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {job.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {job.client?.company || 'Client'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        {job.budget !== null && job.budget !== undefined && (
                          <span className="font-semibold text-indigo-600">
                            Br {job.budget.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {jobsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, jobsData.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={page === pageNum ? 'bg-indigo-600' : ''}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {jobsData.totalPages > 5 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant={page === jobsData.totalPages ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(jobsData.totalPages)}
                        >
                          {jobsData.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(jobsData.totalPages, p + 1))}
                    disabled={page === jobsData.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Check back later for new opportunities'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobsList;
