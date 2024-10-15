import { useReactFlow } from "@xyflow/react";
import { useDragStore } from "../store/drag";

interface GateItemProps {
  name: string;
}

function GateItem({ name }: GateItemProps) {
  const reactFlow = useReactFlow();
  const { setDragItem, putItem } = useDragStore();
  return (
    <div
      className="bg-slate-400 w-16 h-16 rounded-md text-4xl flex items-center justify-center"
      onDragStart={(event) => {
        const img = new Image();
        event.dataTransfer.setDragImage(img, 0, 0);
        setDragItem("X");
      }}
      onDragEnd={(event) => {
        const position = reactFlow.screenToFlowPosition(
          {
            x: event.clientX,
            y: event.clientY,
          },
          { snapToGrid: false }
        );

        putItem(position);
      }}
      draggable
    >
      {name}
    </div>
  );
}

export function GateList() {
  const gates = ["X", "Y", "Z", "H"];
  return (
    <div className="p-2 grid gap-2">
      {gates.map((name) => (
        <GateItem name={name} key={name} />
      ))}
    </div>
  );
}
