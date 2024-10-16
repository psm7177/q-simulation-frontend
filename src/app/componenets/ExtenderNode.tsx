import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { STRIDE } from "../hooks/useCircuit";

type ExtenderNode = Node<{ numQbits: number, layers: number }, "">;

export default function ExtenderNode({ data }: NodeProps<ExtenderNode>) {
  const { numQbits } = data;
  return (
    <div
      className="w-12 border-2 rounded-md flex items-center justify-center"
      style={{
        height: (numQbits ?? 0) * STRIDE - 14,
      }}
    >
      +
      {Array.from({ length: numQbits }).map((_, i) => (
        <Handle
          type="target"
          id={`${i}`}
          key={`extender-${i}`}
          position={Position.Left}
          style={{
            top: i * STRIDE + 24
          }}
        ></Handle>
      ))}
    </div>
  );
}
