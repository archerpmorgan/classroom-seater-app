import type { Student } from "@shared/schema";

export interface SeatAssignment {
  position: number;
  studentId: string | null;
}

export function generateSeatingChart(
  students: Student[],
  strategy: string,
  totalSeats: number
): SeatAssignment[] {
  const seats: SeatAssignment[] = Array.from({ length: totalSeats }, (_, i) => ({
    position: i,
    studentId: null
  }));

  if (students.length === 0) {
    return seats;
  }

  let arrangement: Student[] = [];

  switch (strategy) {
    case 'mixed':
      arrangement = generateMixedAbilityArrangement(students);
      break;
    case 'skill-based':
      arrangement = generateSkillBasedArrangement(students);
      break;
    case 'language-support':
      arrangement = generateLanguageSupportArrangement(students);
      break;
    case 'collaborative':
      arrangement = generateCollaborativeArrangement(students);
      break;
    case 'random':
    default:
      arrangement = generateRandomArrangement(students);
      break;
  }

  // Assign students to seats
  arrangement.forEach((student, index) => {
    if (index < totalSeats) {
      seats[index].studentId = student.id;
    }
  });

  return seats;
}

function generateMixedAbilityArrangement(students: Student[]): Student[] {
  // Group students by skill level
  const beginners = students.filter(s => s.skillLevel === 'beginner');
  const intermediate = students.filter(s => s.skillLevel === 'intermediate');
  const advanced = students.filter(s => s.skillLevel === 'advanced');
  
  // Mix students by alternating skill levels
  const mixed: Student[] = [];
  const maxLength = Math.max(beginners.length, intermediate.length, advanced.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (advanced[i]) mixed.push(advanced[i]);
    if (beginners[i]) mixed.push(beginners[i]);
    if (intermediate[i]) mixed.push(intermediate[i]);
  }
  
  return mixed;
}

function generateSkillBasedArrangement(students: Student[]): Student[] {
  // Group students by skill level together
  const beginners = students.filter(s => s.skillLevel === 'beginner');
  const intermediate = students.filter(s => s.skillLevel === 'intermediate');
  const advanced = students.filter(s => s.skillLevel === 'advanced');
  
  return [...beginners, ...intermediate, ...advanced];
}

function generateLanguageSupportArrangement(students: Student[]): Student[] {
  // Group students who share languages
  const languageGroups = new Map<string, Student[]>();
  
  students.forEach(student => {
    const allLanguages = [student.primaryLanguage, ...student.secondaryLanguages];
    
    allLanguages.forEach(language => {
      if (!languageGroups.has(language)) {
        languageGroups.set(language, []);
      }
      languageGroups.get(language)!.push(student);
    });
  });
  
  // Arrange students to be near others who share their languages
  const arranged: Student[] = [];
  const used = new Set<string>();
  
  for (const [language, studentsInGroup] of languageGroups.entries()) {
    if (studentsInGroup.length > 1) {
      studentsInGroup.forEach(student => {
        if (!used.has(student.id)) {
          arranged.push(student);
          used.add(student.id);
        }
      });
    }
  }
  
  // Add remaining students
  students.forEach(student => {
    if (!used.has(student.id)) {
      arranged.push(student);
    }
  });
  
  return arranged;
}

function generateCollaborativeArrangement(students: Student[]): Student[] {
  const arranged: Student[] = [];
  const used = new Set<string>();
  
  // Start with students who have collaboration preferences
  students.forEach(student => {
    if (used.has(student.id)) return;
    
    if (student.worksWellWith.length > 0) {
      arranged.push(student);
      used.add(student.id);
      
      // Add their preferred partners nearby
      student.worksWellWith.forEach(partnerName => {
        const partner = students.find(s => 
          s.name.toLowerCase() === partnerName.toLowerCase() && !used.has(s.id)
        );
        if (partner) {
          arranged.push(partner);
          used.add(partner.id);
        }
      });
    }
  });
  
  // Add remaining students
  students.forEach(student => {
    if (!used.has(student.id)) {
      arranged.push(student);
    }
  });
  
  return arranged;
}

function generateRandomArrangement(students: Student[]): Student[] {
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function validateSeatingArrangement(
  seats: SeatAssignment[],
  students: Student[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const studentMap = new Map(students.map(s => [s.id, s]));
  
  // Check for avoid pairing violations
  seats.forEach((seat, index) => {
    if (!seat.studentId) return;
    
    const student = studentMap.get(seat.studentId);
    if (!student) return;
    
    // Check adjacent seats (basic adjacency check)
    const adjacentPositions = getAdjacentPositions(index, seats.length);
    
    adjacentPositions.forEach(adjPos => {
      const adjacentSeat = seats[adjPos];
      if (!adjacentSeat.studentId) return;
      
      const adjacentStudent = studentMap.get(adjacentSeat.studentId);
      if (!adjacentStudent) return;
      
      // Check if this pairing should be avoided
      if (student.avoidPairing.some(name => 
        name.toLowerCase() === adjacentStudent.name.toLowerCase()
      )) {
        violations.push(`${student.name} should not sit next to ${adjacentStudent.name}`);
      }
    });
  });
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

function getAdjacentPositions(position: number, totalSeats: number): number[] {
  // This is a simplified adjacency calculation
  // In a real implementation, you'd need to consider the actual grid layout
  const adjacent: number[] = [];
  
  // Assuming a grid layout, check left, right, above, below
  const cols = Math.ceil(Math.sqrt(totalSeats));
  const row = Math.floor(position / cols);
  const col = position % cols;
  
  // Left
  if (col > 0) adjacent.push(position - 1);
  // Right
  if (col < cols - 1 && position + 1 < totalSeats) adjacent.push(position + 1);
  // Above
  if (row > 0) adjacent.push(position - cols);
  // Below
  if (row < Math.floor((totalSeats - 1) / cols) && position + cols < totalSeats) {
    adjacent.push(position + cols);
  }
  
  return adjacent.filter(pos => pos >= 0 && pos < totalSeats);
}
