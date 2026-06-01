# Visual PT — Architecture Overview (Placeholder)

> This file will be populated after the initial codebase is implemented.

## Project Goals

Visual PT is a mobile-first AI personal training app that uses computer vision (pose estimation)
to analyze workout form and deliver real-time feedback grounded in anatomy and kinesiology science.

## Planned Architecture

```
┌────────────────────────────────────────────┐
│  Mobile App (React Native + TypeScript)    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Camera  │ │   Pose   │ │ Feedback  │  │
│  │  Screen  │→│Estimation│→│ Generator │  │
│  └──────────┘ └──────────┘ └───────────┘  │
│                    ↓                        │
│           MediaPipe Pose (On-device)        │
└──────────────────┬─────────────────────────┘
                   │ REST API
┌──────────────────┴─────────────────────────┐
│  Backend API (Node.js/Express)             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Session │ │   User   │ │    RAG    │  │
│  │  Store   │ │ Profile  │ │ Chatbot   │  │
│  └──────────┘ └──────────┘ └───────────┘  │
│         ↓              ↓          ↓        │
│   PostgreSQL        Redis      Claude API  │
└────────────────────────────────────────────┘
```

## Key Design Patterns

- Feature-based module organization (mobile)
- RESTful API with JWT authentication (backend)
- On-device inference for real-time pose estimation (privacy-first)
- RAG pipeline for anatomy knowledge queries

## Status

`[PLACEHOLDER]` — Run `/moai codemaps` after initial implementation to generate full architecture docs.
