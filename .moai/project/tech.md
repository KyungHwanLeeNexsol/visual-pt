# Visual PT Technology Stack

## Overview

Visual PT uses a modern, production-grade technology stack designed for real-time mobile pose estimation, AI-powered feedback generation, and reliable backend service delivery. The architecture prioritizes performance, scalability, and developer experience.

---

## Frontend: Mobile Application

### Framework: React Native + TypeScript

**Why React Native:**
- Cross-platform development (iOS/Android from single codebase)
- Performance suitable for real-time camera processing
- Large ecosystem and community support
- TypeScript enables type safety and better developer experience
- Faster development cycle vs native Kotlin/Swift

**React Native Version:** 0.74+ (with New Architecture support)

**TypeScript Version:** 5.3+

### Key Mobile Dependencies

#### UI and Navigation
- `@react-navigation/native` (8.x) - Screen navigation and routing
- `@react-navigation/bottom-tabs` (6.x) - Bottom tab navigation
- `react-native-gesture-handler` (2.x) - Gesture recognition
- `react-native-reanimated` (3.x) - Animation library

#### Navigation (신규 — SPEC-UI-002)
- `@react-navigation/native` (6.1.18, Expo 51 호환) — NavigationContainer, 네비게이션 훅
- `@react-navigation/native-stack` (6.11.0) — 네이티브 스택 네비게이터
- `react-native-screens` (3.31.1, Expo SDK 51 resolved) — 네이티브 스크린 최적화
- `react-native-safe-area-context` (4.10.5, Expo SDK 51 resolved) — SafeArea 처리

⚠️ **주의:** react-navigation 8.x는 Expo 51과 호환되지 않음 — 반드시 6.x 사용

#### Camera and Media
- `react-native-vision-camera` (4.x) - Camera access, frame processor API (replaces expo-camera for pose pipeline)
- `expo-media-library` (16.x) - Photo/video library access
- `react-native-video` (6.x) - Video playback

#### Pose Estimation and ML
- `react-native-mediapipe-posedetection` (0.4.x) - RN Native Pose estimation (replaces @mediapipe/tasks-vision which is browser-only)
  - Provides real-time joint keypoints (33 joints including nose, shoulders, elbows, wrists, hips, knees, ankles)
  - Low latency (~15 FPS on modern phones via native worklet)
  - No cloud dependency (privacy-respecting)
  - Native bindings required for React Native compatibility

#### State Management
- `zustand` (4.x) - Lightweight state management (recommended over Redux for this project size)
  - Simpler API than Redux
  - Better TypeScript support
  - Smaller bundle size

#### HTTP Client
- `axios` (1.6+) - HTTP client for API communication
- `@react-native-community/netinfo` (11.x) - Network state detection

#### Storage
- `@react-native-async-storage/async-storage` (1.22+) - Key-value storage for session caching
- `react-native-sqlite-storage` (6.x) - Lightweight embedded database (optional, for complex local queries)

#### Utilities
- `date-fns` (2.30+) - Date formatting and manipulation
- `lodash-es` (4.17+) - Utility functions (tree-shakeable ES version)
- `react-native-dotenv` (3.x) - Environment variable management
- `react-native-logger` (2.x) - Structured logging

#### Testing
- `@testing-library/react-native` (12.x) - Component testing
- `jest` (29.x) - Test runner (pre-configured with React Native)
- `@testing-library/jest-native` (5.x) - Jest matchers for React Native

#### Build and Development
- `expo-cli` (6.x) - Expo development toolkit (if using Expo)
- `eas-cli` (10.x) - Expo Application Services for builds
- `metro` (0.80+) - React Native bundler

### Mobile Development Tools
- **Build System:** Expo (EAS Build) recommended for MVP, bare React Native for advanced features
- **Testing Device:** iOS Simulator / Android Emulator (development), physical devices for camera testing
- **Debugger:** React Native Debugger, Flipper (for network, logs, Redux inspection)

---

## Backend: API Service

### Option A: Node.js + Express (Recommended for MVP)

**Why Node.js + Express:**
- JavaScript/TypeScript across entire stack (shared types, code reuse)
- Fast development iteration
- Excellent async/await support for I/O operations
- Large npm ecosystem with proven modules

**Versions:**
- Node.js 20.x LTS (or 22.x for latest)
- Express 4.18+
- TypeScript 5.3+

### Option B: Python + FastAPI

**Why Python + FastAPI (Alternative):**
- Superior ML/AI library ecosystem (NumPy, SciPy, scikit-learn)
- Better for advanced pose analysis and RAG implementation
- Excellent async support with async/await
- Better integration with Claude AI Python SDK

**Versions:**
- Python 3.11+ (3.12 recommended)
- FastAPI 0.109+
- Pydantic 2.0+ (data validation)

### Backend Dependencies (Node.js/Express)

#### Core Framework
- `express` (4.18+) - Web framework
- `cors` (2.8+) - CORS middleware
- `helmet` (7.x) - Security headers
- `dotenv` (16.x) - Environment variables

#### Database and ORM
- `postgresql` (15.x) - Database server
- `typeorm` (0.3+) - ORM for TypeScript/Node.js
  - Supports PostgreSQL, migrations, relationships
  - Alternative: `prisma` (5.x) for simpler schema management
- `redis` (7.x) - In-memory cache and session store
- `node-redis` (4.6+) - Redis client

#### AI and Language Models
- `@anthropic-ai/sdk` (0.20+) - Claude API integration
  - For RAG-powered feedback generation
  - For knowledge base queries
  - For natural language feedback

#### Authentication and Security
- `jsonwebtoken` (9.x) - JWT token generation and validation
- `bcryptjs` (2.4+) - Password hashing
- `express-validator` (7.x) - Input validation
- `express-rate-limit` (7.x) - Rate limiting

#### API Documentation
- `swagger-jsdoc` (6.x) - JSDoc to OpenAPI conversion
- `swagger-ui-express` (5.x) - Swagger UI endpoint

#### Logging and Monitoring
- `pino` (8.x) - Fast JSON logger
- `pino-pretty` (10.x) - Pretty printer for development
- `@sentry/node` (7.x) - Error tracking and performance monitoring

#### Testing
- `jest` (29.x) - Test runner
- `supertest` (6.x) - HTTP assertion library
- `ts-jest` (29.x) - TypeScript support for Jest

### Backend Dependencies (Python/FastAPI)

#### Core Framework
- `fastapi` (0.109+) - Web framework
- `uvicorn` (0.27+) - ASGI server
- `pydantic` (2.0+) - Data validation

#### Database
- `sqlalchemy` (2.0+) - ORM
- `alembic` (1.13+) - Database migrations
- `psycopg2-binary` (2.9+) - PostgreSQL driver
- `redis` (5.0+) - Redis client

#### AI and Language Models
- `anthropic` (0.25+) - Claude API SDK
- `langchain` (0.1+) - LLM framework for RAG
- `chromadb` (0.4+) - Vector database for embeddings

#### Data Processing
- `numpy` (1.26+) - Numerical computation
- `pandas` (2.1+) - Data manipulation
- `scikit-learn` (1.3+) - Machine learning utilities

#### Security
- `python-jose` (3.3+) - JWT handling
- `passlib` (1.7+) - Password hashing
- `python-multipart` (0.0.6+) - File upload handling

#### Testing
- `pytest` (7.x) - Test framework
- `pytest-asyncio` (0.21+) - Async test support
- `httpx` (0.25+) - Async HTTP client for testing

---

## Pose Estimation: MediaPipe

### Why MediaPipe Pose

- **On-Device Processing:** Entire pose estimation runs on mobile device (no cloud dependency)
- **Real-Time Performance:** 33ms latency on modern phones, 60 FPS capability
- **Privacy:** No pose data sent to external servers
- **Accuracy:** 95%+ accuracy for 33 keypoints (including joints not tracked by competitors)
- **Production Ready:** Used by Google, Meta, and thousands of apps

### MediaPipe Setup

- **Package:** `@mediapipe/tasks-vision` (0.10+)
- **Model:** `pose_landmarker_full.tflite` (4.3 MB, includes hand tracking)
- **Alternative:** `pose_landmarker_lite.tflite` (3 MB, reduced accuracy but faster)

### Keypoints Tracked (33 Total)

- Head: nose, left/right eye, left/right ear
- Shoulders and arms: shoulders, elbows, wrists (6 points × 2 sides = 12)
- Hands: 5 points per hand × 2 = 10 (if using full model)
- Trunk: spine/torso (4 points)
- Hips and legs: hips, knees, ankles, heels (6 points × 2 sides = 12)

### Joint Angle Calculation

Backend service implements angle calculation from MediaPipe keypoints using vector math:
- Knee angle: angle between hip-knee-ankle vectors
- Hip angle: angle between shoulder-hip-knee vectors
- Ankle angle: angle between knee-ankle-heel vectors
- Spine angle: angle between shoulders-hips-knees

Thresholds for error detection configured per exercise (e.g., squat knee angle must be within 80-120 degrees).

---

## State Management: Zustand

### Why Zustand

- **Lightweight:** ~2KB minified, zero dependencies
- **Simple API:** Minimal boilerplate compared to Redux
- **TypeScript-First:** Excellent type inference
- **Middleware Support:** DevTools, persist, subscribe patterns
- **Performance:** Automatic re-render optimization

### Store Structure

- **appStore:** Global app state (user auth, theme, loading)
- **workoutStore:** Current workout session (exercise, duration, joint angles)
- **userStore:** User profile and preferences
- **feedbackStore:** Historical feedback and analysis results

---

## Backend Architecture: REST API

### API Endpoints (Proposed)

#### Workout Management
- `GET /api/workouts` - List available exercises (squat, deadlift)
- `POST /api/workouts/:id/sessions` - Start new workout session
- `GET /api/workouts/:id/guide` - Get exercise form guide

#### Session Recording and Analysis
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session with pose data
- `POST /api/sessions/:id/analyze` - Trigger backend analysis
- `GET /api/sessions/:id/analysis` - Retrieve analysis results
- `DELETE /api/sessions/:id` - Delete session

#### Feedback and Knowledge
- `GET /api/feedback/:sessionId` - Get feedback for session
- `POST /api/knowledge/query` - RAG query to knowledge base
- `GET /api/knowledge/topics` - List available topics

#### User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

---

## Database: PostgreSQL + Redis

### PostgreSQL (Primary Datastore)

**Version:** 15.x (production) / 13.x+ (acceptable)

**Schema:**
- `users` table - User accounts and profiles
- `workout_sessions` table - Recording sessions
- `exercise_analysis` table - Pose analysis results
- `feedback_logs` table - Historical feedback
- `knowledge_base` table - Anatomy/kinesiology facts

**ORM Choice:**
- **Node.js:** TypeORM or Prisma (Prisma recommended for simplicity)
- **Python:** SQLAlchemy (industry standard)

### Redis (Cache and Session Store)

**Version:** 7.x

**Purpose:**
- Session token caching (faster than DB lookup)
- Workout session state (in-progress data)
- Frequently accessed knowledge base entries
- Rate limiting (request counts per user)

---

## AI/ML: Claude API + RAG

### Claude API Integration

**SDK:** `@anthropic-ai/sdk` (Node.js) or `anthropic` (Python)

**Use Cases:**
1. **Feedback Generation:** Convert pose analysis into natural language feedback
   - Input: joint angles, error detection results
   - Output: "무릎을 더 펴세요. 현재 무릎 각도는 60도입니다. 스쿼트에서는 무릎이 80-120도 사이에 있어야 합니다."

2. **RAG Knowledge Queries:** Answer user questions with anatomical context
   - Input: "스쿼트할 때 무릎이 아파요"
   - Output: "대퇴사두근 과부하로 인한 가능성이 높습니다. 무릎 앞쪽에 통증이 있으면..."

3. **Form Error Explanation:** Connect pose errors to anatomical consequences
   - Input: ankle not aligned with knee
   - Output: "발목이 무릎과 정렬되지 않으면 발목에 과도한 회전력이 가해져 인대 손상 위험이 증가합니다."

### RAG (Retrieval-Augmented Generation)

**Knowledge Base Structure:**
- Anatomy facts (muscle names, functions, innervation)
- Kinesiology principles (joint movement, optimal angles)
- Common form errors (by exercise)
- Injury prevention guidelines
- Rehabilitation principles

**Implementation:**
- Vector embeddings of knowledge base using Claude's embedding model
- Similarity search to retrieve relevant facts for user query
- Claude API processes query with retrieved context for personalized answer

**Tools:**
- **Node.js:** LangChain.js + Pinecone or Milvus for vector storage
- **Python:** LangChain + Chroma or Pinecone for vector embeddings

---

## Development Environment

### Local Development Setup

#### Requirements
- **Node.js:** 20.x LTS (for Express backend)
- **Python:** 3.11+ (if using FastAPI)
- **PostgreSQL:** 15.x (locally via Docker)
- **Redis:** 7.x (locally via Docker)
- **Git:** 2.40+
- **Docker:** 24.x (for containerized services)
- **Docker Compose:** 2.20+

#### IDE/Editor
- **Recommended:** Visual Studio Code with extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Vue Plugin
  - SQLTools (PostgreSQL)
  - REST Client
  - Docker

### Running Locally

#### Backend (Express)
```
cd backend
npm install
npm run dev              # Starts on http://localhost:3000
```

#### Backend (FastAPI)
```
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

#### Mobile App (Expo)
```
cd mobile
npm install
npx expo start           # Choose iOS Simulator or Android Emulator
```

#### Services (Docker Compose)
```
docker-compose up -d    # Starts PostgreSQL and Redis
```

---

## Build and Deployment

### Mobile App Build

#### Option 1: Expo (Recommended for MVP)
- Simplest build process
- Cloud-based builds via EAS Build
- OTA (Over-The-Air) updates supported
- Build command: `eas build --platform ios --platform android`
- Output: `.ipa` for iOS, `.aab` for Google Play

#### Option 2: Bare React Native
- More control over native code
- Xcode/Android Studio required
- Faster for advanced use cases
- iOS: `xcodebuild` or Xcode IDE
- Android: Gradle and Android Studio

### Backend Deployment

#### Option 1: Docker Container (Recommended)
- Build image: `docker build -t visual-pt-api .`
- Deploy to Kubernetes, Docker Swarm, or managed services
- Support for scaling and health checks

#### Option 2: Serverless
- AWS Lambda + API Gateway (Node.js/Python compatible)
- Azure Functions
- Google Cloud Run
- Limitation: Cold starts may affect pose analysis latency

#### Option 3: Traditional VPS/Cloud VM
- AWS EC2, DigitalOcean, Linode
- Full control, predictable performance
- Manual scaling and monitoring

---

## Key Dependencies Summary

### Mobile (React Native)
| Package | Purpose | Version |
|---------|---------|---------|
| react-native | Core framework | 0.74+ |
| typescript | Type safety | 5.3+ |
| zustand | State management | 4.x |
| react-native-mediapipe-posedetection | RN Native Pose estimation | 0.4.x |
| react-native-vision-camera | Camera + frame processor | 4.x |
| axios | HTTP client | 1.6+ |
| @react-navigation/native | Navigation | 8.x |

### Backend (Node.js)
| Package | Purpose | Version |
|---------|---------|---------|
| express | Web framework | 4.18+ |
| typescript | Type safety | 5.3+ |
| typeorm/prisma | ORM | 0.3+/5.x |
| @anthropic-ai/sdk | Claude API | 0.20+ |
| jsonwebtoken | Authentication | 9.x |
| redis | Caching | 4.6+ |

### Backend (Python)
| Package | Purpose | Version |
|---------|---------|---------|
| fastapi | Web framework | 0.109+ |
| sqlalchemy | ORM | 2.0+ |
| anthropic | Claude API | 0.25+ |
| pydantic | Validation | 2.0+ |
| redis | Caching | 5.0+ |

---

## Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                    │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ React Native Mobile App (iOS/Android)                    │   │
│ │  - Camera Screen (MediaPipe Pose)                        │   │
│ │  - Feedback UI (Visual/Voice)                            │   │
│ │  - Session Playback                                      │   │
│ │  - Zustand State Management                              │   │
│ └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST API
┌──────────────────────────▼──────────────────────────────────────┐
│ API GATEWAY                                                     │
│ Express.js / FastAPI                                            │
│  - Authentication (JWT)                                         │
│  - Route Handling                                               │
│  - Error Handling                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼────────┐  ┌─────▼──────────┐
│ SERVICE LAYER  │  │ SERVICE LAYER │  │ SERVICE LAYER  │
│                │  │                │  │                │
│ PoseAnalysis   │  │ FeedbackGen   │  │ RAGKnowledge   │
│ Session Mgmt   │  │ UserService   │  │ Claude API     │
└───────┬────────┘  └──────┬────────┘  └─────┬──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼────────┐  ┌─────▼──────────┐
│ PostgreSQL     │  │ Redis Cache   │  │ Claude API     │
│                │  │                │  │ (External)     │
│ - Users        │  │ - Sessions     │  │                │
│ - Sessions     │  │ - Feedback     │  │ Feedback Gen   │
│ - Analysis     │  │ - Rate Limits  │  │ RAG Queries    │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## Rationale for Choices

### Why Zustand over Redux?
- Redux is overkill for Visual PT's state complexity
- Zustand has simpler API, smaller bundle, faster learning curve
- DevTools and middleware support sufficient for debugging

### Why PostgreSQL over MongoDB?
- Structured schema fits workout/session data well
- Strong ACID guarantees for user data integrity
- Better performance for relational queries (sessions → analyses → feedback)
- Mature ecosystem and tooling

### Why MediaPipe over custom ML model?
- No need to train custom model (expensive, time-consuming)
- MediaPipe proven in production with high accuracy
- Reduces development risk and time-to-MVP
- Future: can fine-tune or replace if needed

### Why Claude API for feedback?
- Superior natural language quality over GPT-3.5-turbo
- Context window enables complex anatomy explanations
- RAG support for consistent knowledge base answers
- No need to host separate LLM infrastructure

### Why Express over FastAPI for MVP?
- Team familiar with JavaScript ecosystem
- Faster initial development
- Can switch to FastAPI later if ML pipeline complexity increases
- Note: Reconsider if RAG complexity becomes significant

---

## Performance Targets

### Mobile App
- Camera frame rate: 30 FPS minimum
- Pose estimation latency: < 100ms per frame
- Feedback response time: < 500ms
- App memory usage: < 150MB
- Battery impact: < 5% per hour of usage

### Backend API
- API response time: < 200ms (p95)
- Feedback generation: < 1 second
- Session upload: support 50MB files
- Concurrent users: 1,000+ with horizontal scaling

### Database
- Query response: < 50ms (p95)
- Session insert: < 20ms
- Scaling: PostgreSQL handles 10,000+ sessions initially

---

## Security Considerations

### Mobile App
- API keys stored in secure storage (not hardcoded)
- Implement certificate pinning for HTTPS
- User authentication via JWT tokens
- No sensitive data cached in plain text

### Backend API
- HTTPS/TLS encryption for all traffic
- CORS configured to allow only mobile app domain
- Rate limiting to prevent abuse
- Input validation on all endpoints
- JWT token expiration and refresh
- Database credentials in environment variables

### Data Privacy
- No pose video stored on backend (only analysis results)
- Optional: Implement GDPR-compliant data deletion
- End-to-end encryption for sensitive health data consideration

---

## Last Updated
2026-06-01

**Note:** This technology stack is recommended based on current best practices and MVP scope. Technology selections will be validated during the SPEC (Specification) phase with team feedback and adjusted as needed during implementation.
