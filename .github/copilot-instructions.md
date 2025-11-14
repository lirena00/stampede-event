# Copilot Instructions for Stampede Event Management Platform

## Project Overview

Stampede is a full-blown event management platform built with modern web technologies. It provides comprehensive tools for creating, managing, and tracking events with team collaboration features.

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Package Manager**: Bun (not npm) - use `bun` for all commands
- **Authentication**: Better Auth with Discord OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui components
- **Styling**: Tailwind CSS

## Key Features

1. **Event Management**: Create, edit, and manage events with detailed information
2. **Team Collaboration**: Role-based team management with admin and moderator roles
3. **Task Management**: Linear-style dashboard with todo status tracking
4. **Participant Management**: Upload, track, and manage event attendees
5. **Email Ticketing**: Send event tickets via email
6. **QR Code Attendance**: Track attendance with QR scanning
7. **Analytics Dashboard**: Event metrics and insights

## Authentication System

- Uses Better Auth with Drizzle ORM adapter
- Discord OAuth integration
- Role-based permissions (admin, moderator)
- Team invite system for collaboration

## Database Schema Structure

### Core Tables:

- `users`: Authentication users with Better Auth integration
- `events`: Event information (name, description, address, dates, etc.)
- `teams`: Team management for event organization
- `team_members`: User-team relationships with roles
- `tasks`: Linear-style task management
- `attendees`: Event participants
- `failed_webhooks`: Error handling for webhook failures

### Task Status Types:

- done
- in-progress
- backlog
- in-review
- cancelled

## Development Guidelines

1. **Component Usage**: Always use shadcn/ui components via `mcp_shadcn_get_add_command_for_items`
2. **Package Management**: Use `bun` for all package operations
3. **Code Style**: TypeScript with proper type definitions
4. **File Organization**: Update existing files when they serve the same functionality
5. **UI/UX**: Follow Linear design patterns for task management
6. **Permissions**: Implement granular role-based access control

## Key Directories

- `src/app/`: Next.js app router pages
- `src/components/`: Reusable UI components
- `src/server/`: Database queries and server actions
- `src/lib/`: Utility functions and auth configuration
- `drizzle/`: Database migrations

## Environment Requirements

- PostgreSQL database
- Discord OAuth app credentials
- Better Auth configuration

## Best Practices

- Always use server components when possible
- Implement proper error handling
- Use optimistic updates for better UX
- Follow Next.js 15+ app router patterns
- Maintain type safety throughout the application
