"use client";

import { PathAnalysis } from "@/lib/canvas/path-analyzer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap,
  Target,
  GitBranch,
  X
} from "lucide-react";

interface PathAnalysisPanelProps {
  analysis: PathAnalysis;
  onClose: () => void;
  onConvertToTasks?: () => void;
}

export function PathAnalysisPanel({ analysis, onClose, onConvertToTasks }: PathAnalysisPanelProps) {
  const getRecommendationColor = () => {
    switch (analysis.recommendation) {
      case "strong":
        return "text-green-600 bg-green-50 border-green-200";
      case "needs-simplification":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "risky":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const getRecommendationIcon = () => {
    switch (analysis.recommendation) {
      case "strong":
        return <CheckCircle2 className="h-5 w-5" />;
      case "needs-simplification":
        return <AlertTriangle className="h-5 w-5" />;
      case "risky":
        return <TrendingDown className="h-5 w-5" />;
    }
  };

  const getRecommendationText = () => {
    switch (analysis.recommendation) {
      case "strong":
        return "🟢 Strong Execution Path";
      case "needs-simplification":
        return "🟡 Needs Simplification";
      case "risky":
        return "🔴 Overcomplicated / Risky";
    }
  };

  const getComplexityColor = () => {
    switch (analysis.complexityLevel) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
    }
  };

  const getImpactEffortInsight = () => {
    const ratio = analysis.impactEffortRatio;
    if (ratio < 0.5) return { text: "High Effort – Low Impact", icon: "⚠️", color: "text-red-600" };
    if (ratio >= 1.5) return { text: "Lean & High Leverage", icon: "🚀", color: "text-green-600" };
    return { text: "Balanced Strategy", icon: "✓", color: "text-blue-600" };
  };

  const impactEffortInsight = getImpactEffortInsight();

  return (
    <div className="w-96 border-l bg-background h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Path Analysis</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Score */}
        <Card className={`p-4 border-2 ${getRecommendationColor()}`}>
          <div className="flex items-center gap-3 mb-2">
            {getRecommendationIcon()}
            <span className="font-semibold">{getRecommendationText()}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Score</span>
              <span className="text-2xl font-bold">{analysis.score}/100</span>
            </div>
            <Progress value={analysis.score} className="h-2" />
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <GitBranch className="h-4 w-4" />
              <span>Total Steps</span>
            </div>
            <p className="text-2xl font-bold">{analysis.totalSteps}</p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span>Est. Time</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.round(analysis.totalEstimatedTime / 60)}h
            </p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span>Effort</span>
            </div>
            <p className="text-2xl font-bold">{analysis.totalEffort || "—"}</p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span>Impact</span>
            </div>
            <p className="text-2xl font-bold">{analysis.totalImpact || "—"}</p>
          </Card>
        </div>

        {/* Complexity */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-2">Complexity Level</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getComplexityColor()}`}
                style={{
                  width:
                    analysis.complexityLevel === "low"
                      ? "33%"
                      : analysis.complexityLevel === "medium"
                      ? "66%"
                      : "100%",
                }}
              />
            </div>
            <Badge variant="outline" className="capitalize">
              {analysis.complexityLevel}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {analysis.dependencyCount} dependencies • {analysis.optionalBranches} branches
          </div>
        </Card>

        {/* Impact vs Effort */}
        {(analysis.totalEffort > 0 || analysis.totalImpact > 0) && (
          <Card className="p-4">
            <h4 className="text-sm font-semibold mb-2">Impact vs Effort</h4>
            <div className={`flex items-center gap-2 ${impactEffortInsight.color} font-medium`}>
              <span>{impactEffortInsight.icon}</span>
              <span>{impactEffortInsight.text}</span>
            </div>
            {analysis.impactEffortRatio > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Ratio: {analysis.impactEffortRatio.toFixed(2)}
              </p>
            )}
          </Card>
        )}

        {/* Bottlenecks */}
        {analysis.bottlenecks.length > 0 && (
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h4 className="text-sm font-semibold text-orange-900">
                Bottlenecks Detected
              </h4>
            </div>
            <ul className="space-y-1 text-sm">
              {analysis.bottlenecks.map((bn, idx) => (
                <li key={idx} className="text-orange-800">
                  • {bn.node.title}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Score Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(analysis.scoreBreakdown).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">
                    {key.replace("Score", "").replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-medium">{Math.round(value)}/100</span>
                </div>
                <Progress value={value} className="h-1" />
              </div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold mb-2 text-blue-900">Insights</h4>
          <ul className="space-y-2">
            {analysis.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {onConvertToTasks && (
            <Button
              onClick={onConvertToTasks}
              className="w-full"
              variant={analysis.recommendation === "strong" ? "default" : "outline"}
            >
              {analysis.recommendation === "strong"
                ? "Convert to Tasks"
                : "Convert Anyway"}
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className="w-full">
            Refine Path
          </Button>
        </div>
      </div>
    </div>
  );
}
