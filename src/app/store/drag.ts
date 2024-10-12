import { create } from 'zustand';

interface DragState {
    dragItem: string | null;
    setDragItem: (dragItem: string | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
    dragItem: null,
    setDragItem: (dragItem: string | null) => set({ dragItem })
}));