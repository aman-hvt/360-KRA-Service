"use client";

import { useState } from 'react';
import { PILLARS } from '@/lib/types';
import { goals, users, getPillarStats, getOverallStats } from '@/lib/store';
import { useRole } from '@/lib/role-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  AlertTriangle,
  Users,
  Target,
  Trophy
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const { currentRole } = useRole();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('month');
  const stats = getOverallStats();

  if (currentRole === 'employee') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500">Reports are only available to HR and Managers.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Your ${format.toUpperCase()} report is being generated.`
    });
  };

  // Calculate top performers
  const topPerformers = users
    .filter(u => u.role === 'employee')
    .map(user => {
      const userGoals = goals.filter(g => g.ownerId === user.id);
      const avgProgress = userGoals.length > 0 
        ? Math.round(userGoals.reduce((sum, g) => sum + g.progress, 0) / userGoals.length)
        : 0;
      return { user, avgProgress, goalCount: userGoals.length };
    })
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 5);

  // Goals by status
  const goalsByStatus = {
    'not-started': goals.filter(g => g.status === 'not-started').length,
    'in-progress': goals.filter(g => g.status === 'in-progress').length,
    'at-risk': goals.filter(g => g.status === 'at-risk').length,
    'completed': goals.filter(g => g.status === 'completed').length,
    'overdue': goals.filter(g => g.status === 'overdue').length
  };

  const totalGoals = goals.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
            <p className="text-slate-500">Performance insights and pillar analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalGoals}</p>
                  <p className="text-sm text-slate-500">Total Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgProgress}%</p>
                  <p className="text-sm text-slate-500">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.goalsAtRisk}</p>
                  <p className="text-sm text-slate-500">At Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                  <p className="text-sm text-slate-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pillar Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Pillar Progress Comparison
            </CardTitle>
            <CardDescription>
              Average progress across all 5 organizational pillars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {PILLARS.map(pillar => {
                const stats = getPillarStats(pillar.id);
                return (
                  <div key={pillar.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pillar.color }}
                        />
                        <span className="font-medium text-slate-900">{pillar.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stats.totalGoals} goals
                        </Badge>
                      </div>
                      <span className="font-bold" style={{ color: pillar.color }}>
                        {stats.avgProgress}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stats.avgProgress}%`,
                          backgroundColor: pillar.color
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Completed: {stats.completed}</span>
                      <span>At Risk: {stats.atRisk}</span>
                      <span>Overdue: {stats.overdue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-emerald-500" />
                Goals Distribution by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(goalsByStatus).map(([status, count]) => {
                  const percentage = Math.round((count / totalGoals) * 100);
                  const colors: Record<string, string> = {
                    'not-started': '#94A3B8',
                    'in-progress': '#3B82F6',
                    'at-risk': '#F59E0B',
                    'completed': '#10B981',
                    'overdue': '#EF4444'
                  };
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[status] }}
                      />
                      <span className="flex-1 text-sm text-slate-600 capitalize">
                        {status.replace('-', ' ')}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{count}</span>
                      <div className="w-24">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-slate-500 w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Employees with highest average goal progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.user.id} className="flex items-center gap-4">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-slate-100 text-slate-600" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-slate-50 text-slate-500"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10 bg-blue-100">
                      <AvatarFallback className="text-blue-700">
                        {performer.user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {performer.user.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {performer.user.designation} · {performer.goalCount} goals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {performer.avgProgress}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pillar Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Pillar Breakdown</CardTitle>
            <CardDescription>
              Complete statistics for each organizational pillar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PILLARS.map(pillar => {
                const stats = getPillarStats(pillar.id);
                return (
                  <div 
                    key={pillar.id} 
                    className="p-4 rounded-xl border"
                    style={{ borderColor: `${pillar.color}30` }}
                  >
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm mb-3">
                      {pillar.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Goals</span>
                        <span className="font-medium">{stats.totalGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium" style={{ color: pillar.color }}>
                          {stats.avgProgress}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed</span>
                        <span className="font-medium text-emerald-600">{stats.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">At Risk</span>
                        <span className="font-medium text-amber-600">{stats.atRisk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overdue</span>
                        <span className="font-medium text-red-600">{stats.overdue}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
