import { useDragStore } from "../store/drag";

export function GateList() {
  const { setDragItem } = useDragStore();
  return (
    <div>
      <div
        className="bg-slate-400 w-16 h-16 rounded-md text-5xl flex items-center justify-center"
        onDragStart={(event) => setDragItem("input")}
        onDragEnd={(event) => setDragItem(null)}
        draggable
      >
        X
      </div>
    </div>
  );
}
