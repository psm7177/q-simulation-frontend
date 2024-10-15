import { XYPosition } from '@xyflow/react';
import { create } from 'zustand';

type DragCallback = (dragItem: string, position: XYPosition) => void;

interface DragState {
    dragItem: string | null;
    onDragCallback: DragCallback | null;
    setDragItem: (dragItem: string | null) => void;
    putItem: (position: XYPosition) => void;
    registerCallback: (callback: DragCallback) => void;
}

export const useDragStore = create<DragState>((set) => ({
    dragItem: null,
    onDragCallback: null,
    setDragItem: (dragItem: string | null) => set({ dragItem }),
    registerCallback: (callback: DragCallback) => set({ onDragCallback: callback }),
    putItem: (position: XYPosition) => {
        set((state) => {
            if (state.onDragCallback && state.dragItem) {
                state.onDragCallback(state.dragItem, position)
            }
            return { dragItem: null }
        })
    }
}));