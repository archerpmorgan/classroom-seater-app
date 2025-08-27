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
        // Dynamic rows based on student count
        const seatsPerRow = 5;
        const rowsNeeded = Math.ceil(seatCount / seatsPerRow);
        let position = 0;
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let col = 0; col < seatsPerRow && position < seatCount; col++) {
            positions.push({
              position: position++,
              x: col * 120 + 60,
              y: row * 100 + 60
            });
          }
        }
        break;
      }

      case 'stadium': {
        // V-shaped angled rows for better sightlines
        let position = 0;
        const rowSeats = [6, 7, 8, 7]; // Seats per row pattern
        
        for (let row = 0; row < 4 && position < seatCount; row++) {
          const seatsInThisRow = Math.min(rowSeats[row], seatCount - position);
          const startX = (6 - seatsInThisRow) * 60 + 60;
          const angleOffset = row * 20;
          
          for (let col = 0; col < seatsInThisRow; col++) {
            const centerCol = (seatsInThisRow - 1) / 2;
            const distanceFromCenter = Math.abs(col - centerCol);
            
            positions.push({
              position: position++,
              x: startX + col * 120 + (row > 0 ? distanceFromCenter * angleOffset : 0),
              y: row * 120 + 60,
              rotation: row > 0 ? (col < centerCol ? -5 : col > centerCol ? 5 : 0) : 0
            });
          }
        }
        break;
      }

      case 'horseshoe': {
        // U-shaped arrangement for discussions
        const centerX = 350;
        const centerY = 250;
        const radius = 180;
        const angleStep = Math.PI / (seatCount - 1);
        const startAngle = Math.PI; // Start from left side
        
        for (let i = 0; i < seatCount; i++) {
          const angle = startAngle - i * angleStep;
          positions.push({
            position: i,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        break;
      }

      case 'double-horseshoe': {
        // Inner and outer horseshoe rings
        const centerX = 350;
        const centerY = 250;
        let position = 0;
        
        // Inner horseshoe (16 seats)
        const innerRadius = 140;
        const innerSeats = 16;
        const innerAngleStep = Math.PI / (innerSeats - 1);
        
        for (let i = 0; i < innerSeats; i++) {
          const angle = Math.PI - i * innerAngleStep;
          positions.push({
            position: position++,
            x: centerX + Math.cos(angle) * innerRadius,
            y: centerY + Math.sin(angle) * innerRadius,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        
        // Outer horseshoe (16 seats)
        const outerRadius = 220;
        const outerSeats = 16;
        const outerAngleStep = Math.PI / (outerSeats - 1);
        
        for (let i = 0; i < outerSeats; i++) {
          const angle = Math.PI - i * outerAngleStep;
          positions.push({
            position: position++,
            x: centerX + Math.cos(angle) * outerRadius,
            y: centerY + Math.sin(angle) * outerRadius,
            rotation: (angle - Math.PI/2) * 180 / Math.PI
          });
        }
        break;
      }

      case 'circle': {
        // Complete circle for democratic discussions
        const centerX = 350;
        const centerY = 250;
        const radius = 160;
        const angleStep = (2 * Math.PI) / seatCount;
        
        for (let i = 0; i < seatCount; i++) {
          const angle = i * angleStep - Math.PI/2; // Start at top
          positions.push({
            position: i,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
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
        // Dynamic pairs based on student count
        let position = 0;
        const pairsNeeded = Math.ceil(seatCount / 2);
        const rowsNeeded = Math.ceil(pairsNeeded / 2);
        
        for (let row = 0; row < rowsNeeded && position < seatCount; row++) {
          for (let pairCol = 0; pairCol < 2 && position < seatCount; pairCol++) {
            for (let seat = 0; seat < 2 && position < seatCount; seat++) {
              positions.push({
                position: position++,
                x: pairCol * 300 + seat * 80 + 150,
                y: row * 100 + 60,
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
      {/* Teacher Area Indicator */}
      <div 
        className="absolute top-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-medium text-primary z-10"
        style={{ zIndex: 10 }}
      >
        📋 Teacher Area
      </div>
      
      <div 
        className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border p-4 overflow-hidden"
        style={{ width: `${maxX}px`, height: `${maxY}px`, minHeight: '500px' }}
        data-testid="seating-chart-grid"
      >
        {seats.map((seat) => {
          const layoutPos = layoutPositions.find(pos => pos.position === seat.position);
          return layoutPos ? renderSeat(seat, layoutPos) : null;
        })}
      </div>
    </div>
  );
}