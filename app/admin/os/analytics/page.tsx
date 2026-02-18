"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your progress and productivity insights</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard - Coming Soon
          </CardTitle>
          <CardDescription>
            This page will provide comprehensive insights into your productivity and task completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Planned Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Completed tasks over time (line chart)</li>
              <li>Focus minutes by department (bar chart)</li>
              <li>Revenue type distribution (pie chart)</li>
              <li>Department performance comparison</li>
              <li>Current streak and best streak tracking</li>
              <li>Stale tasks list and recommendations</li>
              <li>Completion rate trends</li>
              <li>Date range selector for custom analysis</li>
            </ul>
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              The analytics API is already built and ready. The UI with charts will be implemented soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
