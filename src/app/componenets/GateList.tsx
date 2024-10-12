import { useDragStore } from "../store/drag";

export function GateList() {
  const {} = useDragStore();
  return (
    <div>
      <div
        className="bg-red-600"
        // onDragStart={(event) => onDragStart(event, "input")}
        draggable
      >
        Input Node
      </div>
    </div>
  );
}
