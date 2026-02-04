"use client";

import React from "react"

import { DashboardLayout } from "@/components/dashboard-layout";
import { PillarCard } from "@/components/pillar-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/lib/role-context";
import { mockPillars, mockGoals } from "@/lib/store";
import { PlusCircle, BarChart3, Target, CheckCircle2 } from "lucide-react";

export default function PillarsPage() {
  const { role } = useRole();

  const getGoalsByPillar = (pillarId: string) => {
    return mockGoals.filter((g) => g.pillarId === pillarId);
  };

  const getPillarStats = (pillarId: string) => {
    const goals = getGoalsByPillar(pillarId);
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const avgProgress =
      goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;
    return { totalGoals, completedGoals, avgProgress };
  };

  const overallStats = {
    totalGoals: mockGoals.length,
    completedGoals: mockGoals.filter((g) => g.status === "completed").length,
    avgProgress: Math.round(
      mockGoals.reduce((sum, g) => sum + g.progress, 0) / mockGoals.length
    ),
  };

  const getRoleColor = () => {
    switch (role) {
      case "hr":
        return "bg-blue-500";
      case "manager":
        return "bg-emerald-500";
      default:
        return "bg-violet-500";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Strategic Pillars
            </h1>
            <p className="text-muted-foreground">
              Manage and track goals across the 5 strategic pillars
            </p>
          </div>
          {role === "hr" && (
            <Button className={`${getRoleColor()} text-white`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Pillar
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-blue-100 p-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{overallStats.totalGoals}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {overallStats.completedGoals}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-violet-100 p-3">
                <BarChart3 className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{overallStats.avgProgress}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {mockPillars.map((pillar) => {
            const stats = getPillarStats(pillar.id);
            return (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                goalCount={stats.totalGoals}
                completedCount={stats.completedGoals}
                progress={stats.avgProgress}
              />
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pillar Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockPillars.map((pillar) => {
                const stats = getPillarStats(pillar.id);
                return (
                  <div key={pillar.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pillar.color }}
                        />
                        <span className="font-medium">{pillar.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stats.totalGoals} goals
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {stats.avgProgress}%
                      </span>
                    </div>
                    <Progress
                      value={stats.avgProgress}
                      className="h-2"
                      style={
                        {
                          "--progress-background": pillar.color,
                        } as React.CSSProperties
                      }
                    />
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
