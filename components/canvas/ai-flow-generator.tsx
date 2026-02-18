"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, X, RefreshCw, Edit, Check, ChevronDown, ChevronUp } from "lucide-react";

interface AINode {
  title: string;
  description: string;
  estimateMinutes: number;
  effort: number;
  impact: number;
  tags?: string[];
}

interface AIPlan {
  planTitle: string;
  estimatedTotalMinutes: number;
  nodes: AINode[];
}

interface AIFlowGeneratorProps {
  onInsertFlow: (plan: AIPlan) => void;
}

export function AIFlowGenerator({ onInsertFlow }: AIFlowGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"quick" | "detailed" | "checklist">("quick");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateFlow = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flow");
      }

      setPlan(data.plan);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate flow");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (plan) {
      onInsertFlow(plan);
      setPlan(null);
      setPrompt("");
      setShowPreview(false);
    }
  };

  const handleRegenerate = () => {
    setPlan(null);
    setShowPreview(false);
    generateFlow();
  };

  const handleEditPrompt = () => {
    setPlan(null);
    setShowPreview(false);
  };

  const getTotalTime = () => {
    if (!plan) return "";
    const hours = Math.floor(plan.estimatedTotalMinutes / 60);
    const minutes = plan.estimatedTotalMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-3">
      {/* AI Input Bar */}
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generateFlow();
              }
            }}
            placeholder="اكتب المهمة بشكل تفصيلي… / Describe the task in detail…"
            className="flex-1 border-none bg-white/80 focus-visible:ring-purple-400"
            disabled={loading}
          />
          <Select value={mode} onValueChange={(v: any) => setMode(v)}>
            <SelectTrigger className="w-32 border-purple-200 bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick Plan</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="checklist">Checklist</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={generateFlow}
            disabled={loading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Preview Panel */}
      {showPreview && plan && (
        <Card className="p-4 border-2 border-purple-200 bg-white">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900">
                  {plan.planTitle}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">{plan.nodes.length} steps</Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">~{getTotalTime()}</Badge>
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlan(null);
                  setShowPreview(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Steps Preview */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plan.nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg bg-purple-50/50 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{node.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {node.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {node.estimateMinutes}m
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Effort: {node.effort}/5
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Impact: {node.impact}/5
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                onClick={handleInsert}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Insert into Canvas
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleEditPrompt}
                variant="outline"
                size="sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            {/* Smart Options */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setPrompt(`Make this plan simpler and merge steps: ${prompt}`);
                  handleRegenerate();
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Make it Smaller
              </Button>
              <Button
                onClick={() => {
                  setPrompt(`Make this plan more detailed with sub-steps: ${prompt}`);
                  handleRegenerate();
                }}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Make it More Detailed
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
