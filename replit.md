# Overview

This is a full-stack seating chart management application designed for educational environments. The system allows teachers to manage student information and generate optimal seating arrangements based on various criteria such as skill levels, language support needs, and social compatibility. The application features a React frontend with a modern UI built using shadcn/ui components and an Express.js backend with PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with proper error handling and logging middleware
- **File Uploads**: Multer for handling CSV file uploads
- **Session Management**: Express sessions with PostgreSQL store

## Data Storage
- **Primary Database**: PostgreSQL with Neon Database as the provider
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Abstraction**: Interface-based storage layer supporting both in-memory (development) and PostgreSQL (production) implementations

## Key Features
- **Student Management**: CRUD operations for student records with support for language preferences, skill levels, and social compatibility
- **CSV Import**: Bulk student data import functionality with validation and error reporting
- **Seating Chart Generation**: Multiple algorithms for generating seating arrangements:
  - Mixed ability grouping
  - Skill-based clustering
  - Language support pairing
  - Collaborative arrangements
  - Random distribution
- **Layout Options**: Support for different classroom layouts (rows, groups, U-shape)
- **Drag and Drop**: Interactive seating chart editor with real-time updates

## Database Schema
- **Students Table**: Stores student information including name, languages, skill level, social preferences, and notes
- **Seating Charts Table**: Stores saved seating arrangements with metadata about layout and generation strategy

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon Database
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

## UI Framework
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs

## Form and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Form validation resolvers
- **zod**: TypeScript-first schema validation

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development error handling for Replit environment

## File Processing
- **multer**: Middleware for handling multipart/form-data (file uploads)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

The application is designed to be deployed on Replit with easy database provisioning through Neon Database integration.