"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  EdgeChange,
  NodeChange,
  Node,
  Edge,
  useReactFlow,
  XYPosition,
  ConnectionState,
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
  id: string;
  name: string;
  layer: Layer;
  register: number;
  controlRegisters: number[] | null;
}

interface Layer {
  gates: Gate[];
  occupiedRegister: number[];
}

const STRIDE = 60;

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

  const addGate = useCallback((id: string, name: string, layerIndex: number, registerIndex: number) => {
    setLayers((prevLayers) => {
      // 새 게이트 객체 생성
      const newGate: Gate = {
        id: id,
        name: name,
        layer: prevLayers[layerIndex], // 해당 레이어 참조
        register: registerIndex,
        controlRegisters: null, // 제어 레지스터는 나중에 설정 가능
      };

      // 기존 레이어 복사
      const updatedLayers = [...prevLayers];
      const updatedLayer = { ...updatedLayers[layerIndex] };

      // 게이트를 레이어에 추가
      updatedLayer.gates = [...updatedLayer.gates, newGate];

      // 해당 레지스터를 점유한 것으로 표시
      updatedLayer.occupiedRegister = [...updatedLayer.occupiedRegister, registerIndex];

      // 업데이트된 레이어로 교체
      updatedLayers[layerIndex] = updatedLayer;

      return updatedLayers;
    });
  }, [setLayers]);

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
            x: (layerIndex + 1) * STRIDE, // 레이어의 x 위치
            y: register * STRIDE, // 레지스터에 따라 y 위치 조정
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

  const findNearestPlaceIndex = useCallback(
    (position: XYPosition) => {
      const snapDistance = 20; // 스냅핑 거리 설정

      let nearestGateIndex = { layer: 0, register: 0 };
      let minDistance = Infinity;

      layers.forEach((layer, layerIndex) => {
        qbits.forEach((qbit, register) => {
          if (layer.occupiedRegister.includes(register)) {
            return;
          }
          const gatePosition = {
            x: (layerIndex + 1) * STRIDE, // 레이어의 x 위치
            y: register * STRIDE, // 레지스터에 따라 y 위치 조정
          };

          const distance = Math.sqrt(
            Math.pow(gatePosition.x - position.x, 2) +
            Math.pow(gatePosition.y - position.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestGateIndex = {
              layer: layerIndex,
              register
            }
          }
        });
      });
      if (minDistance <= snapDistance) {
        return nearestGateIndex;
      }

      // 스냅핑 거리보다 멀리 있으면 원래의 위치 반환
      return null;
    },
    [layers, setLayers, qbits]
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
      position.x -= 16;
      position.y -= 16;

      const placeIndex = findNearestPlaceIndex(position);
      if (!!!placeIndex) {
        setDragPosition(null);
        return;
      }

      const id = "gate" + Date.now();

      setDragPosition(null);
      addGate(id, dragItem, placeIndex.layer, placeIndex.register);
    },
    [setNodes, findNearestPlace]
  );

  // Function to create Qbit Node
  const createQbitNode = useCallback(
    (qbit: Qbit, index: number): Node => {
      return {
        id: `qbit-${index}`,
        type: "qbit",
        position: { x: 0, y: index * STRIDE },
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
      position: { x: (layers.length + 1) * STRIDE, y: 0 },
      height: qbits.length * STRIDE - 14,
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
    (changes: NodeChange[]) => {
      setNodes((prevNodes) => applyNodeChanges(changes, prevNodes))
      changes.forEach((change) => {
        if (change.type === "position" && change.dragging === false && change.id.startsWith("gate")) {
          const movedGateId = change.id;
          const movedGatePosition = change.position!;

          const placeIndex = findNearestPlaceIndex(movedGatePosition);
          console.log(placeIndex, movedGatePosition);

          if (placeIndex === null) {
            setLayers((prevLayers) => [...prevLayers]);
            return
          }

          setLayers((prevLayers) => {
            const updatedLayers = [...prevLayers];
            let targetGate: Gate | null = null;
            let targetLayerIndex: number | null = null;
            let targetGateIndex: number | null = null;

            // 각 레이어를 순회하며 해당 게이트를 찾음
            updatedLayers.forEach((layer, layerIndex) => {
              layer.gates.forEach((gate, gateIndex) => {
                if (gate.id === movedGateId) {
                  targetGate = gate;
                  targetLayerIndex = layerIndex;
                  targetGateIndex = gateIndex;
                }
              });
            });

            if (targetGate && targetLayerIndex !== null && targetGateIndex !== null) {
              // 새로운 위치에서 가장 가까운 레이어와 레지스터를 찾음
              const { layer: newLayerIndex, register: newRegisterIndex } = placeIndex;

              // 기존 레이어와 다르거나 레지스터가 변경되었을 때만 업데이트
              if (newLayerIndex !== targetLayerIndex || newRegisterIndex !== targetGate.register) {
                // 기존 레이어에서 게이트 제거
                updatedLayers[targetLayerIndex].gates.splice(targetGateIndex, 1);
                updatedLayers[targetLayerIndex].occupiedRegister = updatedLayers[targetLayerIndex].occupiedRegister.filter(
                  (register) => register !== targetGate?.register
                );

                // 새 레이어에 게이트 추가
                const updatedGate = { ...targetGate, register: newRegisterIndex };
                updatedLayers[newLayerIndex].gates = [...updatedLayers[newLayerIndex].gates, updatedGate];
                updatedLayers[newLayerIndex].occupiedRegister = [
                  ...updatedLayers[newLayerIndex].occupiedRegister,
                  newRegisterIndex,
                ];
              }
            }
            return updatedLayers;
          });
        }
      })
    },
    [setNodes, findNearestPlaceIndex]
  );

  const [isConnecting, setIsConnecting] = useState(false); // 연결 중 여부 상태
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback(
  (event: React.MouseEvent) => {
    if (isConnecting) {
      const x = event.clientX;
      const y = event.clientY;

      // 현재 마우스 위치 계산
      const position = reactFlow.screenToFlowPosition({ x, y });

      // findNearestPlace를 사용하여 가장 가까운 위치를 찾음
      const nearestPosition = findNearestPlace(position);

      // Preview node를 작은 크기로 표시
      setNodes((prevNodes) => {
        const otherNodes = prevNodes.filter((node) => node.id !== "preview");

        const updatedPreviewNode = {
          id: "preview",
          type: "preview",
          position: { x: nearestPosition.x, y: nearestPosition.y }, // 가까운 위치로 스냅
          data: {},
          draggable: false,
          hidden: false,
          style: {
            width: "50%", // 크기를 절반으로 줄임
            height: "50%", // 크기를 절반으로 줄임
            pointerEvents: "none", // 미리보기 노드는 클릭이 불가능하게 설정
            opacity: 0.5, // 투명도 조정
          },
        };

        return [...otherNodes, updatedPreviewNode];
      });
    }
  },
  [isConnecting, reactFlow, findNearestPlace, setNodes]
);

  // 핸들 드래그 시작할 때 연결 중 상태로 변경
  const onConnectStart = useCallback(() => {
    setIsConnecting(true);
  }, []);

  // 연결이 완료되면 연결 중 상태 해제
  const onConnectEnd = useCallback(() => {
    setIsConnecting(false);
    setMousePosition({ x: 0, y: 0 });
  }, []);
  // Edge change handler
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges))
    , []
  );

  const gateNodes = useMemo(() => {
    const nodes: Node[] = [];
    layers.forEach((layer, i) => {
      layer.gates.forEach((gate, j) => {
        nodes.push({
          id: gate.id,
          type: 'gate',
          position: { x: (i + 1) * STRIDE, y: gate.register * STRIDE },
          data: {},
          draggable: true,
        })
      })
    });
    return nodes;
  }, [layers]);

  // Initialize nodes and edges based on qbits and layers
  useEffect(() => {
    const newNodes = qbits.map((qbit, i) => createQbitNode(qbit, i));
    setNodes([...newNodes, ...gateNodes, AddQbitNode, ExtenderNode]);
  }, [qbits, gateNodes, AddQbitNode, ExtenderNode, createQbitNode]);


  // },[layers]);
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
    onConnectStart,
    onMouseMove,
    onConnectEnd,
    onDragOver,
  };
}
