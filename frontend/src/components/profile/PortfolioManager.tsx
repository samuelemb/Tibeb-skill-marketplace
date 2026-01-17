"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { portfolioApi } from '@/lib/api';
import type { PortfolioItem } from '@/types';

const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description is too long'),
  projectUrl: z.string().url('Project URL must be valid').max(500, 'Project URL is too long').optional().or(z.literal('')),
  technologies: z.string().max(500, 'Technologies is too long').optional(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

const PortfolioManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getMine,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
  });

  const createMutation = useMutation({
    mutationFn: portfolioApi.create,
    onSuccess: () => {
      toast.success('Portfolio item added');
      reset();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add portfolio item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PortfolioFormData> }) =>
      portfolioApi.update(id, data),
    onSuccess: () => {
      toast.success('Portfolio item updated');
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update portfolio item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: portfolioApi.remove,
    onSuccess: () => {
      toast.success('Portfolio item deleted');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete portfolio item');
    },
  });

  const handleCreate = (data: PortfolioFormData) => {
    createMutation.mutate({
      title: data.title,
      description: data.description,
      projectUrl: data.projectUrl || null,
      technologies: data.technologies || null,
    });
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    resetEdit({
      title: item.title,
      description: item.description,
      projectUrl: item.projectUrl || '',
      technologies: item.technologies || '',
    });
  };

  const handleUpdate = (data: PortfolioFormData) => {
    if (!editingItem) return;
    updateMutation.mutate({
      id: editingItem.id,
      data: {
        title: data.title,
        description: data.description,
        projectUrl: data.projectUrl || null,
        technologies: data.technologies || null,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (deleteMutation.isPending) return;
    const confirmed = window.confirm('Delete this portfolio item?');
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Add Portfolio Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register('description')} />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectUrl">Project URL (optional)</Label>
                <Input id="projectUrl" {...register('projectUrl')} />
                {errors.projectUrl && (
                  <p className="text-sm text-red-500 mt-1">{errors.projectUrl.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="technologies">Technologies (optional)</Label>
              <Input id="technologies" {...register('technologies')} />
              {errors.technologies && (
                <p className="text-sm text-red-500 mt-1">{errors.technologies.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Add Item'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : items && items.length > 0 ? (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Portfolio Item</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitEdit(handleUpdate)} className="space-y-4">
                          <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input id="edit-title" {...registerEdit('title')} />
                            {editErrors.title && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.title.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea id="edit-description" rows={4} {...registerEdit('description')} />
                            {editErrors.description && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.description.message}</p>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-projectUrl">Project URL</Label>
                              <Input id="edit-projectUrl" {...registerEdit('projectUrl')} />
                              {editErrors.projectUrl && (
                                <p className="text-sm text-red-500 mt-1">{editErrors.projectUrl.message}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-technologies">Technologies</Label>
                            <Input id="edit-technologies" {...registerEdit('technologies')} />
                            {editErrors.technologies && (
                              <p className="text-sm text-red-500 mt-1">{editErrors.technologies.message}</p>
                            )}
                          </div>
                          <Button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      Project Link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <a
                    href={`/portfolio/${item.id}`}
                    className="inline-flex items-center gap-1 text-gray-700 hover:underline"
                  >
                    Public View
                  </a>
                </div>
                {item.technologies && (
                  <p className="text-sm text-gray-500">Tech: {item.technologies}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-600">
              No portfolio items yet. Add your first project above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PortfolioManager;
