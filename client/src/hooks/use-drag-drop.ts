import { useState, useRef } from "react";

export interface DragDropState {
  isDragging: boolean;
  draggedItem: any | null;
  dragOverTarget: any | null;
}

export function useDragDrop<T>() {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: null,
    dragOverTarget: null,
  });
  
  const draggedRef = useRef<T | null>(null);

  const handleDragStart = (item: T) => {
    draggedRef.current = item;
    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item,
    }));
  };

  const handleDragEnd = () => {
    draggedRef.current = null;
    setState({
      isDragging: false,
      draggedItem: null,
      dragOverTarget: null,
    });
  };

  const handleDragOver = (target: any) => {
    setState(prev => ({
      ...prev,
      dragOverTarget: target,
    }));
  };

  const handleDragLeave = () => {
    setState(prev => ({
      ...prev,
      dragOverTarget: null,
    }));
  };

  const handleDrop = (target: any, onDrop?: (draggedItem: T, target: any) => void) => {
    if (draggedRef.current && onDrop) {
      onDrop(draggedRef.current, target);
    }
    handleDragEnd();
  };

  return {
    state,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
