import { useReactFlow } from "@xyflow/react";
import { useDragStore } from "../store/drag";

export function GateList() {
  const { setDragItem, putItem } = useDragStore();

  const reactFlow = useReactFlow();
  return (
    <div>
      <div
        className="bg-slate-400 w-16 h-16 rounded-md text-4xl flex items-center justify-center"
        onDragStart={(event) => {
          const img = new Image();
          event.dataTransfer.setDragImage(img, 0, 0);
          setDragItem("input");
        }}
        onDragEnd={(event) => {
          console.log(event.clientX);
          
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
        X
      </div>
    </div>
  );
}
