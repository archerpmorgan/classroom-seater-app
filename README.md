# Classroom Seater

An app for creating and managing classroom seating charts.

## ✨ Key Features

### 🧠 Intelligent Seating Algorithms
- **Mixed Ability Grouping**: Strategic pairing of different skill levels for peer learning
- **Skill Clustering**: Groups students with similar abilities for targeted instruction
- **Language Support**: Places students who share the same primary language together for mutual support
- **Collaborative Pairs**: Positions students who work well together
- **Attention Zone**: Places students needing support in high-engagement areas
- **Behavior Management**: Strategic separation to minimize disruptions
- **Random Assignment**: Breaks up social cliques and creates new relationships

### 🎨 Multiple Layout Options
- **Traditional Rows**: Classic classroom setup for direct instruction
- **Stadium/V-Shape**: Angled rows for better sightlines
- **Horseshoe (U-Shape)**: Semi-circle for whole-class discussions
- **Double Horseshoe**: Inner and outer rings for larger classes
- **Circle/Roundtable**: Democratic space for advanced discussions
- **Group Tables**: Clusters of 4-6 desks for collaboration
- **Paired Desks**: Pairs throughout the room for peer learning

### 🖱️ Interactive Tools
- **Drag & Drop Desks**: Move individual desks to perfect positions
- **Multi-Select**: Box select and move multiple desks together
- **Student Swapping**: Quick modal interface to swap student positions
- **Undo System**: Step-by-step undo for all changes
- **Privacy Mode**: Hide sensitive student information during presentations

### 📊 Student Data Management
- **CSV Import**: Bulk upload student information
- **Comprehensive Profiles**: Track languages, skill levels, preferences
- **Social Constraints**: Manage who works well together or should be separated
- **Notes & Observations**: Add teacher insights for each student

### 📤 Export & Sharing
- **Layout Images**: Download high-quality classroom layout images
- **Updated CSV**: Export student data with any manual changes
- **Print Support**: Print-friendly layouts for physical copies

## 🚀 Quick Start Guide

### 1. Upload Student Data
1. Click the **"Student Data"** section in the sidebar
2. Upload a CSV file with student information
3. The system will automatically validate and import your data
4. You'll see a green confirmation when data is loaded

### 2. Choose Your Layout
1. Select from 7 different classroom layouts in the **"Classroom Layout"** section
2. Each layout shows a description and best use cases
3. The system will automatically calculate the number of seats needed

### 3. Select Grouping Strategy
1. Choose from 7 intelligent algorithms in the **"Grouping Strategy"** section
2. Each strategy has research-backed benefits and descriptions
3. Some layouts support grouping, others use random assignment

### 4. Generate Your Chart
1. Click the **"Generate Chart"** button in the header
2. The system will analyze your data and create an optimal arrangement
3. Students will be placed according to your chosen strategy

### 5. Fine-Tune Your Layout
1. **Drag desks** to adjust positions for perfect spacing
2. **Multi-select** desks by drawing a box around them
3. **Swap students** using the swap button for quick adjustments
4. **Undo changes** if you make mistakes

### 6. Export Your Results
1. **Download layout image** for presentations or printing
2. **Export updated CSV** with any manual changes
3. **Print directly** from the browser

## 📋 CSV Format

Your student data CSV should include these columns:

```csv
Name,Primary Language,Skill Level,Works Well With,Avoid Pairing,Notes
John Smith,English,Advanced,"Sarah Johnson, Mike Davis","Alex Brown",Prefers front row
Sarah Johnson,Spanish,Intermediate,"John Smith",,Needs language support
```

### Column Details:
- **Name**: Student's full name
- **Primary Language**: Student's primary/native language
- **Skill Level**: beginner, intermediate, or advanced
- **Works Well With**: Names of compatible students (comma-separated)
- **Avoid Pairing**: Names of students to avoid (comma-separated)
- **Notes**: Any additional teacher observations

## 🎮 Advanced Features

### Multi-Select and Group Movement
- **Box Selection**: Click and drag in empty space to select multiple desks
- **Additive Selection**: Hold Ctrl/Cmd while selecting to add to existing selection
- **Group Movement**: Drag any selected desk to move the entire group
- **Clear Selection**: Press Escape to clear all selections

### Undo System
- **Step-by-Step**: Undo button shows how many steps are available
- **All Changes**: Tracks desk movements, student swaps, and shuffles
- **Smart History**: Automatically manages history when students or layout changes

### Privacy Mode
- **Toggle**: Click the privacy button in the header
- **Hidden Info**: Conceals skill levels, languages, and compatibility data
- **Names Visible**: Student names remain visible for identification
- **Presentation Ready**: Perfect for projecting layouts to students

### Interactive Elements
- **Draggable Teacher Desk**: Move the teacher's desk to any position
- **Draggable Whiteboard**: Position the whiteboard where needed
- **Draggable Door**: Place the entrance door in the optimal location

## 🛠️ Technical Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL 16
- Homebrew (for macOS)

### Quick Setup
```bash
# Clone the repository
git clone <repository-url>
cd ClassroomSeater

# Automated setup (recommended)
./start.sh

# Or manual setup
npm install
export DATABASE_URL="postgresql://localhost:5432/classroom_seater"
npm run db:push
npm run dev
```

> **Note**: If you have an existing database with the old schema (including secondary_languages), you may need to drop and recreate the database or run a migration to remove the secondary_languages column.

### Access the Application
- **Main App**: http://localhost:3000
- **API**: http://localhost:3000/api/*

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for data management

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage
- **Multer** for file uploads

### Key Libraries
- **html2canvas**: For layout image export
- **Lucide React**: For consistent iconography
- **React Hook Form**: For form handling
- **Zod**: For data validation

## 📁 Project Structure

```
ClassroomSeater/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express application
│   ├── routes/            # API endpoints
│   └── storage/           # Database operations
├── shared/                # Shared TypeScript types
└── dist/                  # Built application files
```

### Development Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Update database schema
- `npm run check` - Type check the codebase

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for educators everywhere**
