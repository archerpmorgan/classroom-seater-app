import { useState } from "react";
import StudentSeat from "./student-seat";
import type { Student } from "@shared/schema";

interface SeatingChartGridProps {
  layout: 'rows' | 'groups' | 'u-shape';
  students: Student[];
  currentChart: {position: number, studentId: string | null}[];
  onChartChange: (chart: {position: number, studentId: string | null}[]) => void;
}

export default function SeatingChartGrid({ 
  layout, 
  students, 
  currentChart, 
  onChartChange 
}: SeatingChartGridProps) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  const totalSeats = layout === 'rows' ? 24 : layout === 'groups' ? 16 : 32;
  
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

  const getLayoutClass = () => {
    switch (layout) {
      case 'rows': return 'rows-layout';
      case 'groups': return 'groups-layout';
      case 'u-shape': return 'u-shape-layout';
      default: return 'rows-layout';
    }
  };

  const renderSeat = (seat: {position: number, studentId: string | null}, index: number) => {
    const student = getStudentById(seat.studentId);
    const isDropZone = !student;
    const isDragOver = dragOverPosition === index;

    if (student) {
      return (
        <StudentSeat
          key={`seat-${index}`}
          student={student}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          isDragging={draggedStudent?.id === student.id}
          position={index}
        />
      );
    }

    return (
      <div
        key={`empty-${index}`}
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        data-testid={`drop-zone-${index}`}
      >
        <span className="text-xs text-muted-foreground">Empty</span>
      </div>
    );
  };

  return (
    <div 
      className={`classroom-grid ${getLayoutClass()}`}
      data-testid="seating-chart-grid"
    >
      {seats.map((seat, index) => renderSeat(seat, index))}
    </div>
  );
}
