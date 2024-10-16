"use client";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useCircuit, { nodeTypes } from "./hooks/useCircuit";
import { GateList } from "./componenets/GateList";

const url = "http://127.0.0.1:5000/observe_circuit";

export default function Home() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    // onDrop,
    onConnectStart,
    onMouseMove,
    onConnectEnd,
    onDragOver,
    exportCircuit,
  } = useCircuit();

  return (
    <div className="relative h-screen w-screen flex">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          onMouseMove={onMouseMove}
          // onMouseOver={onMouseOver}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="absolute right-0 w-96 h-96 bg-white border-2 rounded-md ">
        <GateList></GateList>
        <div
          className="p=2 rounded-md bg-slate-300 m-2 text-center cursor-pointer"
          onClick={() => {
            // console.log(exportCircuit());
            const circuit = exportCircuit();

            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: circuit,
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
              })
              .then((data) => {
                // 성공 시 결과 출력
                console.log("Result:", data['result']);
                alert(data['result']);
              })
              .catch((error) => {
                // 에러 처리
                console.error("Request failed:", error);
              });
          }}
        >
          Run
        </div>
      </div>
    </div>
  );
}
