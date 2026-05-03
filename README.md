# OfficeWorkManagement

# Collaborative Team Hub

A full-stack team collaboration and project management platform built with Next.js, Express, and PostgreSQL. Enables teams to organize workspaces, set goals, manage action items, communicate globally, and track announcements in real-time.

---

## 📋 Project Scenario

**Purpose:** A modern team collaboration tool designed for organizations to streamline communication, goal-setting, and task management across multiple workspaces.

**Key Problem Solved:**
- Teams struggle with scattered communication across multiple channels
- Goal tracking and progress monitoring lack visibility
- Action items and ownership become unclear
- Announcements get lost in message threads

**Solution:** Unified platform where teams can:
- Create multiple workspaces (departments, projects, teams)
- Set workspace-specific goals and track action items
- Global chat for company-wide communication
- Structured announcements for important updates
- File uploads and audit trails for compliance
- Role-based access control (Employee, Admin, Manager)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 13 (React framework, SSR/SSG)
- Tailwind CSS (utility-first styling)
- Zustand (state management)
- Socket.io-client (real-time messaging)
- React-Quill (rich text editor)

**Backend:**
- Express.js (Node.js framework)
- Prisma ORM (database abstraction)
- PostgreSQL (relational database)
- Socket.io (WebSocket for real-time)
- JWT (authentication)
- Cloudinary (file storage)

**DevOps:**
- Turbo (monorepo build system)
- Railway (deployment platform)

### Project Structure
collaborative-team-hub/
├── apps/
│ ├── api/ # Express backend
│ │ ├── src/
│ │ │ ├── server.js
│ │ │ ├── controllers/
│ │ │ ├── routes/
│ │ │ ├── middleware/
│ │ │ └── utils/
│ │ └── prisma/
│ │ ├── schema.prisma
│ │ └── migrations/
│ │
│ └── web/ # Next.js frontend
│ ├── app/
│ ├── components/
│ ├── store/
│ └── tailwind.config.js
│
├── packages/
│ └── shared/
│
└── turbo.json

## ✨ Core Features

### 1. **Authentication & Authorization**
- User registration and login (JWT-based)
- Password hashing with bcrypt
- Protected routes with middleware
- Role-based access control

### 2. **Workspace Management** ⭐ [COMPLICATED]
- Create, edit, delete workspaces
- Multi-workspace user support
- Member invitation and management
- Role assignment per workspace
- Workspace-scoped resources

### 3. **Real-time Global Chat** ⭐ [COMPLICATED]
- WebSocket-based messaging (Socket.io)
- Message persistence in database
- User online/offline tracking
- Message attachments
- Real-time delivery to all users
- Chat history with pagination

### 4. **Goal & Action Item Management**
- Set workspace-specific goals
- Link action items to goals
- Track completion status
- Assign to team members
- Progress visualization

### 5. **Announcements System** ⭐ [EASY]
- Create workspace announcements
- Optional file attachments
- View announcement list
- Simple read-only functionality

### 6. **Notifications** ⭐ [EASY]
- Real-time notification bell
- Notification list with counts
- Mark as read/unread
- Basic fetch and display

### 7. **File Management**
- Upload files to Cloudinary
- Store file metadata
- Download/preview attachments

### 8. **Audit & Compliance**
- Log all user actions
- Track changes with timestamps
- Export data (CSV, JSON)

### 9. **Statistics Dashboard**
- Workspace metrics
- User activity stats
- Goal completion rates

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm/yarn/pnpm

### Local Development

1. **Clone & Install**
```bash
git clone https://github.com/yourusername/collaborative-team-hub.git
cd collaborative-team-hub
npm install
