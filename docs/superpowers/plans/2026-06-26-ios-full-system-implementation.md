# iOS Full System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Inversiones Willians Marte system as a native iOS app using Swift and SwiftUI, matching the existing web system's workflows against the current Nest backend.

**Architecture:** Keep `apps/backend` as the source of truth and keep `apps/frontend` unchanged for web. Build the native iOS app under `apps/ios` with a small tested Swift package for models/API/session logic, plus the Xcode app target in `apps/ios/Inversiones WM`. Each feature is implemented as a vertical slice: API models, service method, view model, SwiftUI screen, and tests.

**Tech Stack:** Swift 6 package code, SwiftUI app target, Foundation `URLSession`, XCTest, Keychain/Security framework for token storage, native Photos/Camera APIs for documents.

---

## Current System Inventory

Backend modules to cover:

- Auth: login, register, profile.
- Users: create, list, detail, toggle active.
- Clients: create, list/search/paginate, basic detail, full detail, update, delete.
- Loan products: create, list, detail, update, delete.
- Loans: create, list/search/filter/paginate, detail, summary.
- Payments: create payment, list loan payments.
- Reports: dashboard, portfolio, collectors, monthly collections, weekly movement, upcoming payments.
- Audit: global audit list, client history.
- Requests: create, count, list, detail, approve, reject.
- Tasks: create, count, list, detail, update, delete.
- Portfolios: create, list, detail, delete.
- Investors: create, list, detail, update, delete.
- Investments: create investment, list investor investments, investment detail, add capital.
- Investor payments: create, check period, list by investment, list by investor.
- Documents: upload/list/download/delete, capture session create/read/close/upload.

Existing web screens to match:

- Login
- Inicio/dashboard
- Clientes list/detail/create/edit
- Prestamos list/detail/create/payment modal
- Solicitudes list/detail/create/approve/reject
- Agenda/tasks
- Caja/cash movement
- Inversionistas list/detail/create/edit/payment
- Inversion investment detail/capital addition receipt
- Documentos list/upload/download/delete/capture
- Carteras
- Configuracion/users

## Non-Goals For The First Complete iOS Pass

- No Android implementation in this plan.
- No offline-first write queue.
- No push notifications.
- No App Store submission.
- No full UI parity pixel-for-pixel with web.

Those come after the iOS system is functionally complete and stable on device.

## Global Rules

- Every API method gets a decoding test with representative backend JSON.
- Every mutating workflow gets a view-model test for success and failure.
- Store auth token in Keychain, not `UserDefaults`.
- Keep screens boring and native: `NavigationStack`, `TabView`, `List`, `Form`, `Sheet`.
- Do not duplicate large logic between views. Extract only after the second real use.
- Keep local dev API URL in one file: `AppEnvironment.swift`.

---

## Phase 0: Stabilize Native iOS Shell

**Files:**
- Modify: `apps/ios/Inversiones WM/Inversiones WM/ContentView.swift`
- Modify: `apps/ios/Inversiones WM/Inversiones WM/Inversiones_WMApp.swift`
- Modify: `apps/ios/Sources/InversionesIOS/AppRootView.swift`
- Create: `apps/ios/Sources/InversionesIOS/AppEnvironment.swift`
- Create: `apps/ios/Sources/InversionesIOS/KeychainSessionStore.swift`
- Test: `apps/ios/Tests/InversionesIOSTests/KeychainSessionStoreTests.swift`

Tasks:

- [ ] Move the hardcoded `http://192.168.1.4:3000/api/v1` into `AppEnvironment`.
- [ ] Replace duplicate app-target login logic with the package `AppRootView`.
- [ ] Add Keychain token storage.
- [ ] Add logout.
- [ ] Keep `Info.plist` HTTP allowance only for Debug builds if practical; otherwise leave the current local allowance until production hardening.

Acceptance:

- [ ] `pnpm ios:test` passes.
- [ ] `xcodebuild -project "apps/ios/Inversiones WM/Inversiones WM.xcodeproj" -scheme "Inversiones WM" -sdk iphoneos -destination "generic/platform=iOS" build` passes.
- [ ] iPhone launches the app and shows login.
- [ ] Valid credentials show the authenticated shell.
- [ ] Relaunch preserves session.
- [ ] Logout clears session.

---

## Phase 1: API Foundation

**Files:**
- Create: `apps/ios/Sources/InversionesIOS/API/APIClient.swift`
- Create: `apps/ios/Sources/InversionesIOS/API/APIError.swift`
- Create: `apps/ios/Sources/InversionesIOS/API/Endpoint.swift`
- Create: `apps/ios/Sources/InversionesIOS/Models/CommonModels.swift`
- Modify: existing `AuthService.swift`, `AuthModels.swift`
- Test: `apps/ios/Tests/InversionesIOSTests/APIClientTests.swift`

Tasks:

- [ ] Add a generic authenticated request method:

```swift
func send<T: Decodable>(_ endpoint: Endpoint, as type: T.Type, token: String?) async throws -> T
```

- [ ] Decode the backend wrapper:

```swift
struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: String?
    let message: String?
}
```

- [ ] Handle 401 by returning an auth-expired error.
- [ ] Handle non-JSON network failures with a readable Spanish error.
- [ ] Support query parameters for list/search endpoints.
- [ ] Support JSON bodies for create/update endpoints.
- [ ] Add a multipart upload method used by the documents phase.

Acceptance:

- [ ] API tests cover GET, POST JSON, query params, auth header, 401, backend error wrapper.

---

## Phase 2: Auth And App Shell

Backend endpoints:

- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/register` for admin user creation, surfaced in Configuracion.

**Files:**
- Create: `apps/ios/Sources/InversionesIOS/Auth/AuthSession.swift`
- Create: `apps/ios/Sources/InversionesIOS/Auth/AuthStore.swift`
- Create: `apps/ios/Sources/InversionesIOS/Auth/AuthService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Shell/AppTabView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Shell/PlaceholderScreen.swift`
- Modify: `apps/ios/Sources/InversionesIOS/LoginView.swift`
- Modify: `apps/ios/Sources/InversionesIOS/LoginViewModel.swift`

Tabs:

- Inicio
- Clientes
- Prestamos
- Caja
- Mas

The `Mas` tab links to Solicitudes, Agenda, Inversionistas, Documentos, Carteras, Configuracion.

Acceptance:

- [ ] Login works on iPhone.
- [ ] Invalid credentials show an error without leaving login.
- [ ] Expired token returns user to login.
- [ ] All tabs render without blank screens.

---

## Phase 3: Dashboard / Inicio

Backend endpoints:

- `GET /reports/dashboard`
- `GET /reports/portfolio`
- `GET /reports/collections/monthly`
- `GET /reports/movement/weekly`
- `GET /reports/payments/upcoming`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Dashboard/DashboardModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Dashboard/DashboardService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Dashboard/DashboardViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Dashboard/DashboardView.swift`
- Test: `apps/ios/Tests/InversionesIOSTests/DashboardServiceTests.swift`
- Test: `apps/ios/Tests/InversionesIOSTests/DashboardViewModelTests.swift`

Screen content:

- Active loans
- Total clients
- Collections today
- Portfolio balance
- Overdue loans
- Upcoming payments list
- Portfolio status summary

Acceptance:

- [ ] Dashboard loads from real backend.
- [ ] Loading, empty, and error states are visible.
- [ ] Pull-to-refresh reloads dashboard data.

---

## Phase 4: Clients

Backend endpoints:

- `GET /clients?search=&take=&skip=`
- `GET /clients/:id`
- `GET /clients/basic/:id`
- `POST /clients`
- `PATCH /clients/:id`
- `DELETE /clients/:id` for ADMIN only.
- `GET /audit/client/:clientId/history`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientsListViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientsListView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientDetailViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientDetailView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientFormViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Clients/ClientFormView.swift`

Features:

- Client list with search.
- Client detail with loans summary.
- Create client.
- Edit client.
- Admin-only delete.
- Client history/audit.

Acceptance:

- [ ] List paginates first 50 and can search.
- [ ] Detail opens from row.
- [ ] Create/edit validates required names before request.
- [ ] Delete is hidden for non-admin users.

---

## Phase 5: Loan Products, Portfolios, Loans

Backend endpoints:

- Loan products: `GET/POST/PATCH/DELETE /loan-products`
- Portfolios: `GET/POST/DELETE /portfolios`, `GET /portfolios/:id`
- Loans: `GET /loans`, `GET /loans/:id`, `GET /loans/:id/summary`, `POST /loans`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Loans/LoanModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/LoansService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/LoansListViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/LoansListView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/LoanDetailViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/LoanDetailView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/NewLoanViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Loans/NewLoanView.swift`
- Create: `apps/ios/Sources/InversionesIOS/LoanProducts/LoanProductsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Portfolios/PortfoliosService.swift`

Features:

- Loans list: filters, search, status badges.
- Loan detail: client, product, schedule, payments, balance.
- New loan form: client picker, product picker, portfolio picker, principal, term, start date, notes.
- Portfolio list/detail.
- Loan products management for admins.

Acceptance:

- [ ] New loan can be created on device.
- [ ] Detail schedule matches backend.
- [ ] Loan list refreshes after create/payment.

---

## Phase 6: Payments And Cash / Caja

Backend endpoints:

- `POST /payments`
- `GET /payments/loan/:loanId`

Existing cash web workflow also uses payment creation and loan/client selection.

Files:

- Create: `apps/ios/Sources/InversionesIOS/Payments/PaymentModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Payments/PaymentsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Payments/RegisterPaymentViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Payments/RegisterPaymentView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Cash/CashViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Cash/CashView.swift`

Features:

- Register loan payment from loan detail.
- Register movement from Caja by selecting client/loan.
- Payment method/reference/notes.
- Receipt summary screen after success.

Acceptance:

- [ ] Payment updates loan balance after refresh.
- [ ] Required amount/date/client/loan validation happens before API request.
- [ ] Duplicate taps cannot submit two payments.

---

## Phase 7: Requests / Solicitudes

Backend endpoints:

- `POST /requests`
- `GET /requests/count`
- `GET /requests`
- `GET /requests/:id`
- `PATCH /requests/:id/approve`
- `PATCH /requests/:id/reject`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Requests/RequestModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Requests/RequestsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Requests/RequestsListViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Requests/RequestsListView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Requests/RequestDetailView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Requests/NewRequestView.swift`

Features:

- List pending/all requests.
- Create request.
- Detail drawer equivalent as native detail screen.
- Approve/reject.

Acceptance:

- [ ] Count badge updates after approve/reject.
- [ ] Approve/reject disabled while request is in progress.

---

## Phase 8: Agenda / Tasks

Backend endpoints:

- `POST /tasks`
- `GET /tasks/count`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id` ADMIN only.

Files:

- Create: `apps/ios/Sources/InversionesIOS/Tasks/TaskModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Tasks/TasksService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Tasks/TasksViewModel.swift`
- Create: `apps/ios/Sources/InversionesIOS/Tasks/TasksView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Tasks/TaskFormView.swift`

Features:

- Task list grouped by status/date.
- Create task.
- Edit task.
- Complete task.
- Delete for admin.

Acceptance:

- [ ] Tasks can be created and marked completed.
- [ ] Non-admin does not see delete.

---

## Phase 9: Investors, Investments, Investor Payments

Backend endpoints:

- Investors: `GET/POST/PATCH/DELETE /investors`
- Investments: `POST /investors/:investorId/investments`, `GET /investors/:investorId/investments`, `GET /investments/:investmentId`, `POST /investments/:investmentId/capital-additions`
- Investor payments: `POST /investor-payments`, `GET /investor-payments/check`, `GET /investor-payments/investment/:investmentId`, `GET /investor-payments/:investorId`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Investors/InvestorModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investors/InvestorsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investors/InvestorsListView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investors/InvestorDetailView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investors/InvestorFormView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investments/InvestmentModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investments/InvestmentsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Investments/InvestmentDetailView.swift`
- Create: `apps/ios/Sources/InversionesIOS/InvestorPayments/InvestorPaymentsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/InvestorPayments/RegisterInvestorPaymentView.swift`

Features:

- Investors list/detail.
- Create/edit investor.
- Create investment for investor.
- Investment detail.
- Add capital.
- Register investor payment.
- Payment period check.
- Receipt summary.

Acceptance:

- [ ] Admin-only investor mutations are hidden for collectors.
- [ ] Payment period check warns before duplicate period payment.
- [ ] Capital addition refreshes investment detail.

---

## Phase 10: Documents And Capture

Backend endpoints:

- `POST /documents` multipart
- `GET /documents?clientId=&investorId=`
- `GET /documents/:id/file`
- `DELETE /documents/:id`
- `POST /documents/capture-sessions`
- public `GET /documents/capture-sessions/:token`
- `POST /documents/capture-sessions/:token/close`
- public `POST /documents/capture-sessions/:token/upload`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Documents/DocumentModels.swift`
- Create: `apps/ios/Sources/InversionesIOS/Documents/DocumentsService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Documents/DocumentsListView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Documents/DocumentUploadView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Documents/DocumentCaptureView.swift`

Features:

- List documents for client/investor/global.
- Upload document from photo library/camera.
- Download/view document.
- Delete admin-only.
- Create capture session and show token/share link.
- Public capture upload screen for token path if needed in app.

Acceptance:

- [ ] Upload supports jpeg/png/pdf where backend accepts it.
- [ ] Large file failures show backend message.
- [ ] Download opens native preview.

---

## Phase 11: Reports, Audit, Configuracion

Backend endpoints:

- Reports listed in Phase 3 plus `GET /reports/collectors`
- Audit: `GET /audit`
- Users: `POST /users`, `GET /users`, `GET /users/:id`, `POST /users/:id/toggle-active`

Files:

- Create: `apps/ios/Sources/InversionesIOS/Reports/ReportsView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Audit/AuditView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Settings/UsersService.swift`
- Create: `apps/ios/Sources/InversionesIOS/Settings/SettingsView.swift`
- Create: `apps/ios/Sources/InversionesIOS/Settings/UserFormView.swift`

Features:

- Report cards and simple native charts/lists.
- Audit list.
- Users list.
- Create user admin-only.
- Toggle active admin-only.

Acceptance:

- [ ] Non-admin users can view allowed settings but not mutate users.
- [ ] Audit list loads and formats dates/actions clearly.

---

## Phase 12: Hardening And Release Readiness

Tasks:

- [ ] Replace local `http://192.168.1.4` with environment switch: Debug local, Release production HTTPS.
- [ ] Remove broad `NSAllowsArbitraryLoads` from Release.
- [ ] Add app icon assets.
- [ ] Add launch screen styling.
- [ ] Add empty/error/loading consistency pass.
- [ ] Add accessibility labels to controls.
- [ ] Add destructive action confirmations.
- [ ] Add smoke-test checklist for iPhone physical device.

Acceptance:

- [ ] App installs on iPhone.
- [ ] App builds for simulator and device.
- [ ] Login, clients, loans, payments, investors, documents, agenda, requests, reports, settings all pass manual smoke checks.
- [ ] `pnpm ios:test` passes.
- [ ] Device build passes with `xcodebuild -sdk iphoneos`.

---

## Smoke Test Checklist

- [ ] Login valid user.
- [ ] Login invalid user.
- [ ] Dashboard loads.
- [ ] Create client.
- [ ] Edit client.
- [ ] Open client detail.
- [ ] Create loan.
- [ ] Register loan payment.
- [ ] Open Caja.
- [ ] Create request.
- [ ] Approve/reject request.
- [ ] Create task.
- [ ] Complete task.
- [ ] Create investor.
- [ ] Create investment.
- [ ] Add investor capital.
- [ ] Register investor payment.
- [ ] Upload document.
- [ ] Download/view document.
- [ ] Open portfolio/carteras.
- [ ] Open audit.
- [ ] Create user as admin.
- [ ] Toggle user active as admin.
- [ ] Logout.
