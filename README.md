# Système de Gestion de Tontine (Tontine Management System)

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A modern web application for managing community savings groups (Tontines) with financial tracking, member management, and analytics**

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

**Système de Gestion de Tontine** is a comprehensive web application designed to manage **tontines** (community savings and credit associations). Built with modern web technologies, it provides an intuitive interface for tracking contributions, managing members, processing credit requests, monitoring projects, and analyzing financial data.

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
- Complete member directory with search functionality
- Financial summary for each member (contributions, credits, penalties)
- Add/edit member information
- Member activity history
- Avatar display with fallback initials

### 💳 **Tontine Management**
- Create and manage multiple tontines
- Track contribution schedules
- Member enrollment and participation tracking
- Status badges for active/completed tontines
- Contribution amount configuration

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
| **Date Handling** | date-fns | 4.1.0 | Date Utilities |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn or pnpm
- Git

### 1. Clone & Setup
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd Systeme-de-Gestion-de-Tontine

# Install dependencies
npm install
```

### 2. Start Development
```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### 3. Build for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
Systeme-de-Gestion-de-Tontine/
├── 📁 public/                     # Static assets
│   └── logo.jpeg                 # Application logo
├── 📁 src/                       # Source code
│   ├── 📁 components/            # React components
│   │   ├── AppSidebar.tsx       # Main navigation sidebar
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   ├── EmptyState.tsx       # Empty state component
│   │   ├── theme-provider.tsx   # Dark/Light mode provider
│   │   ├── 📁 credits/          # Credit management components
│   │   │   └── AddCreditModal.tsx
│   │   ├── 📁 members/          # Member management components
│   │   │   ├── AddMemberModal.tsx
│   │   │   └── MemberFinancialSummary.tsx
│   │   ├── 📁 projects/         # Project management components
│   │   │   └── AddProjectModal.tsx
│   │   ├── 📁 sessions/         # Session tracking components
│   │   │   ├── AddSessionModal.tsx
│   │   │   └── MeetingSheet.tsx
│   │   ├── 📁 tontines/         # Tontine management components
│   │   │   └── AddTontineModal.tsx
│   │   └── 📁 ui/               # ShadCN UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       ├── sidebar.tsx
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
│   │   ├── Members.tsx          # Member management
│   │   ├── Tontines.tsx         # Tontine management
│   │   ├── Credits.tsx          # Credit management
│   │   ├── Sessions.tsx         # Session tracking
│   │   └── Projects.tsx         # Project management
│   ├── 📁 stores/               # Zustand state stores
│   │   ├── memberStore.ts
│   │   ├── tontineStore.ts
│   │   ├── creditStore.ts
│   │   ├── sessionStore.ts
│   │   ├── projectStore.ts
│   │   ├── contributionStore.ts
│   │   └── penaltyStore.ts
│   ├── 📁 types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx                  # Main application component
│   ├── index.css                # Global styles & Tailwind
│   ├── main.tsx                 # Application entry point
│   └── vite-env.d.ts            # Vite type definitions
├── 📄 components.json           # ShadCN configuration
├── 📄 eslint.config.js          # ESLint configuration
├── 📄 index.html                # HTML entry point
├── 📄 LICENSE                   # MIT License
├── 📄 package.json              # Dependencies & scripts
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

### 🎯 **Key UI Components**
- **Status Badges**: Color-coded indicators for various states
- **Empty States**: Friendly illustrations when no data exists
- **Data Tables**: Sortable, searchable tables with pagination
- **Charts**: Interactive area charts with tooltips
- **Forms**: Validated forms with real-time error messages
- **Cards**: Elevated cards with gradients and shadows

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Start development server with HMR |
| **Build** | `npm run build` | Build for production |
| **Preview** | `npm run preview` | Preview production build locally |
| **Lint** | `npm run lint` | Run ESLint for code quality |

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory (optional):
```env
VITE_APP_NAME="Système de Gestion de Tontine"
VITE_DEFAULT_LANGUAGE="fr"
```

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

