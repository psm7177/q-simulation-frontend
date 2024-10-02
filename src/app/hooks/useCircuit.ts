"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  EdgeChange,
  NodeChange,
  Node,
  Edge,
} from "@xyflow/react";
import QBitNode from "../componenets/QbitNode";
import ExtenderNode from "../componenets/ExtenderNode";
import ButtonNode from "../componenets/ButtonNode";

// Node type definitions for xyflow
export const nodeTypes = {
  qbit: QBitNode,
  extender: ExtenderNode,
  button: ButtonNode,
};

// Interfaces for quantum bits and circuit layers
export interface Qbit {
  real: number;
  imagin: number;
}

interface Gate {
  layer: Layer;
  register: number;
}

interface Layer {
  gates: Gate[];
  occupiedRegister: number[];
}

// Custom hook for circuit logic
export default function useCircuit() {
  const [qbits, setQbits] = useState<Qbit[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const init = useRef(false);

  // Function to add a qbit
  const addQbit = useCallback(() => {
    setQbits((prevQbits) => [...prevQbits, { real: 0, imagin: 0 }]);
  }, []);

  // Function to extend a circuit by adding a new layer
  const addLayer = useCallback(() => {
    setLayers((prevLayers) => [
      ...prevLayers,
      { gates: [], occupiedRegister: [] },
    ]);
  }, []);

  // Node click handler
  const onNodeClick = useCallback(
    (event: Event, node: Node) => {
      switch (node.id) {
        case "add":
          addQbit();
          break;
        case "extender":
          addLayer();
          break;
        case "qbit":
          console.log(event.target);
          // set visible
          // additional logic if needed for qbit nodes
          break;
        default:
          console.log("Node clicked:", node);
      }
    },
    [addQbit, addLayer]
  );

  // Function to create Qbit Node
  const createQbitNode = useCallback(
    (qbit: Qbit, index: number): Node => ({
      id: `qbit-${index}`,
      type: "qbit",
      position: { x: 0, y: index * 60 },
      draggable: false,
      data: { ...qbit }, // Use a flexible object type here
    }),
    []
  );

  // Memoized AddQbit Node
  const AddQbitNode = useMemo(
    () => ({
      id: "add",
      type: "button",
      position: { x: 0, y: qbits.length * 60 },
      draggable: false,
      data: {},
      zIndex: -qbits.length,
    }),
    [qbits]
  );

  // Memoized Extender Node
  const ExtenderNode = useMemo(
    () => ({
      id: "extender",
      type: "extender",
      position: { x: (layers.length + 1) * 120, y: 0 },
      height: qbits.length * 60 - 14,
      data: { numQbits: qbits.length, numLayers: layers.length },
      draggable: false,
    }),
    [qbits, layers]
  );

  // Function to create an edge
  const createEdge = useCallback(
    (qbitIndex: number): Edge => ({
      id: `baseline-${qbitIndex}`,
      source: `qbit-${qbitIndex}`,
      target: "extender",
      targetHandle: `${qbitIndex}`,
    }),
    []
  );

  // Node change handler
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((prevNodes) => applyNodeChanges(changes, prevNodes)),
    []
  );

  // Edge change handler
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges)),
    []
  );

  // Initialize nodes and edges based on qbits and layers
  useEffect(() => {
    const newNodes = qbits.map((qbit, i) => createQbitNode(qbit, i));
    setNodes([...newNodes, AddQbitNode, ExtenderNode]);
  }, [qbits, AddQbitNode, ExtenderNode, createQbitNode]);

  useEffect(() => {
    const newEdges = qbits.map((_, i) => createEdge(i));
    setEdges([...newEdges]);
  }, [qbits, createEdge]);

  // Initial qbit setup
  useEffect(() => {
    if (!init.current && qbits.length === 0) {
      addQbit();
      init.current = true;
    }
  }, [qbits, addQbit]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick
  };
}
