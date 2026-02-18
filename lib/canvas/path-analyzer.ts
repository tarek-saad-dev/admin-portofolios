import { CanvasNode, CanvasEdge } from "@/types/canvas";

export interface PathNode {
  node: CanvasNode;
  depth: number;
  incomingCount: number;
  outgoingCount: number;
  isBottleneck: boolean;
}

export interface PathAnalysis {
  nodes: PathNode[];
  totalSteps: number;
  totalEstimatedTime: number;
  totalEffort: number;
  totalImpact: number;
  dependencyCount: number;
  optionalBranches: number;
  hasDeadEnds: boolean;
  bottlenecks: PathNode[];
  complexityLevel: "low" | "medium" | "high";
  score: number;
  scoreBreakdown: {
    stepsScore: number;
    timeScore: number;
    dependencyScore: number;
    branchScore: number;
    endingScore: number;
  };
  impactEffortRatio: number;
  recommendation: "strong" | "needs-simplification" | "risky";
  insights: string[];
}

export interface BranchComparison {
  path1: PathAnalysis;
  path2: PathAnalysis;
  stepsDifference: number;
  timeDifference: number;
  complexityDifference: string;
  scoreDifference: number;
  impactEffortDifference: number;
  betterPath: 1 | 2 | "equal";
  insights: string[];
}

export class PathAnalyzer {
  private nodes: Map<string, CanvasNode>;
  private edges: CanvasEdge[];

  constructor(nodes: CanvasNode[], edges: CanvasEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n._id!.toString(), n]));
    this.edges = edges;
  }

  /**
   * Traverse path forward from starting node
   */
  traversePath(startNodeId: string): PathNode[] {
    const visited = new Set<string>();
    const pathNodes: PathNode[] = [];
    const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];

    // Count connections for each node
    const connectionCounts = this.calculateConnectionCounts();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      const node = this.nodes.get(id);
      if (!node) continue;

      const incomingCount = connectionCounts.get(id)?.incoming || 0;
      const outgoingCount = connectionCounts.get(id)?.outgoing || 0;

      // Detect bottlenecks
      const isBottleneck = this.isBottleneck(node, incomingCount, outgoingCount);

      pathNodes.push({
        node,
        depth,
        incomingCount,
        outgoingCount,
        isBottleneck,
      });

      // Find outgoing edges
      const outgoingEdges = this.edges.filter((e) => e.sourceNodeId.toString() === id);
      outgoingEdges.forEach((edge) => {
        const targetId = edge.targetNodeId.toString();
        if (!visited.has(targetId)) {
          queue.push({ id: targetId, depth: depth + 1 });
        }
      });
    }

    return pathNodes;
  }

  /**
   * Analyze a path and generate insights
   */
  analyzePath(startNodeId: string): PathAnalysis {
    const pathNodes = this.traversePath(startNodeId);

    // Calculate metrics
    const totalSteps = pathNodes.length;
    const totalEstimatedTime = pathNodes.reduce(
      (sum, pn) => sum + (pn.node.meta?.estimateMinutes || 0),
      0
    );
    const totalEffort = pathNodes.reduce(
      (sum, pn) => sum + (pn.node.meta?.effort || 0),
      0
    );
    const totalImpact = pathNodes.reduce(
      (sum, pn) => sum + (pn.node.meta?.impact || 0),
      0
    );

    // Count dependencies and branches
    const dependencyCount = pathNodes.filter((pn) => pn.incomingCount > 1).length;
    const optionalBranches = pathNodes.filter((pn) => pn.outgoingCount > 1).length;

    // Detect dead ends
    const hasDeadEnds = pathNodes.some((pn) => pn.outgoingCount === 0 && pn.depth < Math.max(...pathNodes.map((p) => p.depth)));

    // Find bottlenecks
    const bottlenecks = pathNodes.filter((pn) => pn.isBottleneck);

    // Calculate complexity
    const complexityLevel = this.calculateComplexity(totalSteps, dependencyCount, optionalBranches);

    // Calculate score
    const scoreBreakdown = this.calculateScore(totalSteps, totalEstimatedTime, dependencyCount, optionalBranches, hasDeadEnds);
    const score = Math.round(
      (scoreBreakdown.stepsScore +
        scoreBreakdown.timeScore +
        scoreBreakdown.dependencyScore +
        scoreBreakdown.branchScore +
        scoreBreakdown.endingScore) / 5
    );

    // Calculate impact/effort ratio
    const impactEffortRatio = totalEffort > 0 ? totalImpact / totalEffort : 0;

    // Determine recommendation
    const recommendation = this.getRecommendation(score, impactEffortRatio);

    // Generate insights
    const insights = this.generateInsights(
      totalSteps,
      totalEstimatedTime,
      bottlenecks.length,
      optionalBranches,
      impactEffortRatio,
      hasDeadEnds
    );

    return {
      nodes: pathNodes,
      totalSteps,
      totalEstimatedTime,
      totalEffort,
      totalImpact,
      dependencyCount,
      optionalBranches,
      hasDeadEnds,
      bottlenecks,
      complexityLevel,
      score,
      scoreBreakdown,
      impactEffortRatio,
      recommendation,
      insights,
    };
  }

  /**
   * Compare two paths
   */
  comparePaths(startNodeId1: string, startNodeId2: string): BranchComparison {
    const path1 = this.analyzePath(startNodeId1);
    const path2 = this.analyzePath(startNodeId2);

    const stepsDifference = Math.abs(path1.totalSteps - path2.totalSteps);
    const timeDifference = Math.abs(path1.totalEstimatedTime - path2.totalEstimatedTime);
    const scoreDifference = path1.score - path2.score;
    const impactEffortDifference = path1.impactEffortRatio - path2.impactEffortRatio;

    const complexityDifference =
      path1.complexityLevel === path2.complexityLevel
        ? "equal"
        : path1.complexityLevel === "low"
        ? "path1-simpler"
        : path2.complexityLevel === "low"
        ? "path2-simpler"
        : "similar";

    const betterPath: 1 | 2 | "equal" =
      scoreDifference > 10 ? 1 : scoreDifference < -10 ? 2 : "equal";

    const insights = this.generateComparisonInsights(
      path1,
      path2,
      stepsDifference,
      timeDifference,
      betterPath
    );

    return {
      path1,
      path2,
      stepsDifference,
      timeDifference,
      complexityDifference,
      scoreDifference,
      impactEffortDifference,
      betterPath,
      insights,
    };
  }

  /**
   * Calculate connection counts for all nodes
   */
  private calculateConnectionCounts(): Map<string, { incoming: number; outgoing: number }> {
    const counts = new Map<string, { incoming: number; outgoing: number }>();

    this.nodes.forEach((node, id) => {
      counts.set(id, { incoming: 0, outgoing: 0 });
    });

    this.edges.forEach((edge) => {
      const sourceId = edge.sourceNodeId.toString();
      const targetId = edge.targetNodeId.toString();

      const sourceCounts = counts.get(sourceId) || { incoming: 0, outgoing: 0 };
      sourceCounts.outgoing++;
      counts.set(sourceId, sourceCounts);

      const targetCounts = counts.get(targetId) || { incoming: 0, outgoing: 0 };
      targetCounts.incoming++;
      counts.set(targetId, targetCounts);
    });

    return counts;
  }

  /**
   * Detect if a node is a bottleneck
   */
  private isBottleneck(node: CanvasNode, incomingCount: number, outgoingCount: number): boolean {
    const hasHighConnections = incomingCount > 2 || outgoingCount > 2;
    const hasHighTime = (node.meta?.estimateMinutes || 0) > 60;
    const hasHighEffort = (node.meta?.effort || 0) >= 4;

    return hasHighConnections || hasHighTime || hasHighEffort;
  }

  /**
   * Calculate complexity level
   */
  private calculateComplexity(
    steps: number,
    dependencies: number,
    branches: number
  ): "low" | "medium" | "high" {
    const complexityScore = steps * 0.5 + dependencies * 2 + branches * 1.5;

    if (complexityScore < 10) return "low";
    if (complexityScore < 25) return "medium";
    return "high";
  }

  /**
   * Calculate score breakdown (each component 0-100)
   */
  private calculateScore(
    steps: number,
    time: number,
    dependencies: number,
    branches: number,
    hasDeadEnds: boolean
  ) {
    // Steps score (fewer is better, ideal: 3-7 steps)
    const stepsScore = steps <= 3 ? 70 : steps <= 7 ? 100 : Math.max(0, 100 - (steps - 7) * 10);

    // Time score (less time is better, ideal: < 4 hours)
    const timeScore = time <= 240 ? 100 : Math.max(0, 100 - ((time - 240) / 60) * 10);

    // Dependency score (fewer dependencies is better)
    const dependencyScore = dependencies === 0 ? 100 : Math.max(0, 100 - dependencies * 20);

    // Branch score (some branches OK, too many is bad)
    const branchScore = branches <= 2 ? 100 : Math.max(0, 100 - (branches - 2) * 15);

    // Ending score (clear ending is good)
    const endingScore = hasDeadEnds ? 50 : 100;

    return {
      stepsScore,
      timeScore,
      dependencyScore,
      branchScore,
      endingScore,
    };
  }

  /**
   * Get recommendation based on score and impact/effort ratio
   */
  private getRecommendation(score: number, impactEffortRatio: number): "strong" | "needs-simplification" | "risky" {
    if (score >= 75 && impactEffortRatio >= 1) return "strong";
    if (score >= 60 || impactEffortRatio >= 0.8) return "needs-simplification";
    return "risky";
  }

  /**
   * Generate insights
   */
  private generateInsights(
    steps: number,
    time: number,
    bottlenecks: number,
    branches: number,
    impactEffortRatio: number,
    hasDeadEnds: boolean
  ): string[] {
    const insights: string[] = [];

    if (steps > 10) {
      const excess = Math.round(((steps - 7) / steps) * 100);
      insights.push(`This path is ${excess}% more complex than necessary.`);
    }

    if (bottlenecks > 0) {
      insights.push(`${bottlenecks} node${bottlenecks > 1 ? "s are" : " is"} creating bottlenecks.`);
    }

    if (branches > 3) {
      insights.push(`Consider reducing optional branches to simplify execution.`);
    }

    if (time > 480) {
      const hours = Math.round(time / 60);
      insights.push(`Estimated ${hours} hours total. Consider breaking into smaller phases.`);
    }

    if (impactEffortRatio < 0.5) {
      insights.push(`⚠️ High Effort – Low Impact. Reconsider this approach.`);
    } else if (impactEffortRatio >= 1.5) {
      insights.push(`🚀 Lean & High Leverage strategy detected!`);
    } else if (impactEffortRatio >= 0.8) {
      insights.push(`Balanced Strategy with good impact/effort ratio.`);
    }

    if (hasDeadEnds) {
      insights.push(`Path contains dead ends. Ensure all branches lead to completion.`);
    }

    if (insights.length === 0) {
      insights.push(`Clean execution path with no major concerns.`);
    }

    return insights;
  }

  /**
   * Generate comparison insights
   */
  private generateComparisonInsights(
    path1: PathAnalysis,
    path2: PathAnalysis,
    stepsDiff: number,
    timeDiff: number,
    betterPath: 1 | 2 | "equal"
  ): string[] {
    const insights: string[] = [];

    if (betterPath === "equal") {
      insights.push("Both paths are equally viable.");
    } else {
      const better = betterPath === 1 ? "Path 1" : "Path 2";
      insights.push(`${better} is the recommended choice.`);
    }

    if (stepsDiff > 3) {
      const fewer = path1.totalSteps < path2.totalSteps ? "Path 1" : "Path 2";
      insights.push(`${fewer} has ${stepsDiff} fewer steps.`);
    }

    if (timeDiff > 120) {
      const faster = path1.totalEstimatedTime < path2.totalEstimatedTime ? "Path 1" : "Path 2";
      const hours = Math.round(timeDiff / 60);
      insights.push(`${faster} saves approximately ${hours} hours.`);
    }

    if (Math.abs(path1.impactEffortRatio - path2.impactEffortRatio) > 0.3) {
      const better = path1.impactEffortRatio > path2.impactEffortRatio ? "Path 1" : "Path 2";
      insights.push(`${better} has better impact/effort ratio.`);
    }

    return insights;
  }
}
