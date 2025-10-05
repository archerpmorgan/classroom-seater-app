# Classroom Seater

An intelligent classroom seating chart generator that helps educators create optimal learning environments through research-backed seating strategies, flexible layouts, and powerful interactive tools.

## ✨ Key Features

### 🧠 Intelligent Seating Algorithms
- **Mixed Ability Grouping**: Strategic pairing of different skill levels for peer learning
- **Skill Clustering**: Groups students with similar abilities for targeted instruction
- **Language Support**: Places students who share the same primary language together for mutual support
- **Collaborative Pairs**: Positions students who work well together based on preferences
- **Attention Zone**: Places students needing support in high-engagement front-center areas
- **Behavior Management**: Strategic separation to minimize disruptions
- **Random Assignment**: Breaks up social cliques and creates new working relationships

### 🎨 Multiple Layout Options
- **Traditional Rows**: Classic classroom setup for direct instruction (30 seats)
- **Stadium/V-Shape**: Angled rows for better sightlines (28 seats)
- **Horseshoe (U-Shape)**: Semi-circle for whole-class discussions (20 seats)
- **Double Horseshoe**: Inner and outer rings for larger classes (32 seats)
- **Circle/Roundtable**: Democratic space for advanced discussions (16 seats)
- **Group Tables**: Clusters of 4 desks for collaboration (flexible)
- **Paired Desks (3 Cols)**: 24 seats in pairs for peer learning
- **Paired Desks (4 Cols)**: 32 seats in pairs for larger classes

### 🖱️ Interactive Tools
- **Drag & Drop Desks**: Move individual desks to perfect positions with custom coordinates
- **Multi-Select**: Box select and move multiple desks together (Shift+Drag)
- **Student Swapping**: Quick modal interface to swap student positions
- **Undo System**: Step-by-step undo for all changes with history tracking
- **Privacy Mode**: Hide sensitive student information during presentations
- **Desk Swap Mode**: Special mode for quick desk position swapping
- **Random Student Selector**: Randomly pick students for participation with animated highlighting
- **Add Empty Desks**: Dynamically add extra desks to any layout

### 📊 Student Data Management
- **CSV Import**: Bulk upload student information from spreadsheets
- **Excel Import**: Support for .xlsx files
- **Google Drive Integration**: Import directly from Google Sheets (with service account)
- **Comprehensive Profiles**: Track names, languages, skill levels, and preferences
- **Social Constraints**: Manage who works well together or should be separated
- **Notes & Observations**: Add teacher insights for each student
- **Editable Table**: View and edit student data directly in the app
- **Batch Operations**: Clear all students or import new rosters easily

### 💾 Save & Load Charts
- **Save Layouts**: Save complete seating arrangements with custom positions
- **SQLite Persistence**: All data stored in local SQLite database (database.db)
- **Survives Restarts**: Charts and student data persist even when app is closed
- **Load Previous Charts**: Restore any saved chart with all students and positions intact
- **Delete Charts**: Remove old or unused seating arrangements
- **Named Charts**: Give each chart a descriptive name (e.g., "Period 3 - Fall 2024")

### 📤 Export & Sharing
- **Layout Images**: Download high-quality PNG images of classroom layouts
- **Updated CSV**: Export student data with any manual changes
- **Print Support**: Print-friendly layouts for physical copies
- **High Resolution**: 2x scale for crisp, clear printouts

### 🎯 Classroom Participation Tools
- **Random Student Selection**: Click "Random Student" to randomly select a student
- **Animated Selection**: Watch as selection cycles through students for dramatic effect
- **Visual Highlighting**: Selected student's desk pulses with yellow ring and scales up
- **Clear Selection**: Remove highlighting after student responds
- **Toast Notifications**: Shows which student was selected

## 🚀 Quick Start Guide

### 1. Upload Student Data
1. Click the **"Student Data"** section in the sidebar
2. Choose one of three import methods:
   - Upload a CSV file
   - Upload an Excel (.xlsx) file
   - Import from Google Drive (if configured)
3. The system will automatically validate and import your data
4. You'll see a green "Data Loaded" confirmation with student count

**CSV/Excel Format:**
```csv
Name,Primary Language,Skill Level,Works Well With,Avoid Pairing,Notes
John Smith,English,advanced,"Sarah Johnson, Mike Davis","Alex Brown",Prefers front row
Sarah Johnson,Spanish,intermediate,"John Smith",,Needs language support
Mike Davis,English,beginner,,,Very active learner
```

**Column Details:**
- **Name** (required): Student's full name
- **Primary Language** (optional, default: English): Student's primary/native language
- **Skill Level** (optional, default: intermediate): beginner, intermediate, or advanced
- **Works Well With** (optional): Names of compatible students (comma-separated)
- **Avoid Pairing** (optional): Names of students to avoid (comma-separated)
- **Notes** (optional): Any additional teacher observations

### 2. Choose Your Layout
1. Select from 8 different classroom layouts in the **"Classroom Layout"** section
2. Each layout shows:
   - Description and best use cases
   - Number of seats available
   - Recommended activities
3. The system automatically calculates seats based on student count

### 3. Select Grouping Strategy (For Group/Pair Layouts)
1. Choose from 7 intelligent algorithms in the **"Grouping Strategy"** section
2. Each strategy includes:
   - Detailed description
   - Research-backed benefits
   - When to use it
3. Note: Grouping strategies only apply to Group Tables and Paired Desks layouts

### 4. Generate Your Chart
1. Click the **"Generate Chart"** button (appears when students are loaded)
2. The system analyzes your data and creates an optimal arrangement
3. Students are placed according to your chosen strategy and layout
4. View the generated chart in the main panel

### 5. Fine-Tune Your Layout

**Moving Individual Desks:**
- Click and drag any desk to move it
- Custom positions are automatically saved
- Undo button appears for easy reversal

**Multi-Select & Group Movement:**
- Hold Shift and drag to draw a selection box
- Selected desks get blue rings
- Drag any selected desk to move the entire group
- Press Escape to clear selection

**Swapping Students:**
- Click the swap button (⇄) in the header
- Select two students from dropdowns
- Click "Swap Positions" to exchange them

**Quick Actions (Header Toolbar):**
All quick action buttons are conveniently located in the header for easy access:
- **Random Student** (✨): Randomly select a student for participation with animated highlighting
- **Clear Selection** (✕): Remove highlighting from selected student (appears after random selection)
- **Shuffle All Students** (🔀): Randomly reassign all students to seats
- **Add Empty Desk** (+): Add an extra desk to the center of the room
- **Clear Chart** (🧹): Remove all seat assignments (keeps students loaded)

### 6. Save Your Chart
1. Click the Save button (💾) in the header
2. Enter a descriptive name (e.g., "Period 2 - January 2024")
3. Click Save
4. Chart appears in "Saved Charts" sidebar with:
   - Chart name
   - Layout type
   - Creation date
   - Load and Delete buttons

### 7. Load a Saved Chart
1. Find your chart in the "Saved Charts" section
2. Click "Load"
3. The app will:
   - Clear existing students
   - Restore all saved students with original IDs
   - Set the layout and strategy
   - Position all desks exactly as saved
4. All student names appear in their correct desks!

### 8. Export Your Results
1. **Download Layout Image** (📷): Captures the entire seating chart as PNG
2. **Download CSV** (⬇️): Exports current student roster with any updates
3. **Print**: Use browser print (Cmd/Ctrl+P) for physical copies

## 🎮 Advanced Features

### Random Student Selection
Perfect for cold-calling, participation, and share-outs:
1. Click the **sparkles icon (✨)** in the header toolbar
2. Watch animated selection cycle through students (15 iterations)
3. Final student highlighted with:
   - Pulsing yellow ring
   - Enlarged desk (110% scale)
   - Elevated shadow
   - High z-index (appears on top)
4. Toast notification displays: "Student Selected! [Name] has been randomly selected"
5. Click **"Clear Selection" (✕)** button in header to remove highlighting

### Multi-Select and Group Movement
- **Box Selection**: Hold Shift and drag in empty space to select multiple desks
- **Visual Feedback**: Selected desks show blue rings
- **Group Movement**: Drag any selected desk to move the entire group together
- **Maintain Spacing**: Relative positions are preserved during group moves
- **Clear Selection**: Press Escape or click elsewhere to deselect

### Undo System
- **Step-by-Step**: Undo button shows how many steps are available
- **All Changes Tracked**: Desk movements, student swaps, shuffles, and generation
- **Smart History**: Automatically clears when students or layout changes
- **Visual Feedback**: Button disabled when no history available

### Privacy Mode
- **Toggle**: Click the eye button (👁️) in the header
- **Hidden Info**: Conceals skill levels, languages, and compatibility data
- **Names Visible**: Student names remain visible for identification
- **Badge Indicator**: "Privacy Mode" badge appears when active
- **Presentation Ready**: Perfect for projecting layouts to students

### Desk Swap Mode
- **Toggle**: Click the refresh button (🔄) in header
- **Visual Feedback**: Orange rings appear on all desks
- **Quick Swapping**: Click two desks sequentially to swap their positions
- **Badge Indicator**: "Swap Mode" badge shows when active

### Interactive Classroom Elements
All movable and resizable:
- **Teacher Desk**: Drag to reposition, resize from corners
- **Whiteboard**: Move to any wall, resize as needed
- **Door**: Position entrance/exit optimally

### Google Drive Integration
Import student rosters directly from Google Sheets:
1. Set up Google Cloud service account (see GOOGLE_DRIVE_SETUP.md)
2. Add credentials to .env file
3. Share spreadsheet with service account email
4. Paste shareable link in the app
5. Click "Import from Google Drive"

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Git** (for cloning)

### Automated Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd classroom-seater-app

# Make scripts executable
chmod +x start.sh stop.sh restart.sh

# Start the application
./start.sh
```

The start script will:
- Install all dependencies
- Initialize the database
- Start the development server
- Open your browser to http://localhost:5000

### Manual Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5000
```

### Management Scripts
- **`./start.sh`** - Full setup and start
- **`./stop.sh`** - Gracefully stop all services
- **`./restart.sh`** - Stop and restart the app

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible, unstyled components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **SQLite Database** for persistent storage (better-sqlite3)
- **Drizzle ORM** for type-safe database operations
- **Multer** for CSV/Excel file uploads
- **Google APIs** for Drive integration
- **Automatic Schema Creation** on startup

### Key Libraries
- **html2canvas**: Layout image export
- **Lucide React**: Consistent iconography
- **Zod**: Runtime data validation
- **XLSX**: Excel file parsing
- **React Beautiful DND**: Drag and drop interactions

## 📁 Project Structure

```
classroom-seater-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── seating-chart-grid.tsx  # Main chart component
│   │   │   ├── student-seat.tsx        # Individual seat component
│   │   │   ├── upload-area.tsx         # File upload interface
│   │   │   └── ui/                     # Radix UI components
│   │   ├── pages/          # Main application pages
│   │   │   └── seating-chart.tsx       # Primary app page
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   │   ├── seating-algorithms.ts   # Chart generation logic
│   │   │   └── queryClient.ts          # API client setup
│   │   └── index.css       # Global styles
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API endpoint definitions
│   ├── storage.ts         # SQLite storage implementation
│   └── db.ts              # Database connection & schema setup
├── shared/                 # Shared TypeScript types
│   └── schema.ts          # Data models and validation (SQLite)
├── migrations/             # Database migrations
├── dist/                  # Built production files
├── database.db            # SQLite database file (persistent)
├── start.sh               # Startup script
├── stop.sh                # Shutdown script
├── restart.sh             # Restart script
└── README.md              # This file
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Update database schema
```

## 🎨 Customization

### Adding Custom Layouts
Edit `client/src/lib/seating-algorithms.ts` to add new layout patterns:
```typescript
case 'my-custom-layout': {
  // Define seat positions
  positions.push({ position: 0, x: 100, y: 200 });
  // ...
  break;
}
```

### Modifying Seating Algorithms
Extend `generateSeatingChart()` function with custom logic:
```typescript
function myCustomStrategy(students: Student[], seats: Seat[]) {
  // Your algorithm here
}
```

## 🐛 Troubleshooting

### Charts not loading after save
- Ensure you're using the latest version with student ID preservation
- Check that students array is included in saved data
- Try clearing browser cache and reloading

### Desks appear in wrong positions
- Verify `customX` and `customY` are saved in the database
- Check that layout hasn't changed since saving
- Use "Clear Chart" and regenerate if needed

### Import not working
- Verify CSV format matches expected columns
- Check that skill levels are: beginner, intermediate, or advanced
- Ensure file encoding is UTF-8

### Google Drive integration issues
- Verify service account credentials in .env
- Check that sheet is shared with service account email
- Ensure shareable link has viewing permissions

## 📊 Data Privacy & Persistence

### Data Storage
- **Local SQLite Database**: All data stored in `database.db` file
- **Persistent Across Restarts**: Charts and students survive app restarts
- **No External Dependencies**: Works completely offline (except Google Drive imports)
- **Privacy Mode**: Hide sensitive information during screen sharing
- **Export Options**: CSV exports for offline backups

### Data Security
- All student data remains on your local machine
- Google Drive integration only used when explicitly importing
- No telemetry or analytics tracking
- Database file can be backed up or version controlled

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Seating strategies based on educational research
- Designed for real classroom use by educators

---

**Built with ❤️ for educators everywhere**

**Need help?** Check out `FUTURE_IMPROVEMENTS.md` for planned features or open an issue on GitHub.
