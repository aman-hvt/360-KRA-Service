"use client";

import { useState, useEffect } from 'react';
import { SyncHistoryItem, SyncHistoryResponse } from '@/lib/types';
import { useRole } from '@/lib/role-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function SyncPage() {
  const { currentRole, currentUser } = useRole();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Sync history state
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch sync history
  useEffect(() => {
    if (currentRole === 'hr' && currentUser?.id) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sync/employees/history`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }

          const data: SyncHistoryResponse = await response.json();
          if (data.status === 'success' && data.data?.history) {
            setSyncHistory(data.data.history);
          } else {
            setSyncHistory([]);
          }
        } catch (error) {
          console.error('Error fetching sync history:', error);
          setHistoryError(error instanceof Error ? error.message : 'Failed to load sync history');
          setSyncHistory([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };

      fetchHistory();
    }
  }, [currentRole, currentUser?.id]);

  if (currentRole !== 'hr') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500">This page is only available to HR users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSync = async (action: string) => {
    setIsSyncing(action);
    if (!currentUser?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive"
      });
      setIsSyncing(null);
      return;
    }

    const employeeId = currentUser.id;

    try {
      if (action === 'pull-employees') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sync/employees`, {
          method: 'POST',
          headers: {
            'x-employee-id': employeeId
          },
          body: ''
        });

        if (!res.ok) throw new Error('Sync failed');

        // Refetch history after successful sync
        const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sync/employees/history`, {
          headers: { 'x-employee-id': employeeId }
        });
        if (historyRes.ok) {
          const data: SyncHistoryResponse = await historyRes.json();
          if (data.status === 'success' && data.data?.history) {
            setSyncHistory(data.data.history);
          }
        }
      } else if (action === 'pull-goals') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sync/goals`, {
          method: 'POST',
          headers: {
            'x-employee-id': employeeId
          },
          body: ''
        });

        if (!res.ok) throw new Error('Sync failed');
      } else {
        // Simulate sync for other actions
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast({
        title: "Sync Completed",
        description: `${getActionLabel(action)} completed successfully.`
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Failed to ${getActionLabel(action).toLowerCase()}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'IN_PROGRESS':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    const colors: Record<string, string> = {
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      FAILED: 'bg-red-100 text-red-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      PENDING: 'bg-amber-100 text-amber-700'
    };
    return (
      <Badge variant="secondary" className={colors[statusUpper] || 'bg-slate-100 text-slate-700'}>
        {status}
      </Badge>
    );
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'pull-employees':
        return 'Pull Employees';
      case 'pull-goals':
        return 'Pull Goals';
      case 'push-progress':
        return 'Push Progress';
      default:
        return action;
    }
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffSeconds = Math.floor((endTime - startTime) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatSyncType = (syncType: string) => {
    return syncType
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sync Management</h1>
          <p className="text-slate-500">Synchronize data with external HR systems</p>
        </div>

        {/* Sync Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-500" />
                Pull Employees
              </CardTitle>
              <CardDescription>
                Import employee data from HRIS system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSyncing !== null}
                  >
                    {isSyncing === 'pull-employees' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Pull Employees
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Pull Employee Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will import the latest employee data from your HRIS system.
                      Existing employee records will be updated with new information.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSync('pull-employees')}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-500" />
                Pull Goals
              </CardTitle>
              <CardDescription>
                Import goals from performance management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSyncing !== null}
                  >
                    {isSyncing === 'pull-goals' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Pull Goals
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Pull Goal Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will import the latest goal definitions from your performance
                      management system. New goals will be added and existing ones updated.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSync('pull-goals')}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-violet-500" />
                Push Progress
              </CardTitle>
              <CardDescription>
                Export progress updates to external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={isSyncing !== null}
                  >
                    {isSyncing === 'push-progress' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Push Progress
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Push Progress Updates?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will export all progress updates to your external performance
                      management system. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSync('push-progress')}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>
                  Recent synchronization activities
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentUser?.id) {
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sync/employees/history`, {
                      headers: { 'x-employee-id': currentUser.id }
                    })
                      .then(res => res.json())
                      .then((data: SyncHistoryResponse) => {
                        if (data.status === 'success' && data.data?.history) {
                          setSyncHistory(data.data.history);
                          toast({ title: "Refreshed", description: "Sync history updated" });
                        }
                      })
                      .catch(err => {
                        toast({ title: "Error", description: "Failed to refresh", variant: "destructive" });
                      });
                  }
                }}
                disabled={isLoadingHistory}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-slate-500">Loading sync history...</p>
              </div>
            ) : historyError ? (
              <div className="text-center py-8 text-red-500">
                <p>Error: {historyError}</p>
              </div>
            ) : syncHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No sync history available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncHistory.map(log => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatSyncType(log.syncType)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {log.recordsProcessed} records
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs">
                          {log.changesApplied.inserted > 0 && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>+{log.changesApplied.inserted}</span>
                            </div>
                          )}
                          {log.changesApplied.updated > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <RefreshCw className="h-3 w-3" />
                              <span>{log.changesApplied.updated}</span>
                            </div>
                          )}
                          {log.changesApplied.inactivated > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown className="h-3 w-3" />
                              <span>-{log.changesApplied.inactivated}</span>
                            </div>
                          )}
                          {log.changesApplied.inserted === 0 &&
                            log.changesApplied.updated === 0 &&
                            log.changesApplied.inactivated === 0 && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Minus className="h-3 w-3" />
                                <span>No changes</span>
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDuration(log.startedAt, log.completedAt)}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(log.completedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
