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
    case 'mixed-ability':
      arrangement = generateMixedAbilityArrangement(students);
      break;
    case 'skill-clustering':
      arrangement = generateSkillClusteringArrangement(students);
      break;
    case 'language-support':
      arrangement = generateLanguageSupportArrangement(students);
      break;
    case 'collaborative-pairs':
      arrangement = generateCollaborativeArrangement(students);
      break;
    case 'attention-zone':
      arrangement = generateAttentionZoneArrangement(students, totalSeats);
      break;
    case 'behavior-management':
      arrangement = generateBehaviorManagementArrangement(students, totalSeats);
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
  
  // Mix students by alternating skill levels while respecting avoid constraints
  const mixed: Student[] = [];
  const maxLength = Math.max(beginners.length, intermediate.length, advanced.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (advanced[i] && canPlaceStudent(advanced[i], mixed)) mixed.push(advanced[i]);
    if (beginners[i] && canPlaceStudent(beginners[i], mixed)) mixed.push(beginners[i]);
    if (intermediate[i] && canPlaceStudent(intermediate[i], mixed)) mixed.push(intermediate[i]);
  }
  
  // Add any remaining students who weren't placed due to constraints
  const allGroups = [...beginners, ...intermediate, ...advanced];
  allGroups.forEach(student => {
    if (!mixed.includes(student)) {
      mixed.push(student);
    }
  });
  
  return mixed;
}

function generateSkillClusteringArrangement(students: Student[]): Student[] {
  // Group students by skill level together for targeted instruction
  const beginners = students.filter(s => s.skillLevel === 'beginner');
  const intermediate = students.filter(s => s.skillLevel === 'intermediate');
  const advanced = students.filter(s => s.skillLevel === 'advanced');
  
  // Arrange so similar levels are clustered for differentiated instruction
  return [...beginners, ...intermediate, ...advanced];
}

function generateLanguageSupportArrangement(students: Student[]): Student[] {
  // Group students who share languages
  const languageGroups = new Map<string, Student[]>();
  
  students.forEach(student => {
    const allLanguages = [student.primaryLanguage, ...(student.secondaryLanguages || [])];
    
    allLanguages.forEach(language => {
      if (!languageGroups.has(language)) {
        languageGroups.set(language, []);
      }
      languageGroups.get(language)!.push(student);
    });
  });
  
  // Arrange students to be near others who share their languages, avoiding conflicts
  const arranged: Student[] = [];
  const used = new Set<string>();
  
  for (const [language, studentsInGroup] of Array.from(languageGroups.entries())) {
    if (studentsInGroup.length > 1) {
      studentsInGroup.forEach((student: Student) => {
        if (!used.has(student.id) && canPlaceStudent(student, arranged.slice(-2))) {
          arranged.push(student);
          used.add(student.id);
        }
      });
    }
  }
  
  // Add remaining students, checking for avoid conflicts
  students.forEach(student => {
    if (!used.has(student.id)) {
      if (canPlaceStudent(student, arranged.slice(-2))) {
        arranged.push(student);
      } else {
        // Insert with spacing to avoid conflicts
        const safeIndex = Math.max(0, arranged.length - 2);
        arranged.splice(safeIndex, 0, student);
      }
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
    
    if ((student.worksWellWith?.length || 0) > 0) {
      arranged.push(student);
      used.add(student.id);
      
      // Add their preferred partners nearby, but check avoid constraints
      (student.worksWellWith || []).forEach(partnerName => {
        const partner = students.find(s => 
          s.name.toLowerCase() === partnerName.toLowerCase() && !used.has(s.id)
        );
        if (partner && !hasAvoidConflict(student, partner)) {
          arranged.push(partner);
          used.add(partner.id);
        }
      });
    }
  });
  
  // Add remaining students, checking for avoid conflicts with recently placed students
  students.forEach(student => {
    if (!used.has(student.id)) {
      if (canPlaceStudent(student, arranged.slice(-2))) { // Check last 2 students for adjacency
        arranged.push(student);
      } else {
        // Insert with some spacing
        arranged.splice(-1, 0, student);
      }
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

// Helper function to check if two students should avoid being paired
function hasAvoidConflict(student1: Student, student2: Student): boolean {
  const student1Avoids = (student1.avoidPairing || []).map(name => name.toLowerCase());
  const student2Avoids = (student2.avoidPairing || []).map(name => name.toLowerCase());
  
  return student1Avoids.includes(student2.name.toLowerCase()) ||
         student2Avoids.includes(student1.name.toLowerCase());
}

// Helper function to check if a student can be placed near recently added students
function canPlaceStudent(student: Student, recentlyPlaced: Student[]): boolean {
  // Check if this student conflicts with any of the recently placed students
  return !recentlyPlaced.some(placedStudent => hasAvoidConflict(student, placedStudent));
}

function generateAttentionZoneArrangement(students: Student[], totalSeats: number): Student[] {
  // Place students who need more attention in the front-center "action zone"
  const needsAttention = students.filter(s => 
    s.skillLevel === 'beginner' || 
    (s.notes && s.notes.toLowerCase().includes('attention')) ||
    (s.notes && s.notes.toLowerCase().includes('support'))
  );
  
  const others = students.filter(s => !needsAttention.includes(s));
  
  // Advanced students can be placed in back where they can work independently
  const advanced = others.filter(s => s.skillLevel === 'advanced');
  const remaining = others.filter(s => s.skillLevel !== 'advanced');
  
  // Arrange: attention-needing students first (front), then remaining, then advanced (back)
  return [...needsAttention, ...remaining, ...advanced];
}

function generateBehaviorManagementArrangement(students: Student[], totalSeats: number): Student[] {
  const arranged: Student[] = [];
  const used = new Set<string>();
  
  // First, identify students with avoidance constraints
  const studentsWithConstraints = students.filter(s => (s.avoidPairing || []).length > 0);
  const studentsWithoutConstraints = students.filter(s => (s.avoidPairing || []).length === 0);
  
  // Place constrained students first, ensuring separation
  studentsWithConstraints.forEach(student => {
    if (!used.has(student.id)) {
      // Check if this student can be safely placed
      if (canPlaceStudent(student, arranged.slice(-3))) { // Check last 3 for more spacing
        arranged.push(student);
        used.add(student.id);
        
        // Add buffer students (those without constraints) to separate problem pairs
        const availableBuffers = studentsWithoutConstraints.filter(s => 
          !used.has(s.id) && canPlaceStudent(s, [student])
        );
        if (availableBuffers.length > 0) {
          arranged.push(availableBuffers[0]);
          used.add(availableBuffers[0].id);
        }
      }
    }
  });
  
  // Add remaining constrained students who couldn't be placed initially
  studentsWithConstraints.forEach(student => {
    if (!used.has(student.id)) {
      // Place with maximum spacing
      const safeIndex = Math.max(0, arranged.length - 3);
      arranged.splice(safeIndex, 0, student);
      used.add(student.id);
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

export function validateSeatingArrangement(
  seats: SeatAssignment[],
  students: Student[],
  layoutType?: string
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const studentMap = new Map(students.map(s => [s.id, s]));
  
  // Check for avoid pairing violations with layout-aware adjacency
  seats.forEach((seat, index) => {
    if (!seat.studentId) return;
    
    const student = studentMap.get(seat.studentId);
    if (!student) return;
    
    // Check adjacent seats with layout-specific adjacency
    const adjacentPositions = getAdjacentPositions(index, seats.length, layoutType);
    
    adjacentPositions.forEach(adjPos => {
      const adjacentSeat = seats[adjPos];
      if (!adjacentSeat.studentId) return;
      
      const adjacentStudent = studentMap.get(adjacentSeat.studentId);
      if (!adjacentStudent) return;
      
      // Check if this pairing should be avoided
      if ((student.avoidPairing || []).some(name => 
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

function getAdjacentPositions(position: number, totalSeats: number, layoutType?: string): number[] {
  const adjacent: number[] = [];
  
  // Layout-specific adjacency calculations based on your document's research
  if (layoutType === 'traditional-rows') {
    // 6 columns, 5 rows - check immediate neighbors
    const cols = 6;
    const row = Math.floor(position / cols);
    const col = position % cols;
    
    // Left and right in same row
    if (col > 0) adjacent.push(position - 1);
    if (col < cols - 1 && position + 1 < totalSeats) adjacent.push(position + 1);
    // Above and below
    if (row > 0) adjacent.push(position - cols);
    if (position + cols < totalSeats) adjacent.push(position + cols);
  } else if (layoutType === 'horseshoe') {
    // U-shape has different adjacency patterns
    const cols = 8;
    const row = Math.floor(position / cols);
    const col = position % cols;
    
    // More complex adjacency for horseshoe shape
    if (col > 0) adjacent.push(position - 1);
    if (col < cols - 1 && position + 1 < totalSeats) adjacent.push(position + 1);
    if (row === 0) {
      // Front row of horseshoe - students can see each other across
      if (col < 3 && position + (6 - 2 * col) < totalSeats) {
        adjacent.push(position + (6 - 2 * col));
      }
    }
  } else {
    // Default grid adjacency
    const cols = Math.ceil(Math.sqrt(totalSeats));
    const row = Math.floor(position / cols);
    const col = position % cols;
    
    if (col > 0) adjacent.push(position - 1);
    if (col < cols - 1 && position + 1 < totalSeats) adjacent.push(position + 1);
    if (row > 0) adjacent.push(position - cols);
    if (position + cols < totalSeats) adjacent.push(position + cols);
  }
  
  return adjacent.filter(pos => pos >= 0 && pos < totalSeats);
}

// Enhanced validation considering the research insights from your document
export function assessSeatingEffectiveness(
  seats: SeatAssignment[],
  students: Student[],
  strategy: string,
  layoutType: string
): { score: number; insights: string[] } {
  const studentMap = new Map(students.map(s => [s.id, s]));
  const insights: string[] = [];
  let score = 100;
  
  // Analyze attention zone effectiveness (front-center positions)
  const frontCenterPositions = getFrontCenterPositions(seats.length, layoutType);
  const studentsInActionZone = frontCenterPositions
    .map(pos => seats[pos]?.studentId)
    .filter(Boolean)
    .map(id => studentMap.get(id!))
    .filter(Boolean);
    
  const beginnersInActionZone = studentsInActionZone.filter(s => s!.skillLevel === 'beginner').length;
  const totalBeginners = students.filter(s => s.skillLevel === 'beginner').length;
  
  if (totalBeginners > 0) {
    const actionZoneUtilization = beginnersInActionZone / totalBeginners;
    if (actionZoneUtilization > 0.7) {
      insights.push('Excellent use of attention zone - most struggling students positioned for maximum teacher interaction');
    } else if (actionZoneUtilization < 0.3) {
      insights.push('Consider moving more struggling students to front-center action zone');
      score -= 15;
    }
  }
  
  // Check constraint violations
  const violations = validateSeatingArrangement(seats, students).violations;
  score -= violations.length * 10;
  if (violations.length > 0) {
    insights.push(`${violations.length} seating constraint violations detected`);
  }
  
  // Assess skill distribution based on strategy
  if (strategy === 'mixed-ability') {
    const mixingScore = assessSkillMixing(seats, students);
    score += mixingScore - 50; // Base expectation
    if (mixingScore > 70) {
      insights.push('Good skill level mixing promotes peer learning opportunities');
    }
  }
  
  return { score: Math.max(0, Math.min(100, score)), insights };
}

function getFrontCenterPositions(totalSeats: number, layoutType: string): number[] {
  // Return positions that are in the "action zone" based on layout
  switch (layoutType) {
    case 'traditional-rows':
      return [0, 1, 2, 3, 6, 7, 8, 9]; // Front two rows, center positions
    case 'horseshoe':
      return [0, 1, 2, 3, 4, 5, 6, 7]; // Inner curve positions
    case 'circle':
      return [0, 1, 2, 3, 12, 13, 14, 15]; // Positions facing teacher
    default:
      return Array.from({length: Math.min(8, totalSeats)}, (_, i) => i);
  }
}

function assessSkillMixing(seats: SeatAssignment[], students: Student[]): number {
  const studentMap = new Map(students.map(s => [s.id, s]));
  let mixingScore = 0;
  let totalComparisons = 0;
  
  seats.forEach((seat, index) => {
    if (!seat.studentId) return;
    
    const student = studentMap.get(seat.studentId);
    if (!student) return;
    
    const adjacent = getAdjacentPositions(index, seats.length);
    adjacent.forEach(adjPos => {
      const adjSeat = seats[adjPos];
      if (!adjSeat.studentId) return;
      
      const adjStudent = studentMap.get(adjSeat.studentId);
      if (!adjStudent) return;
      
      totalComparisons++;
      if (student.skillLevel !== adjStudent.skillLevel) {
        mixingScore += 2; // Reward mixed ability pairing
      }
    });
  });
  
  return totalComparisons > 0 ? (mixingScore / totalComparisons) * 50 : 0;
}
