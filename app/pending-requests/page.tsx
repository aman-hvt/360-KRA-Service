"use client";

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Inbox, Calendar, User, CheckCircle, XCircle, Target } from 'lucide-react';
import { useRole } from '@/lib/role-context';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DueDateRequest {
    _id: string;
    goalId: {
        _id: string;
        dueDateOnZoho: string;
        goalNameOnZoho: string;
    };
    requestedBy: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    currentDueDate: string;
    proposedDueDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approverId: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewerComments?: string | null;
    requestedAt: string;
    updatedAt: string;
}

interface DueDateRequestsResponse {
    status: string;
    count: number;
    data: DueDateRequest[];
}

interface CreatedRequest {
    _id: string;
    goalId: {
        _id: string;
        dueDateOnZoho: string;
        goalNameOnZoho: string;
    };
    requestedBy: string; // Just the ID for created requests
    currentDueDate: string;
    proposedDueDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approverId: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    reviewerComments?: string | null;
    requestedAt: string;
    updatedAt: string;
}

interface CreatedRequestsResponse {
    status: string;
    count: number;
    data: CreatedRequest[];
}

export default function RequestCentrePage() {
    const { currentUser, currentRole } = useRole();
    const { toast } = useToast();
    const [pendingRequests, setPendingRequests] = useState<DueDateRequest[]>([]);
    const [createdRequests, setCreatedRequests] = useState<CreatedRequest[]>([]);
    const [isLoadingPending, setIsLoadingPending] = useState(true);
    const [isLoadingCreated, setIsLoadingCreated] = useState(false);

    useEffect(() => {
        if (!currentUser?.id) return;

        // For employees, fetch created requests immediately
        if (currentRole === 'employee') {
            fetchCreatedRequests();
            return;
        }

        // For managers/HR, fetch pending requests
        const fetchPendingRequests = async () => {
            try {
                setIsLoadingPending(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals/due-date-requests`, {
                    headers: {
                        'x-employee-id': currentUser.id
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch pending requests: ${response.statusText}`);
                }

                const data: DueDateRequestsResponse = await response.json();
                console.log('Pending Requests:', data);

                if (data.status === 'success' && Array.isArray(data.data)) {
                    setPendingRequests(data.data);
                }
            } catch (error) {
                console.error('Error fetching pending requests:', error);
                toast({
                    title: "Error loading requests",
                    description: error instanceof Error ? error.message : "Could not load pending requests.",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingPending(false);
            }
        };

        fetchPendingRequests();
    }, [currentUser]);

    const fetchCreatedRequests = async () => {
        if (!currentUser?.id) return;

        try {
            setIsLoadingCreated(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals/my-due-date-requests`, {
                headers: {
                    'x-employee-id': currentUser.id
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch created requests: ${response.statusText}`);
            }

            const data: CreatedRequestsResponse = await response.json();
            console.log('Created Requests:', data);

            if (data.status === 'success' && Array.isArray(data.data)) {
                setCreatedRequests(data.data);
            }
        } catch (error) {
            console.error('Error fetching created requests:', error);
            toast({
                title: "Error loading created requests",
                description: error instanceof Error ? error.message : "Could not load created requests.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingCreated(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const formatRelativeTime = (dateString: string) => {
        try {
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
        } catch {
            return dateString;
        }
    };

    const handleApproveReject = async (requestId: string, approved: boolean) => {
        if (!currentUser?.id) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals/due-date-requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-employee-id': currentUser.id
                },
                body: JSON.stringify({ approved })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${approved ? 'approve' : 'reject'} request: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Request ${approved ? 'approved' : 'rejected'}:`, data);

            toast({
                title: approved ? "Request Approved" : "Request Rejected",
                description: `The due date change request has been ${approved ? 'approved' : 'rejected'} successfully.`
            });

            // Refresh the requests list
            setPendingRequests(prev => prev.filter(req => req._id !== requestId));

        } catch (error) {
            console.error(`Error ${approved ? 'approving' : 'rejecting'} request:`, error);
            toast({
                title: `Error ${approved ? 'approving' : 'rejecting'} request`,
                description: error instanceof Error ? error.message : "Could not process request.",
                variant: "destructive"
            });
        }
    };

    const RequestCard = ({ request }: { request: DueDateRequest }) => {
        const [isProcessing, setIsProcessing] = useState(false);

        const handleApprove = async () => {
            setIsProcessing(true);
            await handleApproveReject(request._id, true);
            setIsProcessing(false);
        };

        const handleReject = async () => {
            setIsProcessing(true);
            await handleApproveReject(request._id, false);
            setIsProcessing(false);
        };

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-1">{request.goalId.goalNameOnZoho}</CardTitle>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs shrink-0">
                            {request.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                            {request.requestedBy.firstName} {request.requestedBy.lastName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="shrink-0">{formatRelativeTime(request.requestedAt)}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500">Current</p>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-xs font-medium">{formatDate(request.currentDueDate)}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500">Proposed</p>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-medium text-blue-600">{formatDate(request.proposedDueDate)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 text-xs flex-1"
                            onClick={handleApprove}
                            disabled={isProcessing}
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isProcessing ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs flex-1"
                            onClick={handleReject}
                            disabled={isProcessing}
                        >
                            <XCircle className="h-3 w-3 mr-1" />
                            {isProcessing ? 'Processing...' : 'Reject'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const CreatedRequestCard = ({ request }: { request: CreatedRequest }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">{request.goalId.goalNameOnZoho}</CardTitle>
                    <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                    >
                        {request.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                        Approver: {request.approverId.firstName} {request.approverId.lastName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="shrink-0">{formatRelativeTime(request.requestedAt)}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Current</p>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-xs font-medium">{formatDate(request.currentDueDate)}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Proposed</p>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-blue-600">{formatDate(request.proposedDueDate)}</span>
                        </div>
                    </div>
                </div>

                {request.reviewedAt && (
                    <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            Reviewed {formatRelativeTime(request.reviewedAt)}
                        </p>
                        {request.reviewerComments && (
                            <p className="text-xs text-slate-600 mt-1">{request.reviewerComments}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const EmptyState = ({ message }: { message: string }) => (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Inbox className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{message}</h3>
                <p className="text-sm text-slate-500 text-center max-w-md">
                    There are currently no requests in this section.
                </p>
            </CardContent>
        </Card>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Request Centre</h1>
                    <p className="text-slate-500 mt-1">
                        {currentRole === 'employee'
                            ? 'View your goal due date change requests'
                            : 'Review and manage goal requests from your team'
                        }
                    </p>
                </div>

                {currentRole === 'employee' ? (
                    // Employee view - Only show Created Requests
                    <div className="space-y-4">
                        {isLoadingCreated ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                                </CardContent>
                            </Card>
                        ) : createdRequests.length === 0 ? (
                            <EmptyState message="No Created request" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {createdRequests.map((request) => (
                                    <CreatedRequestCard key={request._id} request={request} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Manager/HR view - Show both tabs
                    <Tabs defaultValue="pending" className="space-y-4" onValueChange={(value) => {
                        if (value === 'created' && createdRequests.length === 0 && !isLoadingCreated) {
                            fetchCreatedRequests();
                        }
                    }}>
                        <TabsList>
                            <TabsTrigger value="pending">
                                <Clock className="h-4 w-4 mr-2" />
                                Pending Request
                            </TabsTrigger>
                            <TabsTrigger value="created">
                                <Target className="h-4 w-4 mr-2" />
                                Created Request
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {isLoadingPending ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-12">
                                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                                    </CardContent>
                                </Card>
                            ) : pendingRequests.length === 0 ? (
                                <EmptyState message="No Pending request" />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingRequests.map((request) => (
                                        <RequestCard key={request._id} request={request} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="created">
                            {isLoadingCreated ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-12">
                                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                                    </CardContent>
                                </Card>
                            ) : createdRequests.length === 0 ? (
                                <EmptyState message="No Created request" />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {createdRequests.map((request) => (
                                        <CreatedRequestCard key={request._id} request={request} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </DashboardLayout>
    );
}
