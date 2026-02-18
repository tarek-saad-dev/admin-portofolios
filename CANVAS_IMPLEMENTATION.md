# Canvas Module Implementation Guide

## Overview
The Canvas module is a brain-dump to structured nodes to tasks converter for Tarek OS. It uses React Flow for visual node management.

## Status: Foundation Complete ✅

### Completed
- ✅ TypeScript types (`/types/canvas.ts`)
- ✅ Database collection helpers (`/lib/db/task-os-db.ts`)
- ✅ Canvas API route (`/api/os/canvas`)

### Required Installation

```bash
npm install reactflow
# or
yarn add reactflow
# or
pnpm add reactflow
```

## API Routes to Create

### 1. Canvas Detail Route
**File:** `app/api/os/canvas/[canvasId]/route.ts`
```typescript
GET /api/os/canvas/:canvasId
- Returns canvas with all nodes and edges
- Response: { canvas, nodes, edges }
```

### 2. Nodes Routes
**File:** `app/api/os/canvas/[canvasId]/nodes/route.ts`
```typescript
POST /api/os/canvas/:canvasId/nodes
- Create new node
- Body: { title, description?, type?, position, meta? }
```

**File:** `app/api/os/canvas/[canvasId]/nodes/[nodeId]/route.ts`
```typescript
PATCH /api/os/canvas/:canvasId/nodes/:nodeId
- Update node (title, description, position, meta, type)

DELETE /api/os/canvas/:canvasId/nodes/:nodeId
- Delete node and its edges
```

### 3. Edges Routes
**File:** `app/api/os/canvas/[canvasId]/edges/route.ts`
```typescript
POST /api/os/canvas/:canvasId/edges
- Create edge between nodes
- Body: { sourceNodeId, targetNodeId, label? }
```

**File:** `app/api/os/canvas/[canvasId]/edges/[edgeId]/route.ts`
```typescript
DELETE /api/os/canvas/:canvasId/edges/:edgeId
- Delete edge
```

### 4. Convert to Task Route
**File:** `app/api/os/canvas/[canvasId]/nodes/[nodeId]/convert-to-task/route.ts`
```typescript
POST /api/os/canvas/:canvasId/nodes/:nodeId/convert-to-task
- Creates task from node data
- Updates node: linkedTaskId, type="task"
- Returns created task
```

## UI Components to Create

### 1. Custom Node Component
**File:** `components/canvas/custom-node.tsx`
- Display title
- Show "Linked" badge if linkedTaskId exists
- Meta pills: department, priority, estimate
- Handle selection

### 2. Inspector Panel
**File:** `components/canvas/inspector-panel.tsx`
- Right sidebar (shadcn Card)
- Fields: Title, Description, Department, Track, Priority, Estimate
- Actions:
  - Add Child Node
  - Convert to Task
  - Delete Node

### 3. Quick Capture Modal
**File:** `components/canvas/quick-capture-modal.tsx`
- Textarea for multi-line input
- Each line → new node
- Grid layout spawn

### 4. Canvas Toolbar
**File:** `components/canvas/canvas-toolbar.tsx`
- Add Node button
- Quick Capture button
- Fit View button
- Save indicator

### 5. Main Canvas Page
**File:** `app/admin/os/canvas/page.tsx`
- React Flow canvas (left)
- Inspector panel (right)
- Toolbar (top)
- Load/save nodes and edges
- Handle drag, connect, select

## Database Indexes to Add

Add to `lib/db/task-os-db.ts` in `createIndexes()`:

```typescript
// Canvas indexes
await db.collection("canvas").createIndexes([
  { key: { createdAt: -1 } },
  { key: { updatedAt: -1 } },
]);

// Canvas nodes indexes
await db.collection("canvas_nodes").createIndexes([
  { key: { canvasId: 1 } },
  { key: { type: 1 } },
  { key: { linkedTaskId: 1 } },
]);

// Canvas edges indexes
await db.collection("canvas_edges").createIndexes([
  { key: { canvasId: 1 } },
  { key: { sourceNodeId: 1 } },
  { key: { targetNodeId: 1 } },
]);
```

## Navigation

Add to `app/admin/os/layout.tsx` navigation array:

```typescript
{
  name: "Canvas",
  href: "/admin/os/canvas",
  icon: Network, // from lucide-react
  description: "Brain-dump to structured tasks"
}
```

## React Flow Integration Example

```typescript
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Convert CanvasNode to ReactFlow node
const toReactFlowNode = (node: CanvasNode): ReactFlowNode => ({
  id: node._id!.toString(),
  type: 'custom',
  position: node.position,
  data: {
    label: node.title,
    node: node,
  },
});

// In component
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

const onConnect = useCallback(
  (params) => setEdges((eds) => addEdge(params, eds)),
  [setEdges]
);
```

## MVP Acceptance Criteria

- [ ] Create/edit/move/connect nodes
- [ ] Persist nodes + edges to MongoDB
- [ ] Convert node to task (appears in tasks DB)
- [ ] Reload page restores positions and links
- [ ] Quick capture creates multiple nodes
- [ ] Inspector panel shows/edits node details
- [ ] Visual feedback for linked tasks

## Next Steps

1. Install `reactflow` package
2. Create remaining API routes (nodes, edges, convert-to-task)
3. Create UI components (custom node, inspector, toolbar)
4. Create main Canvas page with React Flow
5. Add Canvas to sidebar navigation
6. Test full workflow: brain-dump → nodes → convert → tasks

## Notes

- Keep MVP simple: save on onDragStop, onConnect, onInspectorSave
- No planning/weekly integration in this phase
- Focus on core functionality first
- Use existing shadcn/ui components for consistency
