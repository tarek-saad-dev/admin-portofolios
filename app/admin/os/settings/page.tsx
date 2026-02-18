"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage departments, tracks, and system preferences</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings - Coming Soon
          </CardTitle>
          <CardDescription>
            This page will allow you to customize your Task OS system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Planned Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create, edit, and delete departments</li>
              <li>Create, edit, and delete tracks</li>
              <li>Drag to reorder departments</li>
              <li>Customize department colors and icons</li>
              <li>Set default values for new tasks</li>
              <li>Configure week start day (Sunday/Monday)</li>
              <li>Export/import data</li>
              <li>System preferences and defaults</li>
            </ul>
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              The system is pre-configured with 4 departments and 2 tracks each. Settings UI coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
