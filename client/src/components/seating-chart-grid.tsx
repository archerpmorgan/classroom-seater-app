import { useState, useEffect } from "react";
import StudentSeat from "./student-seat";
import type { Student } from "@shared/schema";

interface SeatingChartGridProps {
  layout: 'traditional-rows' | 'stadium' | 'horseshoe' | 'double-horseshoe' | 'circle' | 'groups' | 'pairs';
  students: Student[];
  currentChart: {position: number, studentId: string | null, customX?: number, customY?: number}[];
  onChartChange: (chart: {position: number, studentId: string | null, customX?: number, customY?: number}[]) => void;
  onChartChangeComplete?: (chart: {position: number, studentId: string | null, customX?: number, customY?: number}[]) => void;
  privacyMode?: boolean;
  deskSwapMode?: boolean;
}

interface SeatPosition {
  position: number;
  x: number;
  y: number;
  rotation?: number;
}

export default function SeatingChartGrid({ 
  layout, 
  students, 
  currentChart, 
  onChartChange,
  onChartChangeComplete,
  privacyMode,
  deskSwapMode = false
}: SeatingChartGridProps) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [teacherDeskPosition, setTeacherDeskPosition] = useState({ x: 50, y: 80 });
  const [teacherDeskSize, setTeacherDeskSize] = useState({ width: 100, height: 80 });
  const [isDraggingTeacherDesk, setIsDraggingTeacherDesk] = useState(false);
  const [isResizingTeacherDesk, setIsResizingTeacherDesk] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 350, y: 15 });
  const [whiteboardSize, setWhiteboardSize] = useState({ width: 200, height: 40 });
  const [isDraggingWhiteboard, setIsDraggingWhiteboard] = useState(false);
  const [isResizingWhiteboard, setIsResizingWhiteboard] = useState(false);
  const [doorPosition, setDoorPosition] = useState({ x: 780, y: 80 });
  const [doorSize, setDoorSize] = useState({ width: 45, height: 120 });
  const [isDraggingDoor, setIsDraggingDoor] = useState(false);
  const [isResizingDoor, setIsResizingDoor] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // New state for draggable desks
  const [isDraggingDesk, setIsDraggingDesk] = useState(false);
  const [draggingDeskPosition, setDraggingDeskPosition] = useState<number | null>(null);
  
  // New state for multi-select
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState({ x: 0, y: 0 });
  const [boxSelectEnd, setBoxSelectEnd] = useState({ x: 0, y: 0 });
  const [selectedDesks, setSelectedDesks] = useState<Set<number>>(new Set());
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const [multiDragOffset, setMultiDragOffset] = useState({ x: 0, y: 0 });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDesks(new Set());
        setIsBoxSelecting(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSeatCount = (layoutType: string, studentCount: number) => {
    // For groups layout, always show complete groups (4 seats per group)
    if (layoutType === 'groups') {
      const groupsNeeded = Math.ceil(studentCount / 4);
      return groupsNeeded * 4;
    }
    
    // For other layouts, show only the seats needed
    const maxSeats = {
      'traditional-rows': 30,
      'stadium': 28,
      'horseshoe': 20,
      'double-horseshoe': 32,
      'circle': 16,
      'pairs': 20
    };
    
    const maxForLayout = maxSeats[layoutType as keyof typeof maxSeats] || 24;
    return Math.min(studentCount, maxForLayout);
  };

  // Helper function to check if a position overlaps with teacher desk
  const isOverlappingTeacherDesk = (x: number, y: number): boolean => {
    // Teacher desk is at (20, 20) with size 80x60
    const deskLeft = 20;
    const deskTop = 20;
    const deskRight = deskLeft + 80;
    const deskBottom = deskTop + 60;
    
    // Student seat is approximately 64x64 (w-16 h-16)
    const seatSize = 64;
    const seatLeft = x;
    const seatTop = y;
    const seatRight = x + seatSize;
    const seatBottom = y + seatSize;
    
    // Check for overlap
    return !(seatLeft >= deskRight || seatRight <= deskLeft || seatTop >= deskBottom || seatBottom <= deskTop);
  };

  const generateLayoutPositions = (layoutType: string, seatCount: number): SeatPosition[] => {
    const positions: SeatPosition[] = [];

    switch (layoutType) {
      case 'traditional-rows': {
        // Dynamic rows based on student count - centered in room, teacher desk floats
        const seatsPerRow = 5;
        const rowsNeeded = Math.ceil(seatCount / seatsPerRow);
        let position = 0;
        
        // Calculate center position for the row
        const rowWidth = seatsPerRow * 120; // Width of one row
        const startX = (900 - rowWidth) / 2; // Center the row in 900px room
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let col = 0; col < seatsPerRow && position < seatCount; col++) {
            let x = startX + col * 120; // Centered row
            let y = row * 100 + 140; // Start at y=140 (more space from front/whiteboard)
            
            positions.push({
              position: position++,
              x: x,
              y: y
            });
          }
        }
        break;
      }

      case 'stadium': {
        // V-shaped angled rows for better sightlines - centered in room
        let position = 0;
        const rowSeats = [5, 6, 7, 6]; // Slightly fewer seats per row
        
        for (let row = 0; row < 4 && position < seatCount; row++) {
          const seatsInThisRow = Math.min(rowSeats[row], seatCount - position);
          const rowWidth = seatsInThisRow * 120; // Width of this row
          let startX = (900 - rowWidth) / 2; // Center the row in 900px room
          const angleOffset = row * 20;
          
          for (let col = 0; col < seatsInThisRow; col++) {
            const centerCol = (seatsInThisRow - 1) / 2;
            const distanceFromCenter = Math.abs(col - centerCol);
            
            let x = startX + col * 120 + (row > 0 ? distanceFromCenter * angleOffset : 0);
            let y = row * 120 + 140; // Start at y=140 (more space from front/whiteboard)
            
            positions.push({
              position: position++,
              x: x,
              y: y,
              rotation: row > 0 ? (col < centerCol ? -5 : col > centerCol ? 5 : 0) : 0
            });
          }
        }
        break;
      }

      case 'horseshoe': {
        // U-shaped arrangement for discussions - use overlap detection
        const centerX = 400;
        const centerY = 280;
        const radius = 180;
        const angleStep = Math.PI / Math.max(seatCount - 1, 1);
        const startAngle = Math.PI; // Start from left side
        
        for (let i = 0; i < seatCount; i++) {
          const angle = startAngle - i * angleStep;
          let x = centerX + Math.cos(angle) * radius;
          let y = centerY + Math.sin(angle) * radius;
          
          // Ensure seats don't go below whiteboard
          y = Math.max(y, 120);
          
          // If this position overlaps with teacher desk, adjust it
          if (isOverlappingTeacherDesk(x, y)) {
            x = 120; // Move to the right of the desk
          }
          
          positions.push({
            position: i,
            x: x,
            y: y,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        break;
      }

      case 'double-horseshoe': {
        // Inner and outer horseshoe rings - avoid overlaps
        const centerX = 420;
        const centerY = 300;
        let position = 0;
        
        // Determine how many seats in each ring based on total
        const innerSeats = Math.min(Math.ceil(seatCount / 2), 16);
        const outerSeats = Math.min(seatCount - innerSeats, 16);
        
        // Inner horseshoe
        const innerRadius = 140;
        const innerAngleStep = Math.PI / Math.max(innerSeats - 1, 1);
        
        for (let i = 0; i < innerSeats && position < seatCount; i++) {
          const angle = Math.PI - i * innerAngleStep;
          let x = centerX + Math.cos(angle) * innerRadius;
          let y = centerY + Math.sin(angle) * innerRadius;
          
          // Ensure seats don't go below whiteboard
          y = Math.max(y, 120);
          
          // If this position overlaps with teacher desk, adjust it
          if (isOverlappingTeacherDesk(x, y)) {
            x = 120; // Move to the right of the desk
          }
          
          positions.push({
            position: position++,
            x: x,
            y: y,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        
        // Outer horseshoe
        const outerRadius = 240;
        const outerAngleStep = Math.PI / Math.max(outerSeats - 1, 1);
        
        for (let i = 0; i < outerSeats && position < seatCount; i++) {
          const angle = Math.PI - i * outerAngleStep;
          let x = centerX + Math.cos(angle) * outerRadius;
          let y = centerY + Math.sin(angle) * outerRadius;
          
          // Ensure seats don't go below whiteboard
          y = Math.max(y, 120);
          
          // If this position overlaps with teacher desk, adjust it
          if (isOverlappingTeacherDesk(x, y)) {
            x = 120; // Move to the right of the desk
          }
          
          positions.push({
            position: position++,
            x: x,
            y: y,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        break;
      }

      case 'circle': {
        // Complete circle for democratic discussions - use overlap detection
        const centerX = 400;
        const centerY = 280;
        const radius = 160;
        const angleStep = (2 * Math.PI) / seatCount;
        
        for (let i = 0; i < seatCount; i++) {
          const angle = i * angleStep - Math.PI/2; // Start at top
          let x = centerX + Math.cos(angle) * radius;
          let y = centerY + Math.sin(angle) * radius;
          
          // Ensure seats don't go below whiteboard
          y = Math.max(y, 120);
          
          // If this position overlaps with teacher desk, adjust it
          if (isOverlappingTeacherDesk(x, y)) {
            x = 120; // Move to the right of the desk
          }
          
          positions.push({
            position: i,
            x: x,
            y: y,
            rotation: angle * 180 / Math.PI + 90
          });
        }
        break;
      }

      case 'groups': {
        // Dynamic groups based on student count (always show complete groups of 4)
        let position = 0;
        const groupsNeeded = Math.ceil(seatCount / 4);
        const groupPositions = [
          { x: 150, y: 160 }, { x: 400, y: 160 }, { x: 650, y: 160 },  // Moved down for more front space
          { x: 150, y: 360 }, { x: 400, y: 360 }, { x: 650, y: 360 }   // Moved down for more front space
        ];
        
        for (let g = 0; g < groupsNeeded && g < groupPositions.length; g++) {
          const groupCenter = groupPositions[g];
          // Balanced spacing within groups - good horizontal, fixed vertical
          const seats = [
            { x: -42, y: -42 }, { x: 42, y: -42 },  // Top row: keep horizontal, increase vertical
            { x: -42, y: 42 }, { x: 42, y: 42 }     // Bottom row: keep horizontal, increase vertical
          ];
          
          seats.forEach(seatOffset => {
            let x = groupCenter.x + seatOffset.x;
            let y = groupCenter.y + seatOffset.y;
            
            positions.push({
              position: position++,
              x: x,
              y: y,
              rotation: 0
            });
          });
        }
        break;
      }

      case 'pairs': {
        // Dynamic pairs based on student count - centered in room
        let position = 0;
        const pairsNeeded = Math.ceil(seatCount / 2);
        const columns = 3; // 3 columns of pairs
        const rowsNeeded = Math.ceil(pairsNeeded / columns);
        
        // Calculate center position for the pairs layout
        const pairWidth = 160; // Width of one pair (2 seats * 80px spacing)
        const totalWidth = columns * 200; // Total width of all columns
        const startX = (900 - totalWidth) / 2; // Center the pairs layout in 900px room
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let pairCol = 0; pairCol < columns && position < seatCount; pairCol++) {
            for (let seat = 0; seat < 2 && position < seatCount; seat++) {
              let x = startX + pairCol * 200 + seat * 80; // Centered pairs layout
              let y = row * 120 + 140; // Start at y=140 (more space from front/whiteboard)
              
              positions.push({
                position: position++,
                x: x,
                y: y,
                rotation: 0
              });
            }
          }
        }
        break;
      }

      default:
        // Fallback to traditional rows
        return generateLayoutPositions('traditional-rows', seatCount);
    }

    return positions;
  };

  const studentCount = students.length;
  const totalSeats = studentCount > 0 ? getSeatCount(layout, studentCount) : 0;
  const layoutPositions = studentCount > 0 ? generateLayoutPositions(layout, totalSeats) : [];
  
  // Initialize seats if empty, but only if there are students
  const seats = currentChart.length > 0 
    ? currentChart 
    : studentCount > 0 
      ? Array.from({ length: totalSeats }, (_, i) => ({ position: i, studentId: null, customX: undefined, customY: undefined }))
      : [];

  const getStudentById = (id: string | null): Student | undefined => {
    if (!id) return undefined;
    return students.find(s => s.id === id);
  };

  const handleDragStart = (student: Student) => {
    setDraggedStudent(student);
  };

  const handleDragEnd = () => {
    setDraggedStudent(null);
    setDragOverPosition(null);
  };

  const handleTeacherDeskMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on a resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      const handle = target.getAttribute('data-handle');
      if (handle) {
        setIsResizingTeacherDesk(true);
        setResizeHandle(handle);
        const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
        if (containerRect) {
          setDragOffset({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
          });
        }
        return;
      }
    }
    
    // Regular drag
    setIsDraggingTeacherDesk(true);
    const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + teacherDeskPosition.x),
        y: e.clientY - (containerRect.top + teacherDeskPosition.y)
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isResizingTeacherDesk && resizeHandle) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      let newWidth = teacherDeskSize.width;
      let newHeight = teacherDeskSize.height;
      let newX = teacherDeskPosition.x;
      let newY = teacherDeskPosition.y;
      
      const minSize = 60; // Minimum size
      const maxWidth = 900 - teacherDeskPosition.x;
      const maxHeight = 600 - teacherDeskPosition.y;
      
      switch (resizeHandle) {
        case 'se':
          // Southeast (bottom-right) - resize width and height
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - teacherDeskPosition.x));
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - teacherDeskPosition.y));
          break;
        case 'sw':
          // Southwest (bottom-left) - resize width and height, adjust x
          const newWidthSW = Math.max(minSize, Math.min(teacherDeskPosition.x + teacherDeskSize.width, teacherDeskPosition.x + teacherDeskSize.width - currentX));
          newX = teacherDeskPosition.x + teacherDeskSize.width - newWidthSW;
          newWidth = newWidthSW;
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - teacherDeskPosition.y));
          break;
        case 'ne':
          // Northeast (top-right) - resize width and height, adjust y
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - teacherDeskPosition.x));
          const newHeightNE = Math.max(minSize, Math.min(teacherDeskPosition.y + teacherDeskSize.height, teacherDeskPosition.y + teacherDeskSize.height - currentY));
          newY = teacherDeskPosition.y + teacherDeskSize.height - newHeightNE;
          newHeight = newHeightNE;
          break;
        case 'nw':
          // Northwest (top-left) - resize width and height, adjust x and y
          const newWidthNW = Math.max(minSize, Math.min(teacherDeskPosition.x + teacherDeskSize.width, teacherDeskPosition.x + teacherDeskSize.width - currentX));
          newX = teacherDeskPosition.x + teacherDeskSize.width - newWidthNW;
          newWidth = newWidthNW;
          const newHeightNW = Math.max(minSize, Math.min(teacherDeskPosition.y + teacherDeskSize.height, teacherDeskPosition.y + teacherDeskSize.height - currentY));
          newY = teacherDeskPosition.y + teacherDeskSize.height - newHeightNW;
          newHeight = newHeightNW;
          break;
      }
      
      setTeacherDeskSize({ width: newWidth, height: newHeight });
      setTeacherDeskPosition({ x: newX, y: newY });
    } else if (isDraggingTeacherDesk) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setTeacherDeskPosition({
        x: Math.max(0, Math.min(900 - teacherDeskSize.width, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - teacherDeskSize.height, e.clientY - containerRect.top - dragOffset.y))
      });
    } else if (isResizingWhiteboard && resizeHandle) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      let newWidth = whiteboardSize.width;
      let newHeight = whiteboardSize.height;
      let newX = whiteboardPosition.x;
      let newY = whiteboardPosition.y;
      
      const minSize = 40; // Minimum size for whiteboard
      const maxWidth = 900 - whiteboardPosition.x;
      const maxHeight = 600 - whiteboardPosition.y;
      
      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - whiteboardPosition.x));
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - whiteboardPosition.y));
          break;
        case 'sw':
          const newWidthSW = Math.max(minSize, Math.min(whiteboardPosition.x + whiteboardSize.width, whiteboardPosition.x + whiteboardSize.width - currentX));
          newX = whiteboardPosition.x + whiteboardSize.width - newWidthSW;
          newWidth = newWidthSW;
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - whiteboardPosition.y));
          break;
        case 'ne':
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - whiteboardPosition.x));
          const newHeightNE = Math.max(minSize, Math.min(whiteboardPosition.y + whiteboardSize.height, whiteboardPosition.y + whiteboardSize.height - currentY));
          newY = whiteboardPosition.y + whiteboardSize.height - newHeightNE;
          newHeight = newHeightNE;
          break;
        case 'nw':
          const newWidthNW = Math.max(minSize, Math.min(whiteboardPosition.x + whiteboardSize.width, whiteboardPosition.x + whiteboardSize.width - currentX));
          newX = whiteboardPosition.x + whiteboardSize.width - newWidthNW;
          newWidth = newWidthNW;
          const newHeightNW = Math.max(minSize, Math.min(whiteboardPosition.y + whiteboardSize.height, whiteboardPosition.y + whiteboardSize.height - currentY));
          newY = whiteboardPosition.y + whiteboardSize.height - newHeightNW;
          newHeight = newHeightNW;
          break;
      }
      
      setWhiteboardSize({ width: newWidth, height: newHeight });
      setWhiteboardPosition({ x: newX, y: newY });
    } else if (isDraggingWhiteboard) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setWhiteboardPosition({
        x: Math.max(0, Math.min(900 - whiteboardSize.width, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - whiteboardSize.height, e.clientY - containerRect.top - dragOffset.y))
      });
    } else if (isResizingDoor && resizeHandle) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      let newWidth = doorSize.width;
      let newHeight = doorSize.height;
      let newX = doorPosition.x;
      let newY = doorPosition.y;
      
      const minSize = 30; // Minimum size for door
      const maxWidth = 900 - doorPosition.x;
      const maxHeight = 600 - doorPosition.y;
      
      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - doorPosition.x));
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - doorPosition.y));
          break;
        case 'sw':
          const newWidthSW = Math.max(minSize, Math.min(doorPosition.x + doorSize.width, doorPosition.x + doorSize.width - currentX));
          newX = doorPosition.x + doorSize.width - newWidthSW;
          newWidth = newWidthSW;
          newHeight = Math.max(minSize, Math.min(maxHeight, currentY - doorPosition.y));
          break;
        case 'ne':
          newWidth = Math.max(minSize, Math.min(maxWidth, currentX - doorPosition.x));
          const newHeightNE = Math.max(minSize, Math.min(doorPosition.y + doorSize.height, doorPosition.y + doorSize.height - currentY));
          newY = doorPosition.y + doorSize.height - newHeightNE;
          newHeight = newHeightNE;
          break;
        case 'nw':
          const newWidthNW = Math.max(minSize, Math.min(doorPosition.x + doorSize.width, doorPosition.x + doorSize.width - currentX));
          newX = doorPosition.x + doorSize.width - newWidthNW;
          newWidth = newWidthNW;
          const newHeightNW = Math.max(minSize, Math.min(doorPosition.y + doorSize.height, doorPosition.y + doorSize.height - currentY));
          newY = doorPosition.y + doorSize.height - newHeightNW;
          newHeight = newHeightNW;
          break;
      }
      
      setDoorSize({ width: newWidth, height: newHeight });
      setDoorPosition({ x: newX, y: newY });
    } else if (isDraggingDoor) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setDoorPosition({
        x: Math.max(0, Math.min(900 - doorSize.width, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - doorSize.height, e.clientY - containerRect.top - dragOffset.y))
      });
    } else if (isDraggingDesk && draggingDeskPosition !== null) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const newX = Math.max(0, Math.min(900 - 80, e.clientX - containerRect.left - dragOffset.x)); // 80px desk width
      const newY = Math.max(0, Math.min(600 - 80, e.clientY - containerRect.top - dragOffset.y)); // 80px desk height
      
      // Update the chart with new custom position
      const newChart = seats.map(seat => 
        seat.position === draggingDeskPosition 
          ? { ...seat, customX: newX, customY: newY }
          : seat
      );
      onChartChange(newChart);
    } else if (isBoxSelecting) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      setBoxSelectEnd({ x: currentX, y: currentY });
      
      // Calculate which desks are in the selection box
      const newSelection = new Set<number>();
      const minX = Math.min(boxSelectStart.x, currentX);
      const maxX = Math.max(boxSelectStart.x, currentX);
      const minY = Math.min(boxSelectStart.y, currentY);
      const maxY = Math.max(boxSelectStart.y, currentY);
      
      seats.forEach(seat => {
        const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
        if (!layoutPos) return;
        
        const x = seat.customX ?? layoutPos.x;
        const y = seat.customY ?? layoutPos.y;
        
        // Check if desk center is within selection box
        if (x + 40 >= minX && x + 40 <= maxX && y + 40 >= minY && y + 40 <= maxY) {
          newSelection.add(seat.position);
        }
      });
      
      // Merge with existing selection if Ctrl/Cmd is held
      if (e.metaKey || e.ctrlKey) {
        const combined = new Set([...selectedDesks, ...newSelection]);
        setSelectedDesks(combined);
      } else {
        setSelectedDesks(newSelection);
      }
    } else if (isDraggingMultiple) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      const deltaX = currentX - multiDragOffset.x;
      const deltaY = currentY - multiDragOffset.y;
      
      // Update all selected desks
      const newChart = seats.map(seat => {
        if (selectedDesks.has(seat.position)) {
          const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
          if (!layoutPos) return seat;
          
          const currentX = seat.customX ?? layoutPos.x;
          const currentY = seat.customY ?? layoutPos.y;
          
          return {
            ...seat,
            customX: Math.max(0, Math.min(900 - 80, currentX + deltaX)),
            customY: Math.max(0, Math.min(600 - 80, currentY + deltaY))
          };
        }
        return seat;
      });
      
      onChartChange(newChart);
      setMultiDragOffset({ x: currentX, y: currentY });
    }
  };

  const handleTeacherDeskMouseUp = () => {
    setIsDraggingTeacherDesk(false);
  };

  const handleWhiteboardMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on a resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      const handle = target.getAttribute('data-handle');
      if (handle) {
        setIsResizingWhiteboard(true);
        setResizeHandle(handle);
        const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
        if (containerRect) {
          setDragOffset({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
          });
        }
        return;
      }
    }
    
    // Regular drag
    setIsDraggingWhiteboard(true);
    const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + whiteboardPosition.x),
        y: e.clientY - (containerRect.top + whiteboardPosition.y)
      });
    }
  };

  const handleDoorMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on a resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      const handle = target.getAttribute('data-handle');
      if (handle) {
        setIsResizingDoor(true);
        setResizeHandle(handle);
        const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
        if (containerRect) {
          setDragOffset({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
          });
        }
        return;
      }
    }
    
    // Regular drag
    setIsDraggingDoor(true);
    const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + doorPosition.x),
        y: e.clientY - (containerRect.top + doorPosition.y)
      });
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    // Don't start box select if we're already dragging something or if student drag is active
    if (isDraggingTeacherDesk || isDraggingWhiteboard || isDraggingDoor || isDraggingDesk || draggedStudent) return;
    
    // Check if we clicked on a desk
    const target = e.target as HTMLElement;
    const deskElement = target.closest('[data-desk-position]');
    
    if (deskElement) {
      // Clicked on a desk - handle desk selection/dragging
      const position = parseInt(deskElement.getAttribute('data-desk-position') || '0');
      handleDeskMouseDown(e, position);
    } else {
      // Clicked on empty space - start box select
      const containerRect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - containerRect.left;
      const startY = e.clientY - containerRect.top;
      
      // Clear selection if not holding Ctrl/Cmd
      if (!e.metaKey && !e.ctrlKey) {
        setSelectedDesks(new Set());
      }
      
      setIsBoxSelecting(true);
      setBoxSelectStart({ x: startX, y: startY });
      setBoxSelectEnd({ x: startX, y: startY });
    }
  };

  const handleDeskMouseDown = (e: React.MouseEvent, position: number) => {
    // Prevent this from interfering with student drag and drop
    if (draggedStudent) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this desk is already selected and we're starting a multi-drag
    if (selectedDesks.has(position)) {
      setIsDraggingMultiple(true);
      
      const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
      if (containerRect) {
        setMultiDragOffset({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top
        });
      }
    } else {
      // Single desk drag
      setIsDraggingDesk(true);
      setDraggingDeskPosition(position);
      
      const seat = seats.find(s => s.position === position);
      const layoutPos = layoutPositions.find(pos => pos.position === position);
      if (!seat || !layoutPos) return;
      
      // Use custom position if available, otherwise use layout position
      const currentX = seat.customX ?? layoutPos.x;
      const currentY = seat.customY ?? layoutPos.y;
      
      const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
      if (containerRect) {
        setDragOffset({
          x: e.clientX - (containerRect.left + currentX),
          y: e.clientY - (containerRect.top + currentY)
        });
      }
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent) => {
    // Check for desk swapping when in swap mode
    if (isDraggingDesk && draggingDeskPosition !== null && deskSwapMode) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - containerRect.left;
      const dropY = e.clientY - containerRect.top;
      
      // Find if we're dropping onto another desk
      const targetSeat = seats.find(seat => {
        if (seat.position === draggingDeskPosition) return false; // Don't swap with self
        
        const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
        const fallbackPos = { x: seat.customX ?? 0, y: seat.customY ?? 0 };
        const seatPos = layoutPos || fallbackPos;
        
        const seatX = seat.customX ?? seatPos.x;
        const seatY = seat.customY ?? seatPos.y;
        
        // Check if drop position is within desk bounds (80x80 pixels)
        return dropX >= seatX && dropX <= seatX + 80 && 
               dropY >= seatY && dropY <= seatY + 80;
      });
      
      if (targetSeat) {
        // Perform the swap
        const draggedSeat = seats.find(s => s.position === draggingDeskPosition);
        if (draggedSeat) {
          const newChart = seats.map(seat => {
            if (seat.position === draggingDeskPosition) {
              // Move dragged desk to target position
              return {
                ...seat,
                studentId: targetSeat.studentId,
                customX: targetSeat.customX,
                customY: targetSeat.customY
              };
            } else if (seat.position === targetSeat.position) {
              // Move target desk to dragged position
              return {
                ...seat,
                studentId: draggedSeat.studentId,
                customX: draggedSeat.customX,
                customY: draggedSeat.customY
              };
            }
            return seat;
          });
          
          onChartChange(newChart);
          
          // Show swap confirmation
          const draggedStudent = getStudentById(draggedSeat.studentId);
          const targetStudent = getStudentById(targetSeat.studentId);
          console.log(`Swapped: ${draggedStudent?.name || 'Empty desk'} ↔ ${targetStudent?.name || 'Empty desk'}`);
        }
      }
    }
    
    // If we were dragging a desk or multiple desks, notify that the operation is complete
    if ((isDraggingDesk || isDraggingMultiple) && onChartChangeComplete) {
      onChartChangeComplete([...seats]);
    }
    
    setIsDraggingTeacherDesk(false);
    setIsResizingTeacherDesk(false);
    setIsDraggingWhiteboard(false);
    setIsResizingWhiteboard(false);
    setIsDraggingDoor(false);
    setIsResizingDoor(false);
    setResizeHandle(null);
    setIsDraggingDesk(false);
    setDraggingDeskPosition(null);
    setIsBoxSelecting(false);
    setIsDraggingMultiple(false);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    setDragOverPosition(null);
    
    if (!draggedStudent) return;

    const newChart = [...seats];
    
    // Remove student from current position
    const currentPosition = newChart.findIndex(seat => seat.studentId === draggedStudent.id);
    if (currentPosition !== -1) {
      newChart[currentPosition] = { ...newChart[currentPosition], studentId: null };
    }
    
    // Place student in new position (swap if occupied)
    const targetSeat = newChart[targetPosition];
    if (targetSeat.studentId && currentPosition !== -1) {
      // Swap students - preserve custom positions for the seats themselves
      newChart[currentPosition] = { ...newChart[currentPosition], studentId: targetSeat.studentId };
    }
    
    // Clear any custom positions when students are swapped via drag and drop
    // The desk positions stay, but students move to default desk positions
    newChart[targetPosition] = { ...newChart[targetPosition], studentId: draggedStudent.id };
    
    onChartChange(newChart);
  };

  const renderSeat = (seat: {position: number, studentId: string | null, customX?: number, customY?: number}, layoutPos: SeatPosition) => {
    const student = getStudentById(seat.studentId);
    const isDragOver = dragOverPosition === seat.position;
    const isBeingDragged = isDraggingDesk && draggingDeskPosition === seat.position;
    const isSelected = selectedDesks.has(seat.position);
    const isMultiDragging = isDraggingMultiple && isSelected;
    
    // Use custom position if available, otherwise use layout position
    const x = seat.customX ?? layoutPos.x;
    const y = seat.customY ?? layoutPos.y;
    
    const seatStyle = {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      transform: layoutPos.rotation ? `rotate(${layoutPos.rotation}deg)` : undefined,
      transformOrigin: 'center',
      transition: (isBeingDragged || isMultiDragging) ? 'none' : 'all 0.3s ease',
      cursor: deskSwapMode ? 'grab' : (student ? 'move' : 'default'),
      zIndex: (isBeingDragged || isMultiDragging) ? 30 : 'auto'
    };

    if (student) {
      return (
        <div 
          key={`seat-${seat.position}`} 
          style={seatStyle}
          onMouseDown={(e) => handleDeskMouseDown(e, seat.position)}
          data-desk-position={seat.position}
          className={`
            ${isBeingDragged || isMultiDragging ? 'shadow-lg scale-105' : ''}
            ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
            ${deskSwapMode ? 'ring-2 ring-orange-400 ring-offset-1' : ''}
          `}
        >
          <StudentSeat
            student={student}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggedStudent?.id === student.id}
            position={seat.position}
            privacyMode={privacyMode}
          />
        </div>
      );
    }

    return (
      <div
        key={`empty-${seat.position}`}
        style={seatStyle}
        className={`
          drop-zone cursor-move
          ${isDragOver ? 'drag-over' : ''}
          ${isBeingDragged || isMultiDragging ? 'shadow-lg scale-105' : ''}
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
          ${deskSwapMode ? 'ring-2 ring-orange-400 ring-offset-1' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, seat.position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, seat.position)}
        onMouseDown={(e) => handleDeskMouseDown(e, seat.position)}
        data-desk-position={seat.position}
        data-testid={`drop-zone-${seat.position}`}
      >
        <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
          <span className="text-xs text-muted-foreground">Empty</span>
        </div>
      </div>
    );
  };

  // Use fixed room dimensions for consistent centering
  const roomWidth = 900;
  const roomHeight = layoutPositions.length > 0 ? Math.max(...layoutPositions.map(p => p.y)) + 200 : 600;

  return (
    <div className="classroom-container">
      <div 
        className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border p-4 overflow-hidden select-none"
        style={{ width: `${roomWidth}px`, height: `${roomHeight}px`, minHeight: '500px' }}
        data-testid="seating-chart-grid"
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >


        {/* Draggable Whiteboard */}
        <div 
          className={`absolute bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-md shadow-lg cursor-move select-none ${
            isDraggingWhiteboard || isResizingWhiteboard ? 'shadow-xl scale-105' : ''
          }`}
          style={{ 
            left: `${whiteboardPosition.x}px`, 
            top: `${whiteboardPosition.y}px`, 
            width: `${whiteboardSize.width}px`, 
            height: `${whiteboardSize.height}px`,
            zIndex: 15,
            transition: (isDraggingWhiteboard || isResizingWhiteboard) ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="whiteboard"
          onMouseDown={handleWhiteboardMouseDown}
        >
          <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-300">
            <div className="text-sm font-medium">📋 Whiteboard</div>
          </div>
          
          {/* Resize Handles */}
          <div 
            className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize bg-slate-200 dark:bg-slate-700 hover:bg-slate-400 rounded-tl transition-colors"
            data-handle="nw"
            style={{ zIndex: 16 }}
          />
          <div 
            className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-slate-200 dark:bg-slate-700 hover:bg-slate-400 rounded-tr transition-colors"
            data-handle="ne"
            style={{ zIndex: 16 }}
          />
          <div 
            className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-slate-200 dark:bg-slate-700 hover:bg-slate-400 rounded-bl transition-colors"
            data-handle="sw"
            style={{ zIndex: 16 }}
          />
          <div 
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-slate-200 dark:bg-slate-700 hover:bg-slate-400 rounded-br transition-colors"
            data-handle="se"
            style={{ zIndex: 16 }}
          />
        </div>

        {/* Draggable Teacher Desk */}
        <div 
          className={`absolute bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-lg shadow-md cursor-move select-none ${
            isDraggingTeacherDesk || isResizingTeacherDesk ? 'shadow-lg scale-105' : ''
          }`}
          style={{ 
            left: `${teacherDeskPosition.x}px`, 
            top: `${teacherDeskPosition.y}px`, 
            width: `${teacherDeskSize.width}px`, 
            height: `${teacherDeskSize.height}px`,
            zIndex: 20,
            transition: (isDraggingTeacherDesk || isResizingTeacherDesk) ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="teacher-desk"
          onMouseDown={handleTeacherDeskMouseDown}
        >
          <div className="flex flex-col items-center justify-center h-full text-amber-700 dark:text-amber-300">
            <div className="text-lg">🪑</div>
            <div className="text-xs font-medium">Teacher</div>
          </div>
          
          {/* Resize Handles */}
          <div 
            className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-400 rounded-tl transition-colors"
            data-handle="nw"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-400 rounded-tr transition-colors"
            data-handle="ne"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-400 rounded-bl transition-colors"
            data-handle="sw"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-400 rounded-br transition-colors"
            data-handle="se"
            style={{ zIndex: 21 }}
          />
        </div>

        {/* Draggable Door */}
        <div 
          className={`absolute bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600 rounded-lg shadow-md cursor-move select-none ${
            isDraggingDoor || isResizingDoor ? 'shadow-lg scale-105' : ''
          }`}
          style={{ 
            left: `${doorPosition.x}px`, 
            top: `${doorPosition.y}px`, 
            width: `${doorSize.width}px`, 
            height: `${doorSize.height}px`,
            zIndex: 20,
            transition: (isDraggingDoor || isResizingDoor) ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="door"
          onMouseDown={handleDoorMouseDown}
        >
          <div className="flex flex-col items-center justify-center h-full text-green-700 dark:text-green-300">
            <div className="text-3xl mb-1">🚪</div>
            <div className="text-[10px] font-medium text-center leading-tight">Door</div>
          </div>
          
          {/* Resize Handles */}
          <div 
            className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize bg-green-100 dark:bg-green-900/30 hover:bg-green-400 rounded-tl transition-colors"
            data-handle="nw"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-green-100 dark:bg-green-900/30 hover:bg-green-400 rounded-tr transition-colors"
            data-handle="ne"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-green-100 dark:bg-green-900/30 hover:bg-green-400 rounded-bl transition-colors"
            data-handle="sw"
            style={{ zIndex: 21 }}
          />
          <div 
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-green-100 dark:bg-green-900/30 hover:bg-green-400 rounded-br transition-colors"
            data-handle="se"
            style={{ zIndex: 21 }}
          />
        </div>

        {seats.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-4">👥</div>
              <div className="text-lg font-medium mb-2">No Students Added</div>
              <div className="text-sm">Upload student data to see the seating chart</div>
            </div>
          </div>
        ) : (
          seats.map((seat) => {
            const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
            // For custom desks that don't have a layout position, create a default one
            const fallbackPos: SeatPosition = {
              position: seat.position,
              x: seat.customX ?? 0,
              y: seat.customY ?? 0,
              rotation: 0
            };
            return renderSeat(seat, layoutPos || fallbackPos);
          })
        )}

        {/* Selection Box */}
        {isBoxSelecting && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-100 bg-opacity-20 pointer-events-none"
            style={{
              left: `${Math.min(boxSelectStart.x, boxSelectEnd.x)}px`,
              top: `${Math.min(boxSelectStart.y, boxSelectEnd.y)}px`,
              width: `${Math.abs(boxSelectEnd.x - boxSelectStart.x)}px`,
              height: `${Math.abs(boxSelectEnd.y - boxSelectStart.y)}px`,
              zIndex: 25
            }}
          />
        )}
      </div>
    </div>
  );
}