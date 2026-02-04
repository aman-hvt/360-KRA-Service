"use client";

import { useState, useEffect } from 'react';
import { FeedbackCenterItem, FeedbackCenterResponse } from '@/lib/types';
import { useRole } from '@/lib/role-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  MessageSquare,
  Send,
  Clock,
  Search,
  Lock,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

export default function FeedbackPage() {
  const { currentUser } = useRole();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('received');
  const [searchQuery, setSearchQuery] = useState('');

  // State for received feedback
  const [receivedFeedback, setReceivedFeedback] = useState<FeedbackCenterItem[]>([]);
  const [isLoadingReceived, setIsLoadingReceived] = useState(false);
  const [receivedError, setReceivedError] = useState<string | null>(null);

  // State for given feedback
  const [givenFeedback, setGivenFeedback] = useState<FeedbackCenterItem[]>([]);
  const [isLoadingGiven, setIsLoadingGiven] = useState(false);
  const [givenError, setGivenError] = useState<string | null>(null);

  // Fetch received feedback
  useEffect(() => {
    if (currentUser?.id) {
      const fetchReceived = async () => {
        setIsLoadingReceived(true);
        setReceivedError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback/received`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }

          const data: FeedbackCenterResponse = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setReceivedFeedback(data.data);
          } else {
            setReceivedFeedback([]);
          }
        } catch (error) {
          console.error('Error fetching received feedback:', error);
          setReceivedError(error instanceof Error ? error.message : 'Failed to load feedback');
          setReceivedFeedback([]);
        } finally {
          setIsLoadingReceived(false);
        }
      };

      fetchReceived();
    }
  }, [currentUser?.id]);

  // Fetch given feedback
  useEffect(() => {
    if (currentUser?.id) {
      const fetchGiven = async () => {
        setIsLoadingGiven(true);
        setGivenError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback/given`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }

          const data: FeedbackCenterResponse = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setGivenFeedback(data.data);
          } else {
            setGivenFeedback([]);
          }
        } catch (error) {
          console.error('Error fetching given feedback:', error);
          setGivenError(error instanceof Error ? error.message : 'Failed to load feedback');
          setGivenFeedback([]);
        } finally {
          setIsLoadingGiven(false);
        }
      };

      fetchGiven();
    }
  }, [currentUser?.id]);

  // Helper to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const FeedbackCard = ({ feedback, showGiver = true }: { feedback: FeedbackCenterItem; showGiver?: boolean }) => {
    const goal = feedback.goalId;
    const kraName = goal.kraId?.kraName;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            {/* Avatar - Show Provider (if showGiver=true) OR Recipient (if showGiver=false) */}
            {showGiver ? (
              feedback.isAnonymous ? (
                <Avatar className="h-10 w-10 bg-slate-300">
                  <AvatarFallback>
                    <Lock className="h-5 w-5 text-slate-600" />
                  </AvatarFallback>
                </Avatar>
              ) : feedback.providerId ? (
                <Avatar className="h-10 w-10">
                  {feedback.providerId.photo && (
                    <AvatarImage src={feedback.providerId.photo} alt={`${feedback.providerId.firstName} ${feedback.providerId.lastName}`} />
                  )}
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {feedback.providerId.firstName[0]}{feedback.providerId.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
              ) : null
            ) : feedback.recipientId ? (
              <Avatar className="h-10 w-10">
                {feedback.recipientId.photo && (
                  <AvatarImage src={feedback.recipientId.photo} alt={`${feedback.recipientId.firstName} ${feedback.recipientId.lastName}`} />
                )}
                <AvatarFallback className="bg-violet-100 text-violet-700">
                  {feedback.recipientId.firstName[0]}{feedback.recipientId.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
            ) : null}

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {showGiver
                      ? (feedback.isAnonymous ? 'Anonymous' : `${feedback.providerId?.firstName} ${feedback.providerId?.lastName || ''}`)
                      : `${feedback.recipientId?.firstName} ${feedback.recipientId?.lastName || ''}`
                    }
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(feedback.createdAt)}
                  </p>
                </div>
                {feedback.rating && feedback.rating > 0 && (
                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3 w-3",
                          feedback.rating! >= star
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-300"
                        )}
                      />
                    ))}
                    <span className="ml-1 text-xs font-bold text-amber-700">{feedback.rating}</span>
                  </div>
                )}
              </div>

              {/* Goal Info */}
              <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">{goal.goalNameOnZoho}</span>
                </div>
                {kraName && (
                  <Badge variant="secondary" className="text-xs">
                    {kraName}
                  </Badge>
                )}
                <p className="text-xs text-slate-600 mt-1">{goal.description}</p>
              </div>

              {/* Comment */}
              <p className="text-slate-700">{feedback.comment}</p>

              {/* Anonymous Badge */}
              {feedback.isAnonymous && showGiver && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Anonymous
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Feedback Center</h1>
            <p className="text-slate-500">View feedback received and given on goals</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{receivedFeedback.length}</p>
                  <p className="text-sm text-slate-500">Feedback Received</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Send className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{givenFeedback.length}</p>
                  <p className="text-sm text-slate-500">Feedback Given</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="received">
                Received ({receivedFeedback.length})
              </TabsTrigger>
              <TabsTrigger value="given">
                Given ({givenFeedback.length})
              </TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <TabsContent value="received">
            {isLoadingReceived ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading feedback...</p>
                  </div>
                </CardContent>
              </Card>
            ) : receivedError ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-red-500">
                    <p>Error: {receivedError}</p>
                  </div>
                </CardContent>
              </Card>
            ) : receivedFeedback.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No feedback received yet
                    </h3>
                    <p className="text-slate-500">
                      Feedback from your peers and managers will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedFeedback
                  .filter(fb => {
                    if (!searchQuery) return true;
                    const provider = fb.providerId;
                    const goal = fb.goalId;
                    return (
                      fb.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      provider?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      provider?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      goal.goalNameOnZoho.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      goal.kraId?.kraName.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  })
                  .map(fb => (
                    <FeedbackCard key={fb._id} feedback={fb} showGiver={true} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="given">
            {isLoadingGiven ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading feedback...</p>
                  </div>
                </CardContent>
              </Card>
            ) : givenError ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-red-500">
                    <p>Error: {givenError}</p>
                  </div>
                </CardContent>
              </Card>
            ) : givenFeedback.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Send className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No feedback given yet
                    </h3>
                    <p className="text-slate-500 mb-4">
                      You haven't provided any feedback yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {givenFeedback
                  .filter(fb => {
                    if (!searchQuery) return true;
                    const goal = fb.goalId;
                    const recipient = fb.recipientId;
                    return (
                      fb.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      goal.goalNameOnZoho.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      goal.kraId?.kraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      recipient?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      recipient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  })
                  .map(fb => (
                    <FeedbackCard key={fb._id} feedback={fb} showGiver={false} />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
