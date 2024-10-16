"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  useNodesData,
} from "@xyflow/react";
import QBitNode from "../componenets/QbitNode";
import ExtenderNode from "../componenets/ExtenderNode";
import ButtonNode from "../componenets/ButtonNode";
import PreviewNode from "../componenets/PreviewNode";
import { useDragStore } from "../store/drag";
import GateNode from "../componenets/GateNode";
import ControlNode from "../componenets/ControlNode";

// Node type definitions for xyflow
export const nodeTypes = {
  qbit: QBitNode,
  extender: ExtenderNode,
  button: ButtonNode,
  preview: PreviewNode,
  gate: GateNode,
  control: ControlNode,
};

// Interfaces for quantum bits and circuit layers
export interface Qbit {
  real_0: number;
  imagin_0: number;
  real_1: number;
  imagin_1: number;
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

export const STRIDE = 120;

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
    setQbits((prevQbits) => [
      ...prevQbits,
      { real_0: 1, imagin_0: 0, real_1: 0, imagin_1: 0 },
    ]);
  }, [setQbits]);

  const updateQbit = useCallback(
    (
      index: number,
      newReal_0: number,
      newImagin_0: number,
      newReal_1: number,
      newImagin_1: number
    ) => {
      setQbits((prevQbits) => {
        const updatedQbits = [...prevQbits];
        if (index >= 0 && index < updatedQbits.length) {
          console.log("update");
          updatedQbits[index] = {
            real_0: newReal_0,
            imagin_0: newImagin_0,
            real_1: newReal_1,
            imagin_1: newImagin_1,
          };
        }
        return updatedQbits;
      });
    },
    [setQbits]
  );

  // Function to extend a circuit by adding a new layer
  const addLayer = useCallback(() => {
    setLayers((prevLayers) => [
      ...prevLayers,
      { gates: [], occupiedRegister: [] },
    ]);
  }, [setLayers]);

  const addGate = useCallback(
    (id: string, name: string, layerIndex: number, registerIndex: number) => {
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
        updatedLayer.occupiedRegister = [
          ...updatedLayer.occupiedRegister,
          registerIndex,
        ];

        // 업데이트된 레이어로 교체
        updatedLayers[layerIndex] = updatedLayer;

        return updatedLayers;
      });
    },
    [setLayers]
  );

  const addControl = useCallback(
    (
      id: string, // Gate ID
      gateLayerIndex: number, // The layer index where the gate is located
      gateRegister: number, // The register the gate is located on
      controlRegister: number // The control register to be added
    ) => {
      setLayers((prevLayers) => {
        // Copy of previous layers
        const updatedLayers = [...prevLayers];
        const updatedLayer = { ...updatedLayers[gateLayerIndex] };

        // Find the target gate in the specified layer
        console.log(id, gateLayerIndex, gateRegister, controlRegister);
        const targetGate = updatedLayer.gates.find(
          (gate) => gate.id === id && gate.register === gateRegister
        );

        if (targetGate) {
          // Add the control register to the controlRegisters array
          const updatedGate = {
            ...targetGate,
            controlRegisters: targetGate.controlRegisters
              ? [...targetGate.controlRegisters, controlRegister]
              : [controlRegister],
          };

          // Replace the target gate with the updated gate
          updatedLayer.gates = updatedLayer.gates.map((gate) =>
            gate.id === id ? updatedGate : gate
          );

          // Mark the control register as occupied in the layer
          updatedLayer.occupiedRegister = [
            ...updatedLayer.occupiedRegister,
            controlRegister,
          ];

          // Replace the updated layer in the layers array
          updatedLayers[gateLayerIndex] = updatedLayer;
          return updatedLayers;
        }

        return prevLayers; // Return unchanged layers if no gate found
      });
    },
    [setLayers]
  );

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
              register,
            };
          }
        });
      });
      if (minDistance <= snapDistance) {
        return nearestGateIndex;
      }

      // 스냅핑 거리보다 멀리 있으면 원래의 위치 반환
      return null;
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
    [findNearestPlaceIndex, setDragPosition, addGate]
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
          onChange: (r_0: number, i_0: number, r_1: number, i_1: number) => {
            console.log(r_0, i_0, r_1, i_1);
            updateQbit(index, r_0, i_0, r_1, i_1);
          },
        },
      };
    },
    [selectedQbitIndex, updateQbit]
  );

  // Memoized AddQbit Node
  const AddQbitNode = useMemo(
    () => ({
      id: "add",
      type: "button",
      position: { x: 0, y: qbits.length * STRIDE },
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
      setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
      changes.forEach((change) => {
        if (
          change.type === "position" &&
          change.dragging === false &&
          change.id.startsWith("gate")
        ) {
          const movedGateId = change.id;
          const movedGatePosition = change.position!;

          const placeIndex = findNearestPlaceIndex(movedGatePosition);
          console.log(placeIndex, movedGatePosition);

          if (placeIndex === null) {
            setLayers((prevLayers) => [...prevLayers]);
            return;
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

            if (
              targetGate &&
              targetLayerIndex !== null &&
              targetGateIndex !== null
            ) {
              // 새로운 위치에서 가장 가까운 레이어와 레지스터를 찾음
              const { layer: newLayerIndex, register: newRegisterIndex } =
                placeIndex;

              // 기존 레이어와 다르거나 레지스터가 변경되었을 때만 업데이트
              if (
                newLayerIndex !== targetLayerIndex ||
                newRegisterIndex !== targetGate.register
              ) {
                // 기존 레이어에서 게이트 제거
                updatedLayers[targetLayerIndex].gates.splice(
                  targetGateIndex,
                  1
                );
                updatedLayers[targetLayerIndex].occupiedRegister =
                  updatedLayers[targetLayerIndex].occupiedRegister.filter(
                    (register) => register !== targetGate?.register
                  );

                // 새 레이어에 게이트 추가
                const updatedGate = {
                  ...targetGate,
                  register: newRegisterIndex,
                };
                updatedLayers[newLayerIndex].gates = [
                  ...updatedLayers[newLayerIndex].gates,
                  updatedGate,
                ];
                updatedLayers[newLayerIndex].occupiedRegister = [
                  ...updatedLayers[newLayerIndex].occupiedRegister,
                  newRegisterIndex,
                ];
              }
            }
            return updatedLayers;
          });
        }
      });
    },
    [setNodes, findNearestPlaceIndex]
  );

  const [isConnecting, setIsConnecting] = useState(false); // 연결 중 여부 상태
  const [connectingNode, setConnectingNode] = useState<string>("");

  const connectingNodeData = useNodesData(connectingNode);

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isConnecting) {
        const x = event.clientX - 32;
        const y = event.clientY - 32;

        // 현재 마우스 위치 계산
        const position = reactFlow.screenToFlowPosition(
          { x, y },
          { snapToGrid: false }
        );

        // findNearestPlace를 사용하여 가장 가까운 위치를 찾음
        const nearestPosition = findNearestPlace(position);
        const nearestGateIndex = findNearestPlaceIndex(position);

        if (
          nearestGateIndex &&
          connectingNodeData &&
          connectingNodeData.data.layerIndex === nearestGateIndex.layer
        ) {
          nearestPosition.x += 16;
          nearestPosition.y += 16;
          setDragPosition(nearestPosition);
        } else {
          position.x += 16;
          setDragPosition(position);
        }
      }
    },
    [
      isConnecting,
      reactFlow,
      findNearestPlace,
      findNearestPlaceIndex,
      connectingNodeData,
    ]
  );

  // 핸들 드래그 시작할 때 연결 중 상태로 변경
  const onConnectStart = useCallback(
    (event: React.MouseEvent, edge: Edge, handleType: "source" | "target") => {
      if (edge.nodeId.startsWith("gate")) {
        setIsConnecting(true);
        setConnectingNode(edge.nodeId);
      }
    },
    [setConnectingNode]
  );

  // 연결이 완료되면 연결 중 상태 해제
  const onConnectEnd = useCallback(
    (
      event: React.MouseEvent,
      connectionState: Omit<ConnectionState, "inProgress">
    ) => {
      setIsConnecting(false);
      const x = event.clientX - 32;
      const y = event.clientY - 32;

      // 현재 마우스 위치 계산
      const position = reactFlow.screenToFlowPosition(
        { x, y },
        { snapToGrid: false }
      );

      // findNearestPlace를 사용하여 가장 가까운 위치를 찾음
      const nearestGateIndex = findNearestPlaceIndex(position);

      const connectingNode = connectionState.fromNode;
      const connectingNodeData = connectingNode?.data;
      if (
        nearestGateIndex &&
        connectingNode &&
        connectingNodeData &&
        connectingNodeData.layerIndex === nearestGateIndex.layer
      ) {
        console.log("add control");
        console.log(
          connectingNode.id,
          connectingNodeData?.layerIndex,
          connectingNodeData?.registerIndex as number,
          nearestGateIndex?.register
        );
        addControl(
          connectingNode.id,
          connectingNodeData?.layerIndex,
          connectingNodeData?.registerIndex as number,
          nearestGateIndex?.register
        );
      }
      setDragPosition(null);
    },
    [
      setIsConnecting,
      addControl,
      connectingNode,
      findNearestPlaceIndex,
      reactFlow,
      // connectingNodeData,
    ]
  );
  // Edge change handler
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges)),
    []
  );

  const gateNodes = useMemo(() => {
    const nodes: Node[] = [];
    layers.forEach((layer, i) => {
      layer.gates.forEach((gate, j) => {
        nodes.push({
          id: gate.id,
          type: "gate",
          position: { x: (i + 1) * STRIDE, y: gate.register * STRIDE },
          data: {
            layerIndex: i,
            registerIndex: gate.register,
            name: gate.name,
          },
          draggable: true,
        });
        gate.controlRegisters?.forEach((idx) => {
          console.log(gate.id + `-${idx}`);
          nodes.push({
            id: gate.id + `-${idx}`,
            type: "control",
            position: { x: (i + 1) * STRIDE + 20, y: idx * STRIDE + 20 },
            data: {
              layerIndex: i,
            },
            draggable: false,
          });
        });
      });
    });
    console.log("Node", nodes);
    return nodes;
  }, [layers]);

  const controlEdges = useMemo(() => {
    const edges: Edge[] = [];
    // Loop through the layers to find gates with control registers
    layers.forEach((layer, layerIndex) => {
      layer.gates.forEach((gate) => {
        // If this gate has control registers, create edges from each control register
        if (gate.controlRegisters && gate.controlRegisters.length > 0) {
          gate.controlRegisters.forEach((controlRegister) => {
            console.log();
            const edge: Edge = {
              id: `control-edge-${gate.id}-${controlRegister}`,
              target: gate.id + `-${controlRegister}`,
              source: gate.id, // Target gate node
              sourceHandle: gate.register > controlRegister ? "top" : "bottom",
              targetHandle: gate.register < controlRegister ? "top" : "bottom",
              animated: true, // Optional: animate the control edge
            };
            edges.push(edge);
          });
        }
      });
    });
    console.log("Edge", edges);
    return edges;
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
        data: {
          type: isConnecting ? "small" : undefined,
        },
        draggable: false,
        hidden: dragPosition === null,
        style: {
          PointerEvent: "none",
          opacity: isConnecting ? 0.5 : undefined,
        },
      };

      return [...otherNodes, updatedPreviewNode];
    });
  }, [dragPosition, isConnecting]);

  useEffect(() => {
    const newEdges = qbits.map((_, i) => createEdge(i));
    setEdges([...newEdges, ...controlEdges]); // Include control edges
  }, [qbits, createEdge, controlEdges]);

  useEffect(() => {
    registerCallback(onDrop);
  }, [onDrop]);

  // Initial qbit setup
  useEffect(() => {
    if (!init.current && qbits.length === 0) {
      addQbit();
      // addQbit();
      addQbit();
      addLayer();
      addLayer();
      addLayer();
      init.current = true;
    }
  }, [qbits, addQbit, addLayer]);

  const exportCircuit = useCallback(() => {
    // Function to normalize qbits
    const normalizeQbits = (qbits:Qbit[]) => {
      return qbits.map((qbit) => {
        const { real_0, imagin_0, real_1, imagin_1 } = qbit;

        // Calculate the norm (magnitude) of the state vector
        const norm = Math.sqrt(
          real_0 ** 2 + imagin_0 ** 2 + real_1 ** 2 + imagin_1 ** 2
        );

        // Normalize the coefficients if the norm is not zero
        if (norm !== 0) {
          return {
            ...qbit,
            real_0: real_0 / norm,
            imagin_0: imagin_0 / norm,
            real_1: real_1 / norm,
            imagin_1: imagin_1 / norm,
          };
        }

        // If norm is zero, return the qbit as is (this might need further handling based on your logic)
        return qbit;
      });
    };

    // Normalize the qbits before exporting
    const normalizedQbits = normalizeQbits(qbits);

    const registerCount = normalizedQbits.length;
    const registers = normalizedQbits.map((qbit: Qbit) => [
      `${qbit.real_0}+${qbit.imagin_0}j`,
      `${qbit.real_1}+${qbit.imagin_1}j`,
    ]);

    const layerCount = layers.length;
    const layersData = layers.map((layer) => {
      const arr = Array.from({ length: normalizedQbits.length }, () => "NONE");
      layer.gates.forEach((gate) => {
        arr[gate.register] = gate.name;
        gate.controlRegisters?.forEach((controlRegister) => {
          arr[controlRegister] = `c${gate.register}`;
        });
      });
      return arr;
    });

    const circuitData = {
      register_count: registerCount,
      registers: registers,
      layer_count: layerCount,
      layers: layersData,
      custom_gates: [],
    };

    console.log(circuitData);
    return JSON.stringify(circuitData, null, 2);
  }, [qbits, layers]);

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
    exportCircuit,
  };
}
