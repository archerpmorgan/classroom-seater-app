import { Badge } from "@/components/ui/badge";
import type { Student } from "@shared/schema";

interface StudentSeatProps {
  student: Student;
  onDragStart: (student: Student) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  position: number;
}

export default function StudentSeat({ 
  student, 
  onDragStart, 
  onDragEnd, 
  isDragging,
  position 
}: StudentSeatProps) {
  
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-primary';
      case 'intermediate': return 'bg-accent';
      case 'advanced': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  const getFirstName = () => {
    return student.name.split(' ')[0];
  };

  const getPrimaryLanguageDisplay = () => {
    return student.primaryLanguage;
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(student);
    // Add visual feedback
    e.currentTarget.classList.add('drag-preview');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd();
    e.currentTarget.classList.remove('drag-preview');
  };

  return (
    <div
      className={`student-seat bg-background border-2 border-border rounded-lg p-2 text-center shadow-sm min-w-20 min-h-20 flex flex-col justify-center ${
        isDragging ? 'opacity-50' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid={`student-seat-${student.id}`}
      data-student-id={student.id}
      title={`${student.name} - ${student.skillLevel} - ${getPrimaryLanguageDisplay()}`}
    >
      <div className="text-sm font-bold text-foreground leading-tight" style={{fontSize: '13px'}}>
        {getFirstName()}
      </div>
      <div className="text-xs text-muted-foreground mt-1 leading-tight" style={{fontSize: '10px'}}>
        {getPrimaryLanguageDisplay()}
      </div>
      <div className="flex justify-center mt-1">
        <span 
          className={`inline-block w-2 h-2 rounded-full ${getSkillLevelColor(student.skillLevel)}`}
          title={student.skillLevel}
        />
      </div>
      
      {/* Show compatibility indicators if present */}
      {((student.worksWellWith?.length || 0) > 0 || (student.avoidPairing?.length || 0) > 0) && (
        <div className="flex justify-center mt-1 space-x-1">
          {(student.worksWellWith?.length || 0) > 0 && (
            <span className="text-xs text-green-600" title="Has preferred partners">
              ✓
            </span>
          )}
          {(student.avoidPairing?.length || 0) > 0 && (
            <span className="text-xs text-red-600" title="Has constraints">
              ⚠
            </span>
          )}
        </div>
      )}
    </div>
  );
}
