"use client";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useCircuit, { nodeTypes } from "./hooks/useCircuit";
import { GateList } from "./componenets/GateList";

export default function Home() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    // onDrop,
    onDragOver,
  } = useCircuit();

  return (
    <div className="relative h-screen w-screen flex">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="absolute right-0 w-96 h-96 bg-white border-2 rounded-md ">
        <GateList></GateList>
      </div>
    </div>
  );
}
