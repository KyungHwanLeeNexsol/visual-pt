# Visual PT Project Structure

## Overview

Visual PT uses a React Native + TypeScript monorepo architecture with a clear separation between mobile app (frontend) and backend services. The project follows a feature-based module organization pattern for scalability and team collaboration.

---

## Directory Structure

```
visual-pt/
├── .moai/                          # MoAI project configuration
│   ├── project/                    # Project metadata
│   │   ├── product.md              # Product definition
│   │   ├── structure.md            # This file
│   │   ├── tech.md                 # Technology stack
│   │   └── roadmap.md              # Development roadmap
│   ├── specs/                      # SPEC documents
│   ├── docs/                       # Generated documentation
│   └── config/                     # MoAI workflow config
│
├── mobile/                         # React Native mobile app
│   ├── App.tsx                     # NEW (SPEC-UI-002 N1) — NavigationContainer + SafeAreaProvider
│   ├── babel.config.js             # NEW (worklets-core + reanimated babel plugins)
│   ├── app.json                    # NEW (Expo config, camera permissions, vision-camera plugin)
│   ├── eas.json                    # NEW (EAS build profiles)
│   ├── app/                        # Application entry point
│   │   ├── index.js                # App entry point
│   │   └── app.json                # Expo/RN configuration (deprecated, moved to root)
│   │
│   ├── src/                        # Source code (main directory)
│   │   ├── navigation/             # NEW (SPEC-UI-002 N1) — 내비게이션 구조
│   │   │   ├── types.ts            — RootStackParamList 타입 안전
│   │   │   └── RootNavigator.tsx   — 네이티브 스택 네비게이터
│   │   │
│   │   ├── screens/                # Screen components (feature-based)
│   │   │   ├── HomeScreen.tsx      # NEW (SPEC-UI-002 N2) — 앱 홈 화면
│   │   │   ├── WorkoutSelectionScreen.tsx  # NEW (SPEC-UI-002 N3) — 운동 선택
│   │   │   ├── CameraScreen.tsx    # Modified (SPEC-UI-002 N4+N5) — 실제 카메라 연결
│   │   │   ├── FeedbackScreen.tsx
│   │   │   ├── SessionAnalysisScreen.tsx
│   │   │   ├── KnowledgeBaseScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   │
│   │   ├── components/             # Reusable UI components
│   │   │   ├── CameraOverlay.tsx   # Skeleton visualization
│   │   │   ├── JointAngleDisplay.tsx
│   │   │   ├── FeedbackBadge.tsx   # Visual/voice feedback UI
│   │   │   ├── CameraGuideOverlay.tsx
│   │   │   ├── AnalysisReport.tsx
│   │   │   └── common/             # Generic components
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Loader.tsx
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── PoseEstimationService.ts    # MediaPipe integration
│   │   │   ├── JointAngleCalculator.ts     # Angle math
│   │   │   ├── FeedbackGenerator.ts        # Form error detection
│   │   │   ├── APIService.ts               # Backend HTTP client
│   │   │   ├── SessionStorageService.ts    # Local session cache
│   │   │   ├── AudioFeedbackService.ts     # Voice feedback
│   │   │   └── RAGChatbotService.ts        # LLM integration
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useCamera.ts
│   │   │   ├── usePoseDetection.ts
│   │   │   ├── useJointAngles.ts
│   │   │   ├── useFeedback.ts
│   │   │   └── useSession.ts
│   │   │
│   │   ├── store/                  # State management (Zustand)
│   │   │   ├── appStore.ts         # Global app state
│   │   │   ├── workoutStore.ts     # Current workout session
│   │   │   ├── userStore.ts        # User profile/preferences
│   │   │   └── feedbackStore.ts    # Feedback history
│   │   │
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── index.ts            # Main type exports
│   │   │   ├── pose.types.ts       # MediaPipe types
│   │   │   ├── workout.types.ts    # Workout/exercise types
│   │   │   ├── feedback.types.ts   # Feedback message types
│   │   │   ├── session.types.ts    # Session recording types
│   │   │   └── api.types.ts        # Backend API response types
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── constants.ts        # App constants
│   │   │   ├── validators.ts       # Form validation
│   │   │   ├── formatters.ts       # Text/data formatting
│   │   │   ├── mathHelpers.ts      # Angle calculations
│   │   │   └── logger.ts           # Logging utility
│   │   │
│   │   ├── config/                 # Configuration files
│   │   │   ├── api.config.ts       # Backend API endpoints
│   │   │   ├── pose.config.ts      # MediaPipe thresholds
│   │   │   ├── exercise.catalog.ts # NEW (SPEC-UI-002) — 운동 메타데이터
│   │   │   ├── feedback.config.ts  # Feedback rules
│   │   │   └── theme.ts            # UI theme (colors, sizes)
│   │   │
│   │   ├── assets/                 # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   ├── fonts/
│   │   │   └── videos/
│   │   │
│   │   └── __tests__/              # Unit/integration tests
│   │       ├── navigation/         # NEW (SPEC-UI-002) — 네비게이션 테스트
│   │       │   └── RootNavigator.test.tsx
│   │       ├── screens/            # 화면 테스트
│   │       │   ├── HomeScreen.test.tsx        # NEW (SPEC-UI-002 N2)
│   │       │   └── WorkoutSelectionScreen.test.tsx # NEW (SPEC-UI-002 N3)
│   │       ├── services/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── utils/
│   │
│   ├── package.json
│   ├── tsconfig.json
│
│   > ✅ 구현 완료 (2026-06-01): SPEC-UI-002 완료 (App 진입점 + 내비게이션 쉘 + 실제 카메라 연결)
│
├── backend/                        # Backend API service (Node.js/Express or Python/FastAPI)
│   ├── src/                        # Source code
│   │   ├── main.ts                 # Application entry point
│   │   │
│   │   ├── api/                    # API routes and controllers
│   │   │   ├── workoutRoutes.ts    # /api/workouts endpoints
│   │   │   ├── sessionRoutes.ts    # /api/sessions endpoints
│   │   │   ├── feedbackRoutes.ts   # /api/feedback endpoints
│   │   │   ├── userRoutes.ts       # /api/users endpoints
│   │   │   └── healthRoutes.ts     # /api/health endpoint
│   │   │
│   │   ├── controllers/            # Business logic for routes
│   │   │   ├── workoutController.ts
│   │   │   ├── sessionController.ts
│   │   │   ├── feedbackController.ts
│   │   │   └── userController.ts
│   │   │
│   │   ├── models/                 # Database models/schemas
│   │   │   ├── User.ts
│   │   │   ├── WorkoutSession.ts
│   │   │   ├── ExerciseAnalysis.ts
│   │   │   └── FeedbackLog.ts
│   │   │
│   │   ├── services/               # Business logic layer
│   │   │   ├── PoseAnalysisService.ts     # Joint angle analysis
│   │   │   ├── FeedbackGenerationService.ts # AI feedback
│   │   │   ├── RAGKnowledgeService.ts     # Knowledge base queries
│   │   │   ├── SessionStorageService.ts   # Session persistence
│   │   │   ├── UserService.ts
│   │   │   └── ClaudeAIService.ts         # Claude API integration
│   │   │
│   │   ├── middleware/             # Express middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── validationMiddleware.ts
│   │   │   └── loggingMiddleware.ts
│   │   │
│   │   ├── database/               # Database connection and migrations
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── errorHandler.ts
│   │   │
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── index.ts
│   │   │   ├── pose.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── database.types.ts
│   │   │
│   │   ├── config/                 # Configuration management
│   │   │   ├── database.config.ts
│   │   │   ├── api.config.ts
│   │   │   ├── claude.config.ts
│   │   │   └── environment.ts
│   │   │
│   │   └── __tests__/              # Unit/integration tests
│   │       ├── services/
│   │       ├── controllers/
│   │       ├── models/
│   │       └── api/
│   │
│   ├── .env.example                # Environment variables template
│   ├── package.json
│   ├── tsconfig.json
│   └── docker-compose.yml          # Docker setup for PostgreSQL, Redis
│
├── shared/                         # Shared types and utilities (monorepo)
│   ├── types/
│   │   ├── api.types.ts            # Shared API types
│   │   ├── domain.types.ts         # Business domain types
│   │   └── index.ts
│   │
│   └── utils/
│       ├── validation.ts
│       └── constants.ts
│
├── .env                            # Environment variables (local development)
├── .env.example                    # Template for environment variables
├── .gitignore
├── README.md                       # Project overview
├── package.json                    # Root monorepo configuration
├── tsconfig.json                   # Root TypeScript config
├── docker-compose.yml              # Docker services (PostgreSQL, Redis)
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI/CD pipeline
│       ├── mobile-build.yml        # Mobile app build
│       └── backend-deploy.yml      # Backend deployment
│
└── docs/                           # Generated documentation
    ├── API.md                      # API documentation
    ├── ARCHITECTURE.md             # System architecture
    ├── SETUP.md                    # Development setup
    └── CONTRIBUTING.md             # Contributing guidelines
```

---

## Directory Explanations

### `/mobile` - React Native Mobile Application

The mobile app is the primary user-facing component. It handles camera access, real-time pose estimation, user interaction, and session recording.

**Key Subdirectories:**
- `screens/`: Top-level page components (one per major user flow)
- `components/`: Reusable UI elements (buttons, cards, modal overlays)
- `services/`: Core business logic including MediaPipe integration, angle calculations, API communication
- `hooks/`: Custom React hooks for camera, pose detection, state management
- `store/`: Zustand state management for global and feature-specific state
- `types/`: TypeScript interfaces for pose data, feedback, sessions
- `config/`: App configuration, theme, API endpoints, pose detection thresholds

### `/backend` - REST API Service

The backend API handles session storage, user authentication, advanced AI feedback processing, RAG knowledge base queries, and integration with Claude AI.

**Key Subdirectories:**
- `api/`: Route definitions and HTTP endpoints
- `controllers/`: Request handlers and business logic orchestration
- `models/`: Database schema definitions (User, WorkoutSession, ExerciseAnalysis)
- `services/`: Core business logic (pose analysis, feedback generation, RAG queries)
- `middleware/`: Authentication, validation, error handling
- `database/`: Connection management and database migrations

### `/shared` - Monorepo Shared Code

Types and utilities used by both mobile and backend applications to ensure consistency.

---

## Module Organization Pattern

Visual PT follows a **feature-based module organization** within the layers:

### Feature-Based Organization
Each feature (Workout, Session, Feedback, Knowledge) has its own module containing:
- Screen/Route component
- Components specific to that feature
- Hooks for that feature's logic
- Types for that feature's data
- Tests for that feature

**Benefits:**
- Easy to locate all code related to a feature
- Features can be developed independently
- Easy to understand feature boundaries
- Simplified testing and maintenance

---

## Key Entry Points

### Mobile App Entry Points
- `mobile/app/index.js` - React Native app entry point
- `mobile/src/screens/HomeScreen.tsx` - Initial screen after app launch
- `mobile/src/screens/CameraScreen.tsx` - Main pose detection screen

### Backend API Entry Points
- `backend/src/main.ts` - Express server initialization
- `backend/src/api/workoutRoutes.ts` - Workout endpoints
- `backend/src/api/sessionRoutes.ts` - Session recording endpoints

---

## Configuration Files

### Mobile App
- `app.json` - Expo configuration (app name, version, permissions)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler options
- `babel.config.js` - JavaScript transpilation

### Backend
- `.env` - Runtime environment variables (API keys, database credentials)
- `package.json` - Node.js dependencies
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - PostgreSQL and Redis services

---

## Database Schema Overview

### User Table
- `id` (PK)
- `email`, `password_hash`
- `full_name`, `age`, `gender`
- `created_at`, `updated_at`

### WorkoutSession Table
- `id` (PK)
- `user_id` (FK)
- `exercise_type` (squat, deadlift)
- `started_at`, `ended_at`
- `video_path` (local storage reference)
- `analysis_status` (pending, completed)

### ExerciseAnalysis Table
- `id` (PK)
- `session_id` (FK)
- `joint_angles` (JSON: knee, hip, ankle, spine)
- `form_errors` (JSON array: error descriptions)
- `feedback` (text: generated feedback)
- `anatomical_notes` (text: RAG-generated explanation)

### FeedbackLog Table
- `id` (PK)
- `session_id` (FK)
- `feedback_type` (voice, visual)
- `message_text`
- `timestamp`

---

## Module Dependencies

### Mobile to Backend
- Mobile app communicates with backend via REST API
- Requests use TypeScript types from `shared/types/api.types.ts`
- Session recording data uploaded after analysis

### Backend Dependencies
- PostgreSQL for persistent storage (User, Session, Analysis data)
- Redis for caching and session state
- Claude API for RAG-based feedback generation
- MediaPipe (processed on mobile, results sent to backend for analysis)

---

## Development Workflow

### Adding a New Feature
1. Create feature directory under `mobile/src/screens/` or `backend/src/api/`
2. Add TypeScript types in `types/` subdirectory
3. Implement component or controller
4. Add tests in `__tests__/` subdirectory
5. Update API documentation in `docs/`

### Adding a New Service
1. Create service file in `services/` directory
2. Define service interface in `types/`
3. Implement business logic
4. Write unit tests in `__tests__/services/`
5. Update relevant controllers/hooks to use new service

---

## Build and Deployment Artifacts

### Mobile App Artifacts
- iOS `.ipa` file (for App Store)
- Android `.apk`/`.aab` file (for Google Play)
- Expo build output

### Backend Artifacts
- Docker container image
- Compiled TypeScript/JavaScript
- Database migrations

---

## Last Updated
2026-06-01

**Note:** This structure is designed for scalability and will be refined during SPEC and implementation phases. Team feedback and actual development experience will inform final organization decisions.
