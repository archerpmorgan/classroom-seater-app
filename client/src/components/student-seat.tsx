import { Badge } from "@/components/ui/badge";
import type { Student } from "@shared/schema";

interface StudentSeatProps {
  student: Student;
  onDragStart: (student: Student) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  position: number;
  privacyMode?: boolean;
  onClick?: () => void;
  isFirstSwapSelection?: boolean;
}

export default function StudentSeat({
  student,
  onDragStart,
  onDragEnd,
  isDragging,
  position,
  privacyMode = false,
  onClick,
  isFirstSwapSelection = false
}: StudentSeatProps) {
  
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getFirstName = () => {
    return student.name.split(' ')[0];
  };

  const getPrimaryLanguageDisplay = () => {
    return student.primaryLanguage;
  };

  const getNameFontSize = () => {
    const firstName = getFirstName();
    const length = firstName.length;
    
    // Calculate font size based on name length
    // Seat width is about 80px, so we adjust accordingly
    if (length <= 4) return '13px';      // Short names - default size
    else if (length <= 6) return '12px'; // Medium names - slightly smaller
    else if (length <= 8) return '11px'; // Long names - smaller
    else if (length <= 10) return '10px'; // Very long names - much smaller
    else return '9px';                   // Extremely long names - minimum readable size
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
      className={`student-seat bg-white dark:bg-slate-800 border-4 border-slate-700 dark:border-slate-300 rounded-lg p-2 text-center shadow-lg min-w-20 min-h-20 flex flex-col justify-center ${
        isDragging ? 'opacity-50' : ''
      } ${isFirstSwapSelection ? 'ring-4 ring-blue-500 ring-offset-2' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      data-testid={`student-seat-${student.id}`}
      data-student-id={student.id}
      title={privacyMode ? `${student.name} (Seat ${position + 1})` : `${student.name} - ${student.skillLevel} - ${getPrimaryLanguageDisplay()}`}
    >
      {/* Always show student name */}
      <div className="font-bold text-slate-900 dark:text-white leading-tight" style={{fontSize: getNameFontSize()}}>
        {getFirstName()}
      </div>
      
      {!privacyMode && (
        // Normal mode: Show additional student information
        <>
          <div className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-tight font-medium" style={{fontSize: '10px'}}>
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
        </>
      )}
    </div>
  );
}
