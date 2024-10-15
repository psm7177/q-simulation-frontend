import { Node } from "@xyflow/react";
import { useDragStore } from "../store/drag";
interface GateNodeData {
  [key: string]: unknown;
}

type GateNode = Node<GateNodeData, "gate">;

export default function GateNode({ data }: GateNode) {
  const { setDragItem } = useDragStore();
  return (
    <div className="bg-slate-400 w-12 h-12 rounded-md text-3xl flex items-center justify-center">
      X
    </div>
  );
}
