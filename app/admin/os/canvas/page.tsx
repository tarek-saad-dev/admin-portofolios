"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb, Network as NetworkIcon } from "lucide-react";
import Link from "next/link";

export default function CanvasPage() {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanvases();
  }, []);

  const fetchCanvases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/os/canvas");
      const data = await res.json();
      if (data.success) {
        setCanvases(data.data);
      }
    } catch (error) {
      console.error("Error fetching canvases:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewCanvas = async () => {
    try {
      const res = await fetch("/api/os/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Canvas ${new Date().toLocaleDateString()}` }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCanvases();
      }
    } catch (error) {
      console.error("Error creating canvas:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canvas</h1>
          <p className="text-muted-foreground">
            Brain-dump ideas and convert them to structured tasks
          </p>
        </div>
        <Button onClick={createNewCanvas}>
          <Plus className="h-4 w-4 mr-2" />
          New Canvas
        </Button>
      </div>

      {/* Canvas List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading canvases...</p>
          </CardContent>
        </Card>
      ) : canvases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <NetworkIcon className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No Canvases Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first canvas to start brain-dumping ideas
              </p>
              <Button onClick={createNewCanvas}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Canvas
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {canvases.map((canvas) => (
            <Link key={canvas._id} href={`/admin/os/canvas/${canvas._id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {canvas.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Created: {new Date(canvas.createdAt).toLocaleDateString()}</p>
                    <p>Updated: {new Date(canvas.updatedAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How Canvas Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <p><strong>Brain-dump:</strong> Create nodes for ideas, tasks, or groups</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <p><strong>Connect:</strong> Draw edges between related nodes</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <p><strong>Convert:</strong> Transform nodes into actionable tasks</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <p><strong>Plan:</strong> Schedule tasks directly from Canvas to Weekly Planner</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
