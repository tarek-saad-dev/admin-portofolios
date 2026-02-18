"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Zap, GitBranch, ListTree } from "lucide-react";
import Link from "next/link";
import { CanvasNode, CanvasEdge, Canvas } from "@/types/canvas";
import { TaskPlanningControls } from "@/components/canvas/task-planning-controls";
import BrainstormNode from "@/components/canvas/brainstorm-node";
import { QuickCaptureModal } from "@/components/canvas/quick-capture-modal";
import { PathAnalyzer, PathAnalysis } from "@/lib/canvas/path-analyzer";
import { PathAnalysisPanel } from "@/components/canvas/path-analysis-panel";
import { AIFlowGenerator } from "@/components/canvas/ai-flow-generator";

const nodeTypes = {
  brainstorm: BrainstormNode,
};

export default function CanvasDetailPage() {
  const params = useParams();
  const canvasId = params.canvasId as string;

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [canvasNodes, setCanvasNodes] = useState<Map<string, CanvasNode>>(new Map());
  const [pathAnalysis, setPathAnalysis] = useState<PathAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchCanvas();
  }, [canvasId]);

  const updateNodeData = async (nodeId: string, updates: Partial<CanvasNode>) => {
    try {
      const res = await fetch(`/api/os/canvas/${canvasId}/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, label: data.data.title, node: data.data } }
              : node
          )
        );

        // Update canvas nodes map
        setCanvasNodes((prev) => {
          const newMap = new Map(prev);
          newMap.set(nodeId, data.data);
          return newMap;
        });

        if (selectedNode?._id?.toString() === nodeId) {
          setSelectedNode(data.data);
        }
      }
    } catch (error) {
      console.error("Error updating node:", error);
    }
  };

  const fetchCanvas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/os/canvas/${canvasId}`);
      const data = await res.json();

      if (data.success) {
        setCanvas(data.data.canvas);

        // Store canvas nodes in map for quick lookup
        const nodesMap = new Map<string, CanvasNode>();
        data.data.nodes.forEach((node: CanvasNode) => {
          nodesMap.set(node._id!.toString(), node);
        });
        setCanvasNodes(nodesMap);

        // Convert canvas nodes to React Flow nodes
        const flowNodes: Node[] = data.data.nodes.map((node: CanvasNode) => ({
          id: node._id!.toString(),
          type: "brainstorm", // Use custom node type
          position: node.position,
          data: {
            label: node.title,
            node: node,
            onUpdate: updateNodeData, // Pass update callback
          },
          style: {
            width: node.meta?.width || 200,
            height: node.meta?.height || 80,
          },
        }));

        // Convert canvas edges to React Flow edges
        const flowEdges: Edge[] = data.data.edges.map((edge: CanvasEdge) => ({
          id: edge._id!.toString(),
          source: edge.sourceNodeId.toString(),
          target: edge.targetNodeId.toString(),
          label: edge.label,
          type: edge.label ? "default" : "smoothstep",
          animated: edge.label === "next",
          data: { edge },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (error) {
      console.error("Error fetching canvas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Save position changes
      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            updateNodePosition(change.id, change.position);
          }
        }
      });
    },
    [nodes, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      // Handle edge removal
      changes.forEach((change) => {
        if (change.type === "remove") {
          deleteEdge(change.id);
        }
      });
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      try {
        const res = await fetch(`/api/os/canvas/${canvasId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceNodeId: connection.source,
            targetNodeId: connection.target,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const newEdge: Edge = {
            id: data.data._id.toString(),
            source: connection.source!,
            target: connection.target!,
            data: { edge: data.data },
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }
      } catch (error) {
        console.error("Error creating edge:", error);
      }
    },
    [canvasId, setEdges]
  );

  const updateNodePosition = async (nodeId: string, position: { x: number; y: number }) => {
    try {
      await fetch(`/api/os/canvas/${canvasId}/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
    } catch (error) {
      console.error("Error updating node position:", error);
    }
  };

  const deleteEdge = async (edgeId: string) => {
    try {
      await fetch(`/api/os/canvas/${canvasId}/edges/${edgeId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting edge:", error);
    }
  };

  const addNewNode = async () => {
    try {
      const res = await fetch(`/api/os/canvas/${canvasId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Node",
          description: "",
          type: "idea",
          position: { x: Math.random() * 400, y: Math.random() * 400 },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newNode: Node = {
          id: data.data._id.toString(),
          type: "brainstorm", // Use custom node type
          position: data.data.position,
          data: {
            label: data.data.title,
            node: data.data,
            onUpdate: updateNodeData, // Pass update callback
          },
        };
        setNodes((nds) => [...nds, newNode]);
        setCanvasNodes((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.data._id.toString(), data.data);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Error creating node:", error);
    }
  };

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data.node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const deleteSelectedNode = async () => {
    if (!selectedNode) return;

    try {
      await fetch(`/api/os/canvas/${canvasId}/nodes/${selectedNode._id}`, {
        method: "DELETE",
      });

      setNodes((nds) => nds.filter((n) => n.id !== selectedNode._id!.toString()));
      setSelectedNode(null);
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  };

  const simulatePath = () => {
    if (!selectedNode) return;

    const analyzer = new PathAnalyzer(
      Array.from(canvasNodes.values()),
      edges.map((e) => e.data.edge).filter(Boolean)
    );

    const analysis = analyzer.analyzePath(selectedNode._id!.toString());
    setPathAnalysis(analysis);
    setShowAnalysis(true);
  };

  const convertToTask = async () => {
    if (!selectedNode) return;

    try {
      setSaving(true);
      const res = await fetch(
        `/api/os/canvas/${canvasId}/nodes/${selectedNode._id}/convert-to-task`,
        { method: "POST" }
      );

      const data = await res.json();
      if (data.success) {
        // Refresh canvas to get updated node with linkedTaskId
        await fetchCanvas();
        alert("Node converted to task successfully!");
      }
    } catch (error) {
      console.error("Error converting to task:", error);
      alert("Failed to convert node to task");
    } finally {
      setSaving(false);
    }
  };

  const convertPathToTasks = async () => {
    if (!pathAnalysis) return;

    try {
      setSaving(true);
      // Convert each node in the path that isn't already a task
      for (const pathNode of pathAnalysis.nodes) {
        const node = pathNode.node;
        if (!node.linkedTaskId) {
          await fetch(`/api/os/canvas/${canvasId}/nodes/${node._id}/convert-to-task`, {
            method: "POST",
          });
        }
      }
      await fetchCanvas();
      setShowAnalysis(false);
      alert(`Converted ${pathAnalysis.nodes.filter(n => !n.node.linkedTaskId).length} nodes to tasks!`);
    } catch (error) {
      console.error("Error converting path to tasks:", error);
      alert("Failed to convert path to tasks");
    } finally {
      setSaving(false);
    }
  };

  const handleInsertAIFlow = async (plan: any) => {
    try {
      setSaving(true);
      const createdNodes: any[] = [];
      const spacing = 250; // Horizontal spacing between nodes
      const startX = 100;
      const startY = 200;

      // Create all nodes
      for (let i = 0; i < plan.nodes.length; i++) {
        const aiNode = plan.nodes[i];
        const res = await fetch(`/api/os/canvas/${canvasId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: aiNode.title,
            description: aiNode.description,
            type: "idea",
            position: {
              x: startX + i * spacing,
              y: startY,
            },
            meta: {
              estimateMinutes: aiNode.estimateMinutes,
              effort: aiNode.effort,
              impact: aiNode.impact,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          createdNodes.push(data.data);
        }
      }

      // Create edges to connect nodes in sequence
      for (let i = 0; i < createdNodes.length - 1; i++) {
        await fetch(`/api/os/canvas/${canvasId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceNodeId: createdNodes[i]._id.toString(),
            targetNodeId: createdNodes[i + 1]._id.toString(),
            label: "next",
          }),
        });
      }

      // Refresh canvas to show new nodes and edges
      await fetchCanvas();
      alert(`✨ Created ${createdNodes.length} connected nodes from AI plan!`);
    } catch (error) {
      console.error("Error inserting AI flow:", error);
      alert("Failed to insert AI flow into canvas");
    } finally {
      setSaving(false);
    }
  };

  // Handle not found state only
  if (!loading && !canvas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Canvas not found</p>
          <Link href="/admin/os/canvas">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Canvases
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* DEBUG MARKER */}
      <div className="bg-green-500 text-white p-2 text-center font-bold">
        AI FLOW GENERATOR MOUNTED ✅
      </div>

      {/* Header */}
      <div className="border-b bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/os/canvas">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{canvas?.title || "Loading..."}</h1>
              <p className="text-sm text-muted-foreground">
                {nodes.length} nodes, {edges.length} connections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={addNewNode} size="sm" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </div>
        </div>

        {/* AI Flow Generator */}
        <AIFlowGenerator onInsertFlow={handleInsertAIFlow} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading canvas...</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          )}
        </div>

        {/* Inspector Panel or Path Analysis Panel */}
        {showAnalysis && pathAnalysis ? (
          <PathAnalysisPanel
            analysis={pathAnalysis}
            onClose={() => setShowAnalysis(false)}
            onConvertToTasks={convertPathToTasks}
          />
        ) : selectedNode ? (
          <div className="w-80 border-l bg-background p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Node Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>
                    <p className="font-medium">{selectedNode.title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{selectedNode.type}</p>
                  </div>
                  {selectedNode.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <p>{selectedNode.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t">
                {/* Decision Engine - Simulate Path */}
                <Button
                  onClick={simulatePath}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Simulate Path
                </Button>

                {!selectedNode.linkedTaskId ? (
                  <Button
                    onClick={convertToTask}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Converting..." : "Convert to Task"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      ✓ Linked to Task
                    </div>
                    <TaskPlanningControls
                      taskId={selectedNode.linkedTaskId.toString()}
                      onTaskUpdated={fetchCanvas}
                    />
                  </div>
                )}

                <Button
                  onClick={deleteSelectedNode}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
