# Collaborative Document Editor Frontend

## 1. Project Overview

This project is a production-style frontend implementation of a collaborative document editor built with React, TypeScript, and Vite.  
It supports role-based permissions, named user onboarding, real-time cross-window collaboration, ownership-based comments (add/edit/delete own), and offline queue/sync with a mock API.

## 2. Tech Stack

- React 18
- TypeScript (strict mode)
- Vite
- Zustand (global state)
- TipTap (rich text editor)
- TailwindCSS (UI styling)
- Mock API service layer
- ESLint + Prettier
- Vitest (unit tests for offline queue + comment service)

## 3. Setup Instructions

```bash
npm install
npm run dev
```

### Other scripts

```bash
npm run build
npm run lint
npm run test
npm run format
npm run format:check
```

## 4. Architecture Explanation

The app uses a feature-based architecture under `src/features`, with each feature owning its own components, services, and types.

```text
src
├ app
├ features
│  ├ editor
│  ├ comments
│  ├ collaboration
│  ├ offline
│  └ roles
├ store
├ services
├ utils
└ types
```

### Design principles

- Separation of concerns between UI components and business/service logic
- Shared models in `src/types` with feature-level type facades
- Centralized state orchestration in `src/store/editorStore.ts`
- Mock API abstraction in `src/services/mockApi.ts`
- Realtime event bus abstraction in `src/features/collaboration/services/realtimeSync.ts`

## 5. State Management Strategy

Zustand store manages:

- `currentUserId`
- `role`
- `documentContent`
- `comments`
- `collaborators`
- `isOffline`
- `offlineQueue`

Actions include:

- `initializeCurrentUser`
- `setUserRole`
- `removeUser`
- `updateDocument`
- `addComment`
- `editComment`
- `deleteComment`
- `toggleOffline`
- `syncOfflineChanges`

Role rules are enforced through `src/utils/permissions.ts` and consumed by the editor UI.

## 6. Offline Strategy

When offline is enabled:

1. Editing and comment actions (add/edit/delete) remain available.
2. Changes are converted to `Change` events and queued in `offlineQueue`.
3. A visible banner communicates offline mode + queue size.

When back online:

1. The store runs `syncOfflineChanges()`.
2. Queued changes are sent to mock API `syncChanges()`.
3. Queued comment/document mutations are replayed to realtime channel.
4. Local queue is cleared after successful sync.

Persisted state:

- Document content and comments are persisted in local storage and restored on refresh.
- Active session user is persisted per-tab (session storage).

## 7. Design Decisions

- TipTap is used for reliable rich text capabilities and text selection handling.
- A `useEditorInstance` hook keeps editor setup isolated from visual components.
- UI keeps a clean layout:
  - Onboarding: name + unique color selection
  - Header: signed-in identity + offline toggle + sign out + presence
  - Admin panel: role assignment and remove-user controls
  - Main: editor area (left) + comment sidebar (right)
- Custom cursor layer uses actual document coordinates (`coordsAtPos`) and named colored pointers.
- Comment composer is inline (no browser prompt) for predictable UX.
- Comment cards include avatar, author, timestamp, and ownership controls.
- Mock API latency is intentionally random to mimic realistic network behavior.

## 8. Future Improvements

- Add proper inline comment anchoring decorations and thread replies.
- Add optimistic UI rollback and error-state handling for sync failures.
- Add integration tests for editor/comment/offline workflows.
- Wire real-time provider (WebSocket/CRDT such as Y.js) for true multi-user collaboration.
