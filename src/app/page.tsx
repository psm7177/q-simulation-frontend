"use client";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useCircuit, { nodeTypes } from "./hooks/useCircuit";

export default function Home() {
  const { nodes, edges, onNodesChange, onEdgesChange, onNodeClick } =
    useCircuit();

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
