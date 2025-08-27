# Classroom Seater

A modern web application for creating and managing classroom seating charts with intelligent seating algorithms.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
./start.sh
```

This script will automatically:
- Install Node.js and PostgreSQL if needed
- Set up the database
- Install dependencies
- Start the application

### Stopping the Application
```bash
./stop.sh
```

This script will safely:
- Stop the Node.js application
- Clean up processes
- Perform status checks

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL 16
- Homebrew (for macOS)

#### Installation Steps

1. **Install Node.js** (if not already installed):
   ```bash
   brew install node
   ```

2. **Install PostgreSQL** (if not already installed):
   ```bash
   brew install postgresql@16
   echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Start PostgreSQL**:
   ```bash
   brew services start postgresql@16
   ```

4. **Create Database**:
   ```bash
   createdb classroom_seater
   ```

5. **Install Dependencies**:
   ```bash
   npm install
   ```

6. **Set up Database Schema**:
   ```bash
   export DATABASE_URL="postgresql://localhost:5432/classroom_seater"
   npm run db:push
   ```

7. **Start the Application**:
   ```bash
   npm run dev
   ```

## 🌐 Access the Application

Once running, the application will be available at:
- **Main App**: http://localhost:3000 (or next available port)
- **API**: http://localhost:3000/api/*

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Update database schema
- `npm run check` - Type check the codebase

## 🛠️ Development

The application is built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + Radix UI

## 📁 Project Structure

```
ClassroomSeater/
├── client/          # React frontend
├── server/          # Express.js backend
├── shared/          # Shared types and schemas
├── start.sh         # Automated startup script
├── stop.sh          # Automated stop script
└── README.md        # This file
```

## 🔧 Troubleshooting

### Port Already in Use
The startup script automatically finds an available port. If you encounter port conflicts, the script will try the next available port.

### Database Connection Issues
Make sure PostgreSQL is running:
```bash
brew services start postgresql@16
```

### Permission Issues
If you get permission errors with the scripts:
```bash
chmod +x start.sh
chmod +x stop.sh
```

## 📝 License

MIT License
