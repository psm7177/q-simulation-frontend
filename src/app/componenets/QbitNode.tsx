import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Qbit } from "../hooks/useCircuit";

interface QBitNodeData extends Qbit {
  modalVisible: boolean;
  onChange: (real: number, imagin: number) => void;
  [key: string]: unknown; // Ensures that QBitNodeData satisfies the Record<string, unknown> constraint
}

type QBitNode = Node<QBitNodeData, "qbit">;

export default function QBitNode({ data }: NodeProps<QBitNode>) {
  const { real, imagin, modalVisible } = data;
  return (
    <div className="w-12 h-12 ">
      <div
        className="w-12 h-12 border-2 rounded-md flex items-center justify-center"
      >
        A<Handle type="source" position={Position.Right}></Handle>
      </div>
      {modalVisible && (
        <div className="relative border-2 bottom-0 bg-white z-10">
          {real} + {imagin}i
        </div>
      )}
    </div>
  );
}
