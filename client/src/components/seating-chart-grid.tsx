import { useState } from "react";
import StudentSeat from "./student-seat";
import type { Student } from "@shared/schema";

interface SeatingChartGridProps {
  layout: 'traditional-rows' | 'stadium' | 'horseshoe' | 'double-horseshoe' | 'circle' | 'groups' | 'pairs';
  students: Student[];
  currentChart: {position: number, studentId: string | null}[];
  onChartChange: (chart: {position: number, studentId: string | null}[]) => void;
  privacyMode?: boolean;
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
  privacyMode
}: SeatingChartGridProps) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [teacherDeskPosition, setTeacherDeskPosition] = useState({ x: 50, y: 80 });
  const [isDraggingTeacherDesk, setIsDraggingTeacherDesk] = useState(false);
  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 350, y: 15 });
  const [isDraggingWhiteboard, setIsDraggingWhiteboard] = useState(false);
  const [doorPosition, setDoorPosition] = useState({ x: 820, y: 80 });
  const [isDraggingDoor, setIsDraggingDoor] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
      ? Array.from({ length: totalSeats }, (_, i) => ({ position: i, studentId: null }))
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
    setIsDraggingTeacherDesk(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + teacherDeskPosition.x),
        y: e.clientY - (containerRect.top + teacherDeskPosition.y)
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTeacherDesk) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setTeacherDeskPosition({
        x: Math.max(0, Math.min(900 - 100, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - 80, e.clientY - containerRect.top - dragOffset.y))
      });
    } else if (isDraggingWhiteboard) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setWhiteboardPosition({
        x: Math.max(0, Math.min(900 - 200, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - 40, e.clientY - containerRect.top - dragOffset.y))
      });
    } else if (isDraggingDoor) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      setDoorPosition({
        x: Math.max(0, Math.min(900 - 45, e.clientX - containerRect.left - dragOffset.x)),
        y: Math.max(0, Math.min(600 - 120, e.clientY - containerRect.top - dragOffset.y))
      });
    }
  };

  const handleTeacherDeskMouseUp = () => {
    setIsDraggingTeacherDesk(false);
  };

  const handleWhiteboardMouseDown = (e: React.MouseEvent) => {
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
    setIsDraggingDoor(true);
    const containerRect = e.currentTarget.closest('[data-testid="seating-chart-grid"]')?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - (containerRect.left + doorPosition.x),
        y: e.clientY - (containerRect.top + doorPosition.y)
      });
    }
  };

  const handleContainerMouseUp = () => {
    setIsDraggingTeacherDesk(false);
    setIsDraggingWhiteboard(false);
    setIsDraggingDoor(false);
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
      // Swap students
      newChart[currentPosition] = { ...newChart[currentPosition], studentId: targetSeat.studentId };
    }
    
    newChart[targetPosition] = { ...newChart[targetPosition], studentId: draggedStudent.id };
    
    onChartChange(newChart);
  };

  const renderSeat = (seat: {position: number, studentId: string | null}, layoutPos: SeatPosition) => {
    const student = getStudentById(seat.studentId);
    const isDragOver = dragOverPosition === seat.position;
    const seatStyle = {
      position: 'absolute' as const,
      left: `${layoutPos.x}px`,
      top: `${layoutPos.y}px`,
      transform: layoutPos.rotation ? `rotate(${layoutPos.rotation}deg)` : undefined,
      transformOrigin: 'center',
      transition: 'all 0.3s ease'
    };

    if (student) {
      return (
        <div key={`seat-${seat.position}`} style={seatStyle}>
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
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, seat.position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, seat.position)}
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
        className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border p-4 overflow-hidden"
        style={{ width: `${roomWidth}px`, height: `${roomHeight}px`, minHeight: '500px' }}
        data-testid="seating-chart-grid"
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >


        {/* Draggable Whiteboard */}
        <div 
          className={`absolute bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-md shadow-lg cursor-move select-none ${
            isDraggingWhiteboard ? 'shadow-xl scale-105' : ''
          }`}
          style={{ 
            left: `${whiteboardPosition.x}px`, 
            top: `${whiteboardPosition.y}px`, 
            width: '200px', 
            height: '40px',
            zIndex: 15,
            transition: isDraggingWhiteboard ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="whiteboard"
          onMouseDown={handleWhiteboardMouseDown}
        >
          <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-300">
            <div className="text-sm font-medium">📋 Whiteboard</div>
          </div>
        </div>

        {/* Draggable Teacher Desk */}
        <div 
          className={`absolute bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-lg shadow-md cursor-move select-none ${
            isDraggingTeacherDesk ? 'shadow-lg scale-105' : ''
          }`}
          style={{ 
            left: `${teacherDeskPosition.x}px`, 
            top: `${teacherDeskPosition.y}px`, 
            width: '100px', 
            height: '80px',
            zIndex: 20,
            transition: isDraggingTeacherDesk ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="teacher-desk"
          onMouseDown={handleTeacherDeskMouseDown}
        >
          <div className="flex flex-col items-center justify-center h-full text-amber-700 dark:text-amber-300">
            <div className="text-lg">🪑</div>
            <div className="text-xs font-medium">Teacher</div>
          </div>
        </div>

        {/* Draggable Door */}
        <div 
          className={`absolute bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600 rounded-lg shadow-md cursor-move select-none ${
            isDraggingDoor ? 'shadow-lg scale-105' : ''
          }`}
          style={{ 
            left: `${doorPosition.x}px`, 
            top: `${doorPosition.y}px`, 
            width: '45px', 
            height: '120px',
            zIndex: 20,
            transition: isDraggingDoor ? 'none' : 'transform 0.2s ease'
          }}
          data-testid="door"
          onMouseDown={handleDoorMouseDown}
        >
          <div className="flex flex-col items-center justify-center h-full text-green-700 dark:text-green-300">
            <div className="text-3xl mb-1">🚪</div>
            <div className="text-[10px] font-medium text-center leading-tight">Door</div>
          </div>
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
            return layoutPos ? renderSeat(seat, layoutPos) : null;
          })
        )}
      </div>
    </div>
  );
}