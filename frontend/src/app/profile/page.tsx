"use client";

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Star,
  Camera,
  Loader2,
  CheckCircle,
  X,
  Edit,
  Save,
  Wallet,
} from 'lucide-react';
import { profileApi, reviewsApi, skillsApi, walletApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import ProtectedRoute from '@/components/ProtectedRoute';
import PortfolioManager from '@/components/profile/PortfolioManager';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const { data: reviews } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: () => reviewsApi.getForUser(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: reviewAverage } = useQuery({
    queryKey: ['userReviewAverage', user?.id],
    queryFn: () => reviewsApi.getAverage(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getMine,
    enabled: user?.role === 'FREELANCER',
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getMyWallet,
    enabled: user?.role === 'FREELANCER',
  });

  const { data: walletTransactions } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: () => walletApi.getMyTransactions({ limit: 20, offset: 0 }),
    enabled: user?.role === 'FREELANCER',
  });

  const { data: skillSuggestions = [] } = useQuery({
    queryKey: ['skillSearch', skillInput],
    queryFn: () => skillsApi.search(skillInput.trim()),
    enabled: user?.role === 'FREELANCER' && skillInput.trim().length >= 2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: skillsApi.add,
    onSuccess: () => {
      setSkillInput('');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add skill');
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: skillsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove skill');
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      toast.success('Avatar updated!');
      refetchUser();
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
    });
  };

  const totalReviews = reviewAverage?.totalReviews ?? reviews?.length ?? 0;
  const averageRating = totalReviews > 0
    ? (reviewAverage?.averageRating ?? (reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / (reviews?.length || 1)).toFixed(1)
    : null;

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={getMediaUrl(user.avatarUrl)} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-3xl">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h1>
                    <Badge variant="outline" className="capitalize w-fit mx-auto md:mx-0">
                      {user.role}
                    </Badge>
                    {user.emailVerified && (
                      <Badge className="bg-green-100 text-green-700 w-fit mx-auto md:mx-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{user.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600">
                    {averageRating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {averageRating} ({totalReviews} reviews)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {user.role === 'FREELANCER' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('wallet')}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </Button>
                  )}
                  <Button
                    variant={isEditing ? 'outline' : 'default'}
                    onClick={() => {
                      if (isEditing) {
                        reset();
                      }
                      setIsEditing(!isEditing);
                    }}
                    className={isEditing ? '' : 'bg-indigo-600 hover:bg-indigo-700'}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              {user.role === 'FREELANCER' && (
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            disabled={!isEditing}
                            {...register('firstName')}
                          />
                          {errors.firstName && (
                            <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            disabled={!isEditing}
                            {...register('lastName')}
                          />
                          {errors.lastName && (
                            <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {user.role === 'FREELANCER' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Skills</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills && skills.length > 0 ? (
                            skills.map((skill) => (
                              <Badge key={skill.id} variant="secondary" className="px-3 py-1">
                                {skill.name}
                                <button
                                  type="button"
                                  onClick={() => removeSkillMutation.mutate(skill.id)}
                                  className="ml-2 hover:text-red-500"
                                  disabled={removeSkillMutation.isPending}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No skills added yet.</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a skill"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (skillInput.trim()) {
                                  addSkillMutation.mutate(skillInput.trim());
                                }
                              }
                            }}
                            disabled={addSkillMutation.isPending}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (skillInput.trim()) {
                                addSkillMutation.mutate(skillInput.trim());
                              }
                            }}
                            disabled={addSkillMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                        {skillInput.trim().length >= 2 && skillSuggestions.length > 0 && (
                          <div className="mt-2 border rounded-md bg-white shadow-sm">
                            {skillSuggestions.map((suggestion) => {
                              const alreadyAdded = skills?.some((skill) => skill.name === suggestion.name);
                              return (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                                  onClick={() => {
                                    if (!alreadyAdded) {
                                      addSkillMutation.mutate(suggestion.name);
                                    }
                                  }}
                                  disabled={alreadyAdded || addSkillMutation.isPending}
                                >
                                  {suggestion.name}
                                  {alreadyAdded ? ' (added)' : ''}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Save Button */}
                  {isEditing && (
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardContent className="p-6">
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={getMediaUrl(review.reviewer?.avatarUrl)} />
                              <AvatarFallback>
                                {review.reviewer?.firstName?.charAt(0)}
                                {review.reviewer?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium">
                                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {review.job?.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                              <p className="text-sm text-gray-500 mt-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-gray-600">
                        Complete projects to receive reviews from clients
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="portfolio">
              <PortfolioManager />
            </TabsContent>
            {user.role === 'FREELANCER' && (
              <TabsContent value="wallet">
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {walletData ? Number(walletData.balance).toFixed(2) : '0.00'} ETB
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Recent Transactions</p>
                      {walletTransactions?.transactions?.length ? (
                        <div className="space-y-3">
                          {walletTransactions.transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{tx.type}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {Number(tx.amount).toFixed(2)} {tx.currency}
                                </p>
                                {tx.reference && (
                                  <p className="text-xs text-gray-500">Ref: {tx.reference}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No transactions yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
