import { Handle, Position } from "@xyflow/react";

export default function ControlNode() {
  return (
    <div className="w-2 h-2 bg-black rounded-full">
      <Handle type="target" id="top" position={Position.Top} ></Handle>
      <Handle type="target" id="bottom" position={Position.Bottom}></Handle>
    </div>
  );
}
