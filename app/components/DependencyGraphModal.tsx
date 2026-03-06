"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import dagre from "dagre";

type ApiEdge = { from: number; to: number }; // from todo -> dependsOn
type Schedule = {
  criticalPath?: number[];
  scheduleById?: Record<string, any>;
};

type TodoLike = { id: number; title: string };

function layoutDagre(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // Top-to-bottom DAG
  g.setGraph({
    rankdir: "TB",
    nodesep: 40,
    ranksep: 70,
    marginx: 20,
    marginy: 20,
  });

  // Must match node dimensions we “assume”
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 60;

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const layouted = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layouted, edges };
}

export default function DependencyGraphModal({
  isOpen,
  onClose,
  todos,
  apiEdges,
  schedule,
  focusTodoId,
}: {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoLike[];
  apiEdges: ApiEdge[];
  schedule?: Schedule | null;
  focusTodoId?: number | null;
}) {
  const criticalSet = useMemo(() => {
    const cp = schedule?.criticalPath ?? [];
    return new Set<number>(cp);
  }, [schedule]);

  const { nodes, edges } = useMemo(() => {
    // Nodes
    const baseNodes: Node[] = todos.map((t) => {
      const isCritical = criticalSet.has(t.id);
      const isFocus = focusTodoId === t.id;

      return {
        id: String(t.id),
        data: { label: `#${t.id}  ${t.title}` },
        position: { x: 0, y: 0 }, // will be set by dagre
        style: {
          width: 220,
          height: 60,
          borderRadius: 12,
          border: isFocus
            ? "3px solid #2563eb" // blue
            : isCritical
            ? "2px solid #dc2626" // red
            : "1px solid #e5e7eb", // gray
          background: "white",
          boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 10,
          textAlign: "center",
        },
      };
    });

    // Edges
    // API gives: { from: todoId, to: dependsOnId } (todo depends on dependency)
    // For a DAG flow: dependency -> todo
    const rfEdges: Edge[] = apiEdges.map((e, idx) => ({
      id: `e-${idx}-${e.to}-${e.from}`,
      source: String(e.to),
      target: String(e.from),
      animated: false,
      style: { strokeWidth: 2 },
      markerEnd: { type: "arrowclosed" as any },
    }));

    return layoutDagre(baseNodes, rfEdges);
  }, [todos, apiEdges, criticalSet, focusTodoId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[75vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Dependency Graph (DAG)</div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="h-full">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <MiniMap />
            <Controls />
            <Background gap={18} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}