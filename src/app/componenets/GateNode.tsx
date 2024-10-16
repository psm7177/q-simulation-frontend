import { Handle, Node, Position } from "@xyflow/react";
interface GateNodeData {
  name: string;
  [key: string]: unknown;
}

type GateNode = Node<GateNodeData, "gate">;

export default function GateNode({ data }: GateNode) {
  const { name } = data;
  return (
    <div className="bg-slate-400 w-12 h-12 rounded-md text-3xl flex items-center justify-center">
      {name}
      <Handle type="source" id="top" position={Position.Top}></Handle>
      <Handle type="source" id="bottom" position={Position.Bottom}></Handle>
    </div>
  );
}
