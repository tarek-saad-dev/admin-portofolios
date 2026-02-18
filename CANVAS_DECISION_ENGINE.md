# Canvas Decision Engine - Implementation Guide

## 🎯 Overview

The Canvas has been transformed from a simple brainstorming tool into an **intelligent Decision Engine** that helps evaluate execution paths before converting them into tasks.

## ✅ Completed Components

### 1. Path Analyzer Service (`lib/canvas/path-analyzer.ts`)

**Core Intelligence Engine** that provides:

- **Path Traversal**: Forward traversal from any starting node
- **Metrics Calculation**: Steps, time, effort, impact, dependencies, branches
- **Bottleneck Detection**: Identifies nodes with high connections, time, or effort
- **Complexity Scoring**: Low/Medium/High based on multiple factors
- **Path Scoring**: 0-100 score with detailed breakdown
- **Impact/Effort Analysis**: Calculates ratio and provides insights
- **Branch Comparison**: Side-by-side analysis of two paths
- **Insight Generation**: Human-readable recommendations

**Key Methods:**
```typescript
traversePath(startNodeId: string): PathNode[]
analyzePath(startNodeId: string): PathAnalysis
comparePaths(nodeId1: string, nodeId2: string): BranchComparison
```

### 2. Enhanced Data Model (`types/canvas.ts`)

**Added to CanvasNode.meta:**
- `effort?: number` (1-5 scale)
- `impact?: number` (1-5 scale)
- `width?: number` (for resizable nodes)
- `height?: number` (for resizable nodes)
- `taskStatus?: string` (for tracking completion)

### 3. Path Analysis Panel (`components/canvas/path-analysis-panel.tsx`)

**Beautiful UI Component** featuring:

- **Overall Score Display**: 0-100 with color-coded recommendation
  - 🟢 Strong Execution Path (75+)
  - 🟡 Needs Simplification (60-74)
  - 🔴 Overcomplicated / Risky (<60)

- **Key Metrics Grid**:
  - Total Steps
  - Estimated Time
  - Total Effort
  - Total Impact

- **Complexity Visualization**: Progress bar with Low/Medium/High levels

- **Impact vs Effort Analysis**:
  - ⚠️ High Effort – Low Impact (ratio < 0.5)
  - ✓ Balanced Strategy (0.5-1.5)
  - 🚀 Lean & High Leverage (ratio > 1.5)

- **Bottleneck Alerts**: Lists nodes creating bottlenecks

- **Score Breakdown**: Visual breakdown of 5 scoring factors

- **Actionable Insights**: Clear, non-technical recommendations

- **Action Buttons**: Convert to Tasks or Refine Path

## 🚧 Integration Needed

To complete the Decision Engine, integrate into Canvas page:

### Step 1: Add State Management

```typescript
const [pathAnalysis, setPathAnalysis] = useState<PathAnalysis | null>(null);
const [showAnalysis, setShowAnalysis] = useState(false);
```

### Step 2: Add Simulate Path Function

```typescript
const simulatePath = () => {
  if (!selectedNode) return;
  
  const analyzer = new PathAnalyzer(
    Array.from(canvasNodes.values()),
    edges.map(e => e.data.edge)
  );
  
  const analysis = analyzer.analyzePath(selectedNode._id!.toString());
  setPathAnalysis(analysis);
  setShowAnalysis(true);
};
```

### Step 3: Add UI Button (in Inspector Panel)

```typescript
{selectedNode && !selectedNode.linkedTaskId && (
  <Button onClick={simulatePath} className="w-full" variant="outline">
    <Zap className="h-4 w-4 mr-2" />
    Simulate Path
  </Button>
)}
```

### Step 4: Render Analysis Panel

```typescript
{showAnalysis && pathAnalysis && (
  <PathAnalysisPanel
    analysis={pathAnalysis}
    onClose={() => setShowAnalysis(false)}
    onConvertToTasks={() => {
      convertPathToTasks();
      setShowAnalysis(false);
    }}
  />
)}
```

## 📊 Scoring Algorithm

### Score Components (each 0-100):

1. **Steps Score**: Ideal 3-7 steps
   - ≤3 steps: 70
   - 4-7 steps: 100
   - >7 steps: Decreases by 10 per extra step

2. **Time Score**: Ideal <4 hours
   - ≤240 min: 100
   - >240 min: Decreases by 10 per extra hour

3. **Dependency Score**: Fewer is better
   - 0 dependencies: 100
   - Decreases by 20 per dependency

4. **Branch Score**: Some OK, too many bad
   - ≤2 branches: 100
   - Decreases by 15 per extra branch

5. **Ending Score**: Clear ending preferred
   - No dead ends: 100
   - Has dead ends: 50

**Final Score** = Average of all 5 components

## 🎨 User Experience Flow

```
1. User builds path in Canvas
   ↓
2. Selects starting node
   ↓
3. Clicks "Simulate Path"
   ↓
4. System analyzes:
   - Traverses connected nodes
   - Calculates metrics
   - Detects bottlenecks
   - Generates score & insights
   ↓
5. Analysis panel appears with:
   - Visual score (0-100)
   - Recommendation (Strong/Simplify/Risky)
   - Key metrics
   - Bottleneck warnings
   - Impact/Effort analysis
   - Actionable insights
   ↓
6. User decides:
   - Convert to Tasks (if strong)
   - Refine Path (if needs work)
   - Test alternatives
```

## 🔥 Advanced Features (Ready to Implement)

### Branch Comparison

```typescript
const compareBranches = (nodeId1: string, nodeId2: string) => {
  const analyzer = new PathAnalyzer(
    Array.from(canvasNodes.values()),
    edges.map(e => e.data.edge)
  );
  
  const comparison = analyzer.comparePaths(nodeId1, nodeId2);
  // Show comparison modal
};
```

### Sandbox Mode

Already built into analysis - it doesn't modify any state until user confirms conversion.

### Bottleneck Highlighting

```typescript
// In node rendering, check if node is bottleneck
const isBottleneck = pathAnalysis?.bottlenecks.some(
  bn => bn.node._id?.toString() === node.id
);

// Apply visual styling
className={isBottleneck ? "border-orange-500 border-4" : ""}
```

## 💡 Insights Examples

The system generates context-aware insights:

- "This path is 40% more complex than necessary."
- "2 nodes are creating bottlenecks."
- "Estimated 8 hours total. Consider breaking into smaller phases."
- "⚠️ High Effort – Low Impact. Reconsider this approach."
- "🚀 Lean & High Leverage strategy detected!"
- "Path contains dead ends. Ensure all branches lead to completion."

## 🎯 Next Steps

1. **Integrate into Canvas Page**: Add simulate button and analysis panel
2. **Add Effort/Impact Inputs**: Allow users to set 1-5 values on nodes
3. **Create Branch Comparison Modal**: Side-by-side path comparison UI
4. **Add Visual Bottleneck Highlighting**: Mark risky nodes on canvas
5. **Implement Keyboard Shortcuts**: Quick access to simulation
6. **Add Export Analysis**: Save analysis as PDF/report

## 🚀 Benefits

**For Users:**
- Make informed decisions before committing to execution
- Identify risks and bottlenecks early
- Compare alternative approaches objectively
- Optimize for impact/effort ratio
- Reduce wasted effort on overcomplicated plans

**For System:**
- Intelligent task creation
- Better resource allocation
- Higher success rates
- Data-driven planning
- Continuous improvement through feedback

---

## 📝 Technical Notes

- **Performance**: Path traversal is O(V+E) where V=nodes, E=edges
- **Scoring**: Transparent algorithm, easy to tune weights
- **Extensibility**: Easy to add new metrics or scoring factors
- **Type Safety**: Full TypeScript coverage
- **No External Dependencies**: Pure logic, no AI/ML required

The Canvas is now a **Strategy Simulator** and **Decision Support System**, not just a drawing tool.
