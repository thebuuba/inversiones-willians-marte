# Native iOS SwiftUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the iOS app with native Apple code: Swift, SwiftUI, URLSession, and Keychain-backed session storage.

**Architecture:** Add `apps/ios` as the native Apple app codebase. Keep the Nest backend as the API, keep `apps/frontend` for web, and migrate mobile workflows screen by screen.

**Tech Stack:** Swift 6, SwiftUI, Foundation URLSession, XCTest, Xcode.

---

## Scope

1. Create the Swift foundation: API client, auth models, session storage contract.
2. Add SwiftUI login and authenticated shell.
3. Add clients list/detail.
4. Add loans/payments/investors/documents.
5. Add Android later as a separate native Kotlin app after iOS flows are stable.

Do not use Capacitor, Electron, Expo, React Native, or WebView wrappers.

## Task 1: Swift Foundation

**Files:**
- Create: `apps/ios/Package.swift`
- Create: `apps/ios/Sources/InversionesIOS/APIClient.swift`
- Create: `apps/ios/Sources/InversionesIOS/AuthModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/AuthService.swift`
- Create: `apps/ios/Tests/InversionesIOSTests/APIClientTests.swift`

Build a Swift package first so the core mobile logic is testable without opening Xcode.

Verification:

```bash
cd apps/ios
swift test
```

## Task 2: Xcode App Target

Create an iOS App project in Xcode named `InversionesIOS` under `apps/ios/App`, using SwiftUI and bundle id `com.inversioneswilliansmarte.app`.

Add the local Swift package from `apps/ios` to the app target.

## Task 3: Native Login

Implement a SwiftUI login screen:

- username field
- password secure field
- submit button
- loading state
- backend error message
- token persistence

The login endpoint is:

```text
POST /api/v1/auth/login
```

Expected response shape:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "name": "...",
      "username": "...",
      "email": "...",
      "role": "ADMIN"
    }
  }
}
```

## Task 4: Authenticated Shell

After login, show a native tab layout:

- Inicio
- Clientes
- Prestamos
- Inversionistas
- Configuracion

Tabs not implemented yet should show a small placeholder, not a blank screen.

## Task 5: First Real Workflow

Implement Clientes:

- `GET /api/v1/clients`
- list rows
- detail screen
- loading state
- empty state
- backend unreachable state

Keep create/edit for the next phase.

## Verification Before Device Testing

```bash
cd apps/ios
swift test
```

Then in Xcode:

- Build on iPhone simulator.
- Run on physical iPhone.
- Login against `http://<MAC_LAN_IP>:3000/api/v1` for local testing.

## Cut

Skipped for phase 1:

- Android Kotlin project.
- Offline writes.
- Push notifications.
- Native document scanning.
- App Store submission.

Add those after iOS login and Clientes are stable on device.
