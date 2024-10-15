"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  EdgeChange,
  NodeChange,
  Node,
  Edge,
  useReactFlow,
  XYPosition,
} from "@xyflow/react";
import QBitNode from "../componenets/QbitNode";
import ExtenderNode from "../componenets/ExtenderNode";
import ButtonNode from "../componenets/ButtonNode";
import PreviewNode from "../componenets/PreviewNode";
import { useDragStore } from "../store/drag";
import GateNode from "../componenets/GateNode";

// Node type definitions for xyflow
export const nodeTypes = {
  qbit: QBitNode,
  extender: ExtenderNode,
  button: ButtonNode,
  preview: PreviewNode,
  gate: GateNode,
};

// Interfaces for quantum bits and circuit layers
export interface Qbit {
  real: number;
  imagin: number;
}

interface Gate {
  name: string;
  layer: Layer;
  register: number;
  controlRegister: number | null;
}

interface Layer {
  gates: Gate[];
  occupiedRegister: number[];
}

// Custom hook for circuit logic
export default function useCircuit() {
  const reactFlow = useReactFlow();
  const [qbits, setQbits] = useState<Qbit[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedQbitIndex, setSelectedQbitIndex] = useState<number | null>(
    null
  );

  const { dragItem, registerCallback } = useDragStore();
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const init = useRef(false);

  // Function to add a qbit
  const addQbit = useCallback(() => {
    setQbits((prevQbits) => [...prevQbits, { real: 0, imagin: 0 }]);
  }, [setQbits]);

  // Function to extend a circuit by adding a new layer
  const addLayer = useCallback(() => {
    setLayers((prevLayers) => [
      ...prevLayers,
      { gates: [], occupiedRegister: [] },
    ]);
  }, [setLayers]);

  const addGate = useCallback(() => {}, [layers]);

  const findNearestPlace = useCallback(
    (position: XYPosition) => {
      const snapDistance = 20; // 스냅핑 거리 설정
      // find gate place
      // gate가 없으면 해당 위치로 조정
      // gate가 있으면 poition 변경
      if (layers.length === 0) {
        return position;
      }

      let nearestGatePosition = { x: 0, y: 0 };
      let minDistance = Infinity;

      layers.forEach((layer, layerIndex) => {
        qbits.forEach((qbit, register) => {
          if (layer.occupiedRegister.includes(register)) {
            return;
          }
          const gatePosition = {
            x: (layerIndex + 1) * 60, // 레이어의 x 위치
            y: register * 60, // 레지스터에 따라 y 위치 조정
          };

          const distance = Math.sqrt(
            Math.pow(gatePosition.x - position.x, 2) +
              Math.pow(gatePosition.y - position.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestGatePosition = gatePosition;
          }
        });
      });

      if (minDistance <= snapDistance) {
        return nearestGatePosition;
      }

      // 스냅핑 거리보다 멀리 있으면 원래의 위치 반환
      return position;
    },
    [layers, qbits]
  );

  // Node click handler
  const onNodeClick = useCallback(
    (event: Event, node: Node) => {
      switch (node.type) {
        case "button":
          switch (node.id) {
            case "add":
              addQbit();
              break;
          }
          break;
        case "extender":
          addLayer();
          break;
        case "qbit":
          setSelectedQbitIndex(node.data.index as number);
          node.zIndex = 10;
          // set visible
          // additional logic if needed for qbit nodes
          break;
        default:
          console.log("Node clicked:", node);
      }
    },
    [addQbit, addLayer, setSelectedQbitIndex]
  );
  const onDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (dragItem) {
        event.dataTransfer.dropEffect = "move";

        const position = reactFlow.screenToFlowPosition(
          {
            x: event.clientX,
            y: event.clientY,
          },
          { snapToGrid: false }
        );
        position.x -= 16;
        position.y -= 16;
        const placePosition = findNearestPlace(position);
        setDragPosition(placePosition);
      } else {
        event.dataTransfer.dropEffect = "none";
      }
    },
    [dragItem, reactFlow, findNearestPlace]
  );

  const onDrop = useCallback(
    (dragItem: string, position: XYPosition) => {
      // const position = reactFlow.screenToFlowPosition({
      //   x: screenPosition.x,
      //   y: screenPosition.y,
      // });
      position.x -= 16;
      position.y -= 16;
      const placePosition = findNearestPlace(position);

      const newNode: Node = {
        id: "gate" + Date.now(),
        type: "gate",
        position: placePosition,
        data: {},
        draggable: false,
      };
      setDragPosition(null);
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, findNearestPlace]
  );

  // Function to create Qbit Node
  const createQbitNode = useCallback(
    (qbit: Qbit, index: number): Node => {
      console.log(selectedQbitIndex);
      return {
        id: `qbit-${index}`,
        type: "qbit",
        position: { x: 0, y: index * 60 },
        draggable: false,
        data: {
          ...qbit,
          index: index,
          modalVisible: index === selectedQbitIndex,
        },
      };
    },
    [selectedQbitIndex]
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
    console.log("hi");
    setNodes([...newNodes, AddQbitNode, ExtenderNode]);
  }, [qbits, AddQbitNode, ExtenderNode, createQbitNode]);

  useEffect(() => {
    // 미리보기 노드를 업데이트할 때만 노드 배열을 갱신
    setNodes((prevNodes) => {
      // 기존 노드를 유지하고, 미리보기 노드를 최신 위치로 업데이트
      const otherNodes = prevNodes.filter((node) => node.id !== "preview");

      // PreviewNode의 위치만 업데이트
      const updatedPreviewNode = {
        id: "preview",
        type: "preview",
        position: dragPosition ?? { x: 0, y: 0 }, /// fix on edge
        data: {},
        draggable: false,
        hidden: dragPosition === null,
        style: {
          PointerEvent: "none",
        },
      };

      return [...otherNodes, updatedPreviewNode];
    });
  }, [dragPosition]);

  useEffect(() => {
    const newEdges = qbits.map((_, i) => createEdge(i));
    setEdges([...newEdges]);
  }, [qbits, createEdge]);

  useEffect(() => {
    registerCallback(onDrop);
  }, [onDrop]);

  // Initial qbit setup
  useEffect(() => {
    if (!init.current && qbits.length === 0) {
      addQbit();
      addLayer();
      init.current = true;
    }
  }, [qbits, addQbit, addLayer]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    // onDrop,
    onDragOver,
  };
}
