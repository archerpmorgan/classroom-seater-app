import { useState } from "react";
import StudentSeat from "./student-seat";
import type { Student } from "@shared/schema";

interface SeatingChartGridProps {
  layout: 'traditional-rows' | 'stadium' | 'horseshoe' | 'double-horseshoe' | 'circle' | 'groups' | 'pairs';
  students: Student[];
  currentChart: {position: number, studentId: string | null}[];
  onChartChange: (chart: {position: number, studentId: string | null}[]) => void;
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
  onChartChange 
}: SeatingChartGridProps) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

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

  const generateLayoutPositions = (layoutType: string, seatCount: number): SeatPosition[] => {
    const positions: SeatPosition[] = [];

    switch (layoutType) {
      case 'traditional-rows': {
        // Dynamic rows based on student count - avoid teacher desk area
        const seatsPerRow = 5;
        const rowsNeeded = Math.ceil(seatCount / seatsPerRow);
        let position = 0;
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let col = 0; col < seatsPerRow && position < seatCount; col++) {
            // Start further right to avoid teacher desk (20-100px wide)
            // Start lower to avoid whiteboard area (top 60px)
            positions.push({
              position: position++,
              x: col * 120 + 120, // Start at x=120 instead of 60
              y: row * 100 + 100  // Start at y=100 instead of 60
            });
          }
        }
        break;
      }

      case 'stadium': {
        // V-shaped angled rows for better sightlines - avoid overlaps
        let position = 0;
        const rowSeats = [5, 6, 7, 6]; // Slightly fewer seats per row
        
        for (let row = 0; row < 4 && position < seatCount; row++) {
          const seatsInThisRow = Math.min(rowSeats[row], seatCount - position);
          const startX = (6 - seatsInThisRow) * 60 + 120; // Start further right
          const angleOffset = row * 20;
          
          for (let col = 0; col < seatsInThisRow; col++) {
            const centerCol = (seatsInThisRow - 1) / 2;
            const distanceFromCenter = Math.abs(col - centerCol);
            
            positions.push({
              position: position++,
              x: startX + col * 120 + (row > 0 ? distanceFromCenter * angleOffset : 0),
              y: row * 120 + 100, // Start lower to avoid whiteboard
              rotation: row > 0 ? (col < centerCol ? -5 : col > centerCol ? 5 : 0) : 0
            });
          }
        }
        break;
      }

      case 'horseshoe': {
        // U-shaped arrangement for discussions - ensure proper spacing
        const centerX = 400;
        const centerY = 280;
        const radius = 180;
        const angleStep = Math.PI / Math.max(seatCount - 1, 1);
        const startAngle = Math.PI; // Start from left side
        
        for (let i = 0; i < seatCount; i++) {
          const angle = startAngle - i * angleStep;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Ensure seats don't go into teacher desk area (top-left)
          const adjustedX = Math.max(x, 140); // Keep away from teacher desk
          const adjustedY = Math.max(y, 120); // Keep below whiteboard
          
          positions.push({
            position: i,
            x: adjustedX,
            y: adjustedY,
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
          const x = centerX + Math.cos(angle) * innerRadius;
          const y = centerY + Math.sin(angle) * innerRadius;
          
          positions.push({
            position: position++,
            x: Math.max(x, 140),
            y: Math.max(y, 120),
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        
        // Outer horseshoe
        const outerRadius = 240;
        const outerAngleStep = Math.PI / Math.max(outerSeats - 1, 1);
        
        for (let i = 0; i < outerSeats && position < seatCount; i++) {
          const angle = Math.PI - i * outerAngleStep;
          const x = centerX + Math.cos(angle) * outerRadius;
          const y = centerY + Math.sin(angle) * outerRadius;
          
          positions.push({
            position: position++,
            x: Math.max(x, 140),
            y: Math.max(y, 120),
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        break;
      }

      case 'circle': {
        // Complete circle for democratic discussions - avoid overlaps
        const centerX = 400;
        const centerY = 280;
        const radius = 160;
        const angleStep = (2 * Math.PI) / seatCount;
        
        for (let i = 0; i < seatCount; i++) {
          const angle = i * angleStep - Math.PI/2; // Start at top
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Ensure seats don't overlap with teacher area
          const adjustedX = Math.max(x, 140);
          const adjustedY = Math.max(y, 120);
          
          positions.push({
            position: i,
            x: adjustedX,
            y: adjustedY,
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
          { x: 150, y: 120 }, { x: 400, y: 120 }, { x: 650, y: 120 },
          { x: 150, y: 320 }, { x: 400, y: 320 }, { x: 650, y: 320 }
        ];
        
        for (let g = 0; g < groupsNeeded && g < groupPositions.length; g++) {
          const groupCenter = groupPositions[g];
          const seats = [
            { x: -40, y: -30 }, { x: 40, y: -30 },
            { x: -40, y: 30 }, { x: 40, y: 30 }
          ];
          
          seats.forEach(seatOffset => {
            positions.push({
              position: position++,
              x: groupCenter.x + seatOffset.x,
              y: groupCenter.y + seatOffset.y,
              rotation: 0
            });
          });
        }
        break;
      }

      case 'pairs': {
        // Dynamic pairs based on student count - avoid overlaps
        let position = 0;
        const pairsNeeded = Math.ceil(seatCount / 2);
        const rowsNeeded = Math.ceil(pairsNeeded / 2);
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let pairCol = 0; pairCol < 2 && position < seatCount; pairCol++) {
            for (let seat = 0; seat < 2 && position < seatCount; seat++) {
              positions.push({
                position: position++,
                x: pairCol * 280 + seat * 80 + 160, // Adjust spacing and start position
                y: row * 120 + 100, // Start lower to avoid teacher area
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
  const totalSeats = getSeatCount(layout, studentCount);
  const layoutPositions = generateLayoutPositions(layout, totalSeats);
  
  // Initialize seats if empty
  const seats = currentChart.length > 0 
    ? currentChart 
    : Array.from({ length: totalSeats }, (_, i) => ({ position: i, studentId: null }));

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
        <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
          <span className="text-xs text-muted-foreground">{seat.position + 1}</span>
        </div>
      </div>
    );
  };

  // Calculate classroom dimensions based on layout positions
  const maxX = Math.max(...layoutPositions.map(p => p.x)) + 100;
  const maxY = Math.max(...layoutPositions.map(p => p.y)) + 100;

  return (
    <div className="classroom-container">
      <div 
        className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border p-4 overflow-hidden"
        style={{ width: `${maxX}px`, height: `${maxY}px`, minHeight: '500px' }}
        data-testid="seating-chart-grid"
      >
        {/* Teacher Desk - Upper Left Corner */}
        <div 
          className="absolute bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-lg shadow-md"
          style={{ 
            left: '20px', 
            top: '20px', 
            width: '80px', 
            height: '60px',
            zIndex: 15 
          }}
          data-testid="teacher-desk"
        >
          <div className="flex flex-col items-center justify-center h-full text-amber-700 dark:text-amber-300">
            <div className="text-lg">🪑</div>
            <div className="text-xs font-medium">Teacher</div>
          </div>
        </div>

        {/* Whiteboard - Front Center */}
        <div 
          className="absolute bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded-md shadow-lg"
          style={{ 
            left: '50%', 
            top: '15px', 
            width: '200px', 
            height: '40px',
            transform: 'translateX(-50%)',
            zIndex: 15 
          }}
          data-testid="whiteboard"
        >
          <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-300">
            <div className="text-sm font-medium">📋 Whiteboard</div>
          </div>
        </div>

        {seats.map((seat) => {
          const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
          return layoutPos ? renderSeat(seat, layoutPos) : null;
        })}
      </div>
    </div>
  );
}