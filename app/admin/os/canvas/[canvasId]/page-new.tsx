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
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Zap, GitBranch, ListTree, Target } from "lucide-react";
import Link from "next/link";
import { CanvasNode, CanvasEdge, Canvas } from "@/types/canvas";
import { TaskPlanningControls } from "@/components/canvas/task-planning-controls";
import BrainstormNode from "@/components/canvas/brainstorm-node";
import { QuickCaptureModal } from "@/components/canvas/quick-capture-modal";

const nodeTypes = {
  brainstorm: BrainstormNode,
};

export default function CanvasDetailPage() {
  const params = useParams();
  const canvasId = params.canvasId as string;
  const { fitView } = useReactFlow();

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [canvasNodes, setCanvasNodes] = useState<Map<string, CanvasNode>>(new Map());

  useEffect(() => {
    fetchCanvas();
  }, [canvasId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNode) return;

      // Tab = Add child node
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        addChildNode();
      }

      // Shift + Enter = Add next step
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        addNextStepNode();
      }

      // Enter = Start editing (if not already editing)
      if (e.key === "Enter" && !e.shiftKey) {
        // Node component handles this
      }

      // Delete = Delete node
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          deleteSelectedNode();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, nodes]);

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
          type: "brainstorm",
          position: node.position,
          data: {
            label: node.title,
            node: node,
            onUpdate: updateNodeData,
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

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      // Save position and size changes
      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          updateNodeData(change.id, { position: change.position });
        }
        if (change.type === "dimensions" && change.dimensions) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            updateNodeData(change.id, {
              meta: {
                ...node.data.node.meta,
                width: change.dimensions.width,
                height: change.dimensions.height,
              },
            });
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
            label: "next",
          }),
        });

        const data = await res.json();
        if (data.success) {
          const newEdge: Edge = {
            id: data.data._id.toString(),
            source: connection.source!,
            target: connection.target!,
            label: "next",
            animated: true,
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

  const deleteEdge = async (edgeId: string) => {
    try {
      await fetch(`/api/os/canvas/${canvasId}/edges/${edgeId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting edge:", error);
    }
  };

  const addNewNode = async (position?: { x: number; y: number }) => {
    try {
      const pos = position || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      };

      const res = await fetch(`/api/os/canvas/${canvasId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Node",
          description: "",
          type: "idea",
          position: pos,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newNode: Node = {
          id: data.data._id.toString(),
          type: "brainstorm",
          position: data.data.position,
          data: {
            label: data.data.title,
            node: data.data,
            onUpdate: updateNodeData,
          },
        };
        setNodes((nds) => [...nds, newNode]);
        setCanvasNodes((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.data._id.toString(), data.data);
          return newMap;
        });
        return data.data;
      }
    } catch (error) {
      console.error("Error creating node:", error);
    }
  };

  const addChildNode = async () => {
    if (!selectedNode) return;

    const parentNode = nodes.find((n) => n.id === selectedNode._id!.toString());
    if (!parentNode) return;

    const childPosition = {
      x: parentNode.position.x + 300,
      y: parentNode.position.y,
    };

    const newNode = await addNewNode(childPosition);
    if (newNode) {
      // Create edge from parent to child
      await fetch(`/api/os/canvas/${canvasId}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceNodeId: selectedNode._id!.toString(),
          targetNodeId: newNode._id.toString(),
          label: "next",
        }),
      });

      // Refresh to get the new edge
      fetchCanvas();
    }
  };

  const addNextStepNode = async () => {
    if (!selectedNode) return;

    const parentNode = nodes.find((n) => n.id === selectedNode._id!.toString());
    if (!parentNode) return;

    const nextPosition = {
      x: parentNode.position.x + 300,
      y: parentNode.position.y,
    };

    const newNode = await addNewNode(nextPosition);
    if (newNode) {
      // Create edge
      await fetch(`/api/os/canvas/${canvasId}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceNodeId: selectedNode._id!.toString(),
          targetNodeId: newNode._id.toString(),
          label: "next",
        }),
      });

      fetchCanvas();
    }
  };

  const handleQuickCapture = async (lines: string[], asChain: boolean) => {
    try {
      const createdNodes: CanvasNode[] = [];

      for (let i = 0; i < lines.length; i++) {
        const position = {
          x: 100 + (asChain ? i * 250 : (i % 3) * 250),
          y: 100 + (asChain ? 0 : Math.floor(i / 3) * 150),
        };

        const res = await fetch(`/api/os/canvas/${canvasId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lines[i],
            description: "",
            type: "idea",
            position,
          }),
        });

        const data = await res.json();
        if (data.success) {
          createdNodes.push(data.data);
        }
      }

      // Create edges if chain mode
      if (asChain && createdNodes.length > 1) {
        for (let i = 0; i < createdNodes.length - 1; i++) {
          await fetch(`/api/os/canvas/${canvasId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceNodeId: createdNodes[i]._id!.toString(),
              targetNodeId: createdNodes[i + 1]._id!.toString(),
              label: "next",
            }),
          });
        }
      }

      // Refresh canvas
      await fetchCanvas();
      setTimeout(() => fitView({ duration: 500 }), 100);
    } catch (error) {
      console.error("Error in quick capture:", error);
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

  const convertToTask = async (nodeId?: string) => {
    const targetNode = nodeId ? canvasNodes.get(nodeId) : selectedNode;
    if (!targetNode) return;

    try {
      setSaving(true);
      const res = await fetch(
        `/api/os/canvas/${canvasId}/nodes/${targetNode._id}/convert-to-task`,
        { method: "POST" }
      );

      const data = await res.json();
      if (data.success) {
        await fetchCanvas();
        alert(`"${targetNode.title}" converted to task successfully!`);
      }
    } catch (error) {
      console.error("Error converting to task:", error);
      alert("Failed to convert node to task");
    } finally {
      setSaving(false);
    }
  };

  const convertPathToTasks = async () => {
    if (!selectedNode) return;

    // Find all nodes connected forward from selected node
    const connectedNodes: string[] = [selectedNode._id!.toString()];
    const visited = new Set<string>();
    const queue = [selectedNode._id!.toString()];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Find outgoing edges
      const outgoingEdges = edges.filter((e) => e.source === currentId);
      outgoingEdges.forEach((edge) => {
        if (!visited.has(edge.target)) {
          connectedNodes.push(edge.target);
          queue.push(edge.target);
        }
      });
    }

    // Convert each node that isn't already a task
    for (const nodeId of connectedNodes) {
      const node = canvasNodes.get(nodeId);
      if (node && !node.linkedTaskId) {
        await convertToTask(nodeId);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading canvas...</p>
      </div>
    );
  }

  if (!canvas) {
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
      {/* Header */}
      <div className="border-b bg-background p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/os/canvas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{canvas.title}</h1>
            <p className="text-sm text-muted-foreground">
              {nodes.length} nodes, {edges.length} connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setQuickCaptureOpen(true)} size="sm" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Quick Capture
          </Button>
          <Button onClick={addNewNode} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {selectedNode && (
        <div className="bg-muted/50 px-4 py-2 text-xs flex items-center gap-4 border-b">
          <Badge variant="secondary">Tab</Badge>
          <span>Add Child</span>
          <Badge variant="secondary">Shift+Enter</Badge>
          <span>Add Next Step</span>
          <Badge variant="secondary">Enter</Badge>
          <span>Edit</span>
          <Badge variant="secondary">Delete</Badge>
          <span>Remove</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 relative">
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
        </div>

        {/* Inspector Panel */}
        {selectedNode && (
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

              {/* Conversion Actions */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Convert to Tasks
                </h3>

                {!selectedNode.linkedTaskId ? (
                  <>
                    <Button
                      onClick={() => convertToTask()}
                      disabled={saving}
                      className="w-full"
                      variant="default"
                    >
                      Convert This Node
                    </Button>
                    <Button
                      onClick={convertPathToTasks}
                      disabled={saving}
                      className="w-full"
                      variant="outline"
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      Convert Connected Path
                    </Button>
                  </>
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
        )}
      </div>

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        open={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onCapture={handleQuickCapture}
      />
    </div>
  );
}
