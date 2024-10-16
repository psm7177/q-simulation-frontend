import { NodeProps, Node } from "@xyflow/react";

interface PreviewNodeData {
  type: string;
  [key: string]: unknown;
}

type PreviewNode = Node<PreviewNodeData, "preview">;

export default function PreviewNode({ data }: NodeProps<PreviewNode>) {
  const { type } = data;
  return (
    <div

      className={`${type === "small" ? "w-5 h-5" : "w-10 h-10"} bg-gray-500 rounded-md pointer-events-none`} // pointer-events: none 적용
    ></div>
  );
}
