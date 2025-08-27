# Future Improvements for Seating Chart Generator

## Planned Features to Add

### 1. Interactive Layout/Strategy Selection Flowchart
- Create an interactive decision tree to help teachers choose the best layout and grouping strategy
- Guide questions could include:
  - What's the main activity for today? (lecture, group work, discussion, test)
  - Do you have students who need language support?
  - Are there behavioral concerns to address?
  - What's your primary goal? (engagement, focus, collaboration, etc.)
- Visual flowchart that recommends optimal layout + strategy combinations
- Could be implemented as a modal dialog or separate page

### 2. Privacy Mode for Seating Charts
- Add a "Privacy View" toggle button to hide student metadata
- When enabled, show only:
  - Seat positions and numbers
  - Empty seats vs occupied seats
  - Layout structure
- Hide sensitive information:
  - Student names
  - Skill levels
  - Language information
  - Behavioral notes
- Useful when projecting or when others are looking over shoulder

### 3. Enhanced Print Functionality
- Improve current print layout for better paper output
- Add print options:
  - Include/exclude student metadata
  - Different paper sizes (A4, Letter, etc.)
  - Portrait vs landscape orientation
  - Multiple charts per page
- Consider adding a dedicated print preview page
- Optimize styling specifically for print media

### 4. CSV Export After Editing
- Allow teachers to export the current seating arrangement back to CSV
- Include columns for:
  - Student name
  - Seat position/number
  - Row/group information
  - Date of arrangement
- Could be useful for:
  - Record keeping
  - Sharing with substitute teachers
  - Parent-teacher conferences
  - Progress tracking over time

## Implementation Priority
1. Privacy Mode (relatively simple UI toggle)
2. CSV Export (data formatting and download)
3. Enhanced Print Function (CSS and layout improvements)
4. Interactive Flowchart (more complex UI component)

## Technical Considerations
- Privacy mode: Add state management for view mode toggle
- CSV export: Use existing CSV libraries, format current seating data
- Print improvements: CSS media queries and print-specific styling
- Flowchart: Consider using a library like React Flow or build custom decision tree component