# Système de Gestion de Tontine (Tontine Management System)

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A full-stack web application for managing community savings groups (Tontines) with financial tracking, member management, and analytics**

Created by **@DimitriTedom (SnowDev)** for **Worketyamo-Students**

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Documentation](#-project-structure)

</div>

---

## 📚 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🎨 UI/UX Highlights](#-uiux-highlights)
- [📜 Available Scripts](#-available-scripts)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

**Système de Gestion de Tontine** is a comprehensive full-stack web application designed to manage **tontines** (community savings and credit associations). Built with modern web technologies, it provides an intuitive interface for tracking contributions, managing members, processing credit requests, monitoring projects, and analyzing financial data.

The application consists of:
- **Frontend**: React + TypeScript SPA with modern UI/UX
- **Backend**: FastAPI REST API with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production ready)

Perfect for:
- 💰 Community savings groups and associations
- 🏦 Microfinance organizations
- 👥 ROSCAs (Rotating Savings and Credit Associations)
- 📊 Financial cooperatives
- 🌍 Development projects with community funding

## ✨ Features

### 📊 **Dashboard & Analytics**
- Real-time financial overview with key metrics
- Interactive area charts with gradient visualization
- Contribution trends and analytics
- Recent activity tracking
- Responsive cards with emerald accent colors

### 👥 **Member Management**
- Complete member directory with search and pagination
- Member details view with financial summary
- Add/Edit/Delete member operations with API integration
- Real-time data fetching from backend
- Toast notifications for user feedback
- Avatar display with fallback initials

### 💳 **Tontine Management**
- Create and manage multiple tontines with full CRUD operations
- Tontine details view with comprehensive information
- Search and pagination for tontine listings
- Track contribution schedules and amounts
- Member enrollment and participation tracking
- Status badges for active/completed tontines
- API-backed persistence

### 💵 **Credit System**
- Credit request submission and approval
- Interest rate calculation
- Repayment tracking
- Credit history per member
- Status indicators (approved, pending, rejected)

### 📅 **Session Tracking**
- Meeting schedule management
- Attendance tracking
- Session notes and minutes
- Contribution collection during sessions
- Historical session records

### 🏗️ **Project Management**
- Community project proposals
- Budget allocation and tracking
- Project status monitoring
- Member voting on projects
- Progress tracking

### 🎨 **Modern UI/UX**
- Sleek, retractable sidebar with emerald green theme
- Smooth animations powered by Framer Motion
- Dark/Light mode support
- Responsive mobile-first design
- Custom gradients and shadows
- Empty state components for better UX
- Form validation with real-time feedback

## 🛠️ Tech Stack

### Frontend
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 18.3.1 | UI Library |
| **Language** | TypeScript | 5.5.3 | Type Safety |
| **Build Tool** | Vite | 5.4.8 | Fast Development & Build |
| **Styling** | TailwindCSS | 3.4.13 | Utility-first CSS |
| **UI Components** | ShadCN/UI | Latest | Pre-built Components |
| **State Management** | Zustand | 5.0.0-rc.2 | Global State |
| **Forms** | React Hook Form | 7.53.2 | Form Management |
| **Validation** | Zod | 3.23.8 | Schema Validation |
| **Charts** | Recharts | 2.15.0 | Data Visualization |
| **Animations** | Framer Motion | 11.15.0 | Smooth Animations |
| **Icons** | Lucide React | Latest | Icon Library |
| **i18n** | i18next | 23.16.8 | Internationalization |
| **Routing** | React Router | 7.1.1 | Navigation |
| **HTTP Client** | Axios | 1.7.9 | API Communication |
| **Notifications** | Sonner | 1.7.2 | Toast Notifications |

### Backend
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | FastAPI | 0.115.6 | REST API Framework |
| **Language** | Python | 3.12+ | Backend Language |
| **ORM** | SQLAlchemy | 2.0.36 | Database ORM |
| **Database** | SQLite/PostgreSQL | - | Data Persistence |
| **Validation** | Pydantic | 2.10.4 | Data Validation |
| **Server** | Uvicorn | 0.34.0 | ASGI Server |
| **CORS** | FastAPI CORS | - | Cross-Origin Support |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.12+
- npm or yarn or pnpm
- Git

### 1. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git

# Navigate to project directory
cd Systeme-de-Gestion-de-Tontine
```

### 2. Backend Setup
```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional)
echo "DATABASE_URL=sqlite:///./tontine.db" > .env

# Initialize database
python init_db.py

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to project root
cd Systeme-de-Gestion-de-Tontine

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### 4. Build for Production
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
Systeme-de-Gestion-de-Tontine/
├── 📁 public/                     # Static assets
│   └── logo.jpeg                 # Application logo
├── 📁 server/                    # Backend API
│   ├── main.py                  # FastAPI application
│   ├── database.py              # Database configuration
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas
│   ├── crud.py                  # CRUD operations
│   ├── routers.py               # API routes
│   ├── init_db.py               # Database initialization
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables
│   └── tontine.db               # SQLite database (dev)
├── 📁 src/                       # Frontend source code
│   ├── 📁 components/            # React components
│   │   ├── AppSidebar.tsx       # Main navigation sidebar
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   ├── EmptyState.tsx       # Empty state component
│   │   ├── AppInitializer.tsx   # Data fetching on app load
│   │   ├── theme-provider.tsx   # Dark/Light mode provider
│   │   ├── 📁 credits/          # Credit management components
│   │   │   └── AddCreditModal.tsx
│   │   ├── 📁 members/          # Member management components
│   │   │   ├── AddMemberModal.tsx
│   │   │   ├── EditMemberModal.tsx
│   │   │   ├── MemberDetailsSheet.tsx
│   │   │   └── MemberFinancialSummary.tsx
│   │   ├── 📁 projects/         # Project management components
│   │   │   └── AddProjectModal.tsx
│   │   ├── 📁 sessions/         # Session tracking components
│   │   │   ├── AddSessionModal.tsx
│   │   │   └── MeetingSheet.tsx
│   │   ├── 📁 tontines/         # Tontine management components
│   │   │   ├── AddTontineModal.tsx
│   │   │   └── TontineDetailsSheet.tsx
│   │   └── 📁 ui/               # ShadCN UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       ├── sidebar.tsx
│   │       ├── sheet.tsx
│   │       └── ... (more components)
│   ├── 📁 hooks/                # Custom React hooks
│   │   └── use-mobile.tsx
│   ├── 📁 i18n/                 # Internationalization
│   │   ├── config.ts
│   │   └── 📁 locales/
│   │       ├── en.json          # English translations
│   │       └── fr.json          # French translations
│   ├── 📁 lib/                  # Utility functions
│   │   └── utils.ts
│   ├── 📁 pages/                # Page components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Members.tsx          # Member management (with search & pagination)
│   │   ├── Tontines.tsx         # Tontine management (with search & pagination)
│   │   ├── Credits.tsx          # Credit management
│   │   ├── Sessions.tsx         # Session tracking
│   │   └── Projects.tsx         # Project management
│   ├── 📁 services/             # API services
│   │   ├── api.ts               # Axios configuration
│   │   ├── memberService.ts     # Member API calls
│   │   ├── tontineService.ts    # Tontine API calls
│   │   ├── sessionService.ts    # Session API calls
│   │   ├── reportService.ts     # Reports API calls
│   │   └── index.ts             # Service exports
│   ├── 📁 stores/               # Zustand state stores
│   │   ├── memberStore.ts       # Member state with async API
│   │   ├── tontineStore.ts      # Tontine state with async API
│   │   ├── creditStore.ts
│   │   ├── sessionStore.ts      # Session state with async API
│   │   ├── projectStore.ts
│   │   ├── contributionStore.ts
│   │   └── penaltyStore.ts
│   ├── 📁 types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx                  # Main application component
│   ├── index.css                # Global styles & Tailwind
│   ├── main.tsx                 # Application entry point
│   └── vite-env.d.ts            # Vite type definitions
├── 📄 .env                      # Frontend environment variables
├── 📄 .env.template             # Environment variables template
├── 📄 components.json           # ShadCN configuration
├── 📄 eslint.config.js          # ESLint configuration
├── 📄 index.html                # HTML entry point
├── 📄 LICENSE                   # MIT License
├── 📄 CONTRIBUTING.md           # Contribution guidelines
├── 📄 CHANGELOG.md              # Version history
├── 📄 package.json              # Frontend dependencies & scripts
├── 📄 postcss.config.js         # PostCSS configuration
├── 📄 README.md                 # Documentation
├── 📄 tailwind.config.js        # TailwindCSS configuration
├── 📄 tsconfig.json             # TypeScript configuration
└── 📄 vite.config.ts            # Vite configuration
```

## 🎨 UI/UX Highlights

### 🌈 **Color Palette**
- **Primary**: Emerald Green (`emerald-500`, `emerald-600`)
- **Accent**: Teal highlights
- **Backgrounds**: Dynamic light/dark mode
- **Gradients**: Smooth emerald-to-teal gradients on charts

### ✨ **Animations**
- Page transitions with Framer Motion
- Smooth sidebar collapse/expand
- Hover effects on interactive elements
- Loading states and skeletons
- Entrance animations for modals

### 📱 **Responsive Design**
- Mobile-first approach
- Collapsible sidebar for small screens
- Responsive tables with horizontal scroll
- Adaptive card layouts
- Touch-friendly interface

- **Key UI Components**
- **Status Badges**: Color-coded indicators for various states
- **Empty States**: Friendly illustrations when no data exists
- **Data Tables**: Sortable, searchable tables with pagination (10 items per page)
- **Charts**: Interactive area charts with tooltips
- **Forms**: Validated forms with real-time error messages
- **Cards**: Elevated cards with gradients and shadows
- **Detail Sheets**: Slide-out panels for viewing detailed information
- **Toast Notifications**: User feedback for all operations

## 🏗️ Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────────┐
│           React Application (SPA)           │
├─────────────────────────────────────────────┤
│  Pages → Components → UI Components         │
│    ↓          ↓            ↓                │
│  Stores ← Services ← Axios (HTTP Client)    │
└─────────────────────────────────────────────┘
                    ↓ HTTP/REST
┌─────────────────────────────────────────────┐
│         FastAPI Backend (REST API)          │
├─────────────────────────────────────────────┤
│  Routers → CRUD → Models → Database         │
│              ↓                               │
│          Schemas (Pydantic)                 │
└─────────────────────────────────────────────┘
```

### State Management Flow
1. **Page Components** trigger actions (e.g., fetch members)
2. **Zustand Stores** call service functions
3. **Services** make HTTP requests via Axios
4. **Backend API** processes requests through routers
5. **CRUD Operations** interact with database via SQLAlchemy
6. **Response** flows back through the same chain
7. **Store Updates** trigger UI re-renders

### Data Transformation
- **Backend → Frontend**: French field names (nom, prenom) → English (firstName, lastName)
- **Frontend → Backend**: English field names → French for API compatibility
- **Service Layer**: Handles all transformations transparently

## 📜 Available Scripts

### Frontend Scripts
| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Start development server with HMR |
| **Build** | `npm run build` | Build for production |
| **Preview** | `npm run preview` | Preview production build locally |
| **Lint** | `npm run lint` | Run ESLint for code quality |

### Backend Scripts
| Script | Command | Description |
|--------|---------|-------------|
| **Start Server** | `uvicorn main:app --reload` | Start development server with auto-reload |
| **Production** | `uvicorn main:app --host 0.0.0.0 --port 8000` | Start production server |
| **Init DB** | `python init_db.py` | Initialize database tables |
| **Install Deps** | `pip install -r requirements.txt` | Install Python dependencies |

## 🔧 Configuration

### Frontend Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Système de Gestion de Tontine"
VITE_DEFAULT_LANGUAGE="fr"
```

### Backend Environment Variables
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL=sqlite:///./tontine.db
# For PostgreSQL in production:
# DATABASE_URL=postgresql://user:password@localhost/tontine_db
```

### API Endpoints
The backend provides the following main endpoints:

**Members**
- `GET /api/membres` - List all members
- `GET /api/membres/{id}` - Get member by ID
- `POST /api/membres` - Create new member
- `PUT /api/membres/{id}` - Update member
- `DELETE /api/membres/{id}` - Delete member

**Tontines**
- `GET /api/tontines` - List all tontines
- `GET /api/tontines/{id}` - Get tontine by ID
- `POST /api/tontines` - Create new tontine
- `PUT /api/tontines/{id}` - Update tontine
- `DELETE /api/tontines/{id}` - Delete tontine

**Sessions**
- `GET /api/seances` - List all sessions
- `GET /api/seances/{id}` - Get session by ID
- `POST /api/seances` - Create new session
- `PUT /api/seances/{id}` - Update session
- `DELETE /api/seances/{id}` - Delete session

**Reports**
- `GET /api/reports/situation_membre/{id}` - Get member financial report
- `GET /api/dashboard` - Get dashboard statistics

Full API documentation available at `http://localhost:8000/docs` (Swagger UI)

### Tailwind Configuration
The application uses custom Tailwind configuration with:
- Emerald as primary color
- Custom animations
- Extended shadows and gradients
- Dark mode support

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/components`, `@/lib`, etc.)
- Full type safety across the application

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linter: `npm run lint`
5. Build to verify: `npm run build`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- ✅ Follow TypeScript best practices
- ✅ Use meaningful commit messages
- ✅ Maintain consistent code style
- ✅ Update documentation when needed
- ✅ Test thoroughly before committing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [DimitriTedom (SnowDev)](https://github.com/DimitriTedom)**

**For the amazing developers at Worketyamo-Students 🎓**

</div>

