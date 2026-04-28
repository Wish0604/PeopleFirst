# PeopleFirst Repository Memory

## Purpose
This file is the project-visible working memory for architecture decisions, progress, and implementation gaps.
It is intended to be updated whenever meaningful code changes or improvements are made.

## Update Rule
- Update this file in the same change set whenever features are added, refactored, or fixed.
- Keep entries concise and evidence-based.
- Prefer adding dated log entries under Change Log.

## Product Direction (Locked)
- PeopleFirst is a two-device closed-loop disaster response ecosystem:
  - Mobile app: field layer for citizens and volunteers
  - Control system: dashboard plus backend for authorities
- Core loop: risk analysis -> alerting -> citizen response -> authority coordination -> updated action.
- Priority outcomes: offline resilience, multi-channel alerts, real-time feedback, rescue coordination.

## Current Implementation Snapshot (2026-04-23)

### Implemented
- Dashboard now has Firebase Auth authority login, protected routing, and role-aware access for ADMIN/COLLECTOR/NDRF accounts.
- Dashboard can publish alerts to Firestore.
- Backend active function sends FCM alerts and writes delivery logs.
- Backend ingestion now fans in multiple disaster sources, normalizes them, resolves zones, and computes intelligent risk scores before alert creation.
- Mobile app receives alerts and allows "I am Safe" and "Need Help" response actions.
- Dashboard streams alerts, responses, and delivery logs in real time.
- Dashboard AlertStatus panel now shows latest alert, delivery state, and response summary.
- Dashboard alert surfaces now include triage controls (priority filter + sorting by priority/intelligence) and visual priority/intelligence badges.
- Dashboard and mobile home alert cards now surface explainability fields (`riskPriority`, `riskIntelligenceScore`, `riskIntelligenceReason`, and zone context).
- Mobile SOS screen now surfaces explainability metadata (priority, intelligence score/reason, and zone context) from the latest alert for operator-citizen parity.
- Backend `onRiskUpdate` flow now uses a pure risk-alert payload mapper with dedicated trigger-level integration-style tests for enriched alert metadata.
- Mobile offline modules `siren_player.dart`, `flash_alert.dart`, and `emergency_actions.dart` implemented.
- Fixed Dart compiler type inference errors in `local_storage_service.dart`.
- Dashboard Authority-Grade Coordination Map implemented to track citizen "SAFE" and "NEED HELP" signals locally.
- Dashboard Logistics & Dispatch module created to send coordination instructions and assign resources to active emergencies.
- Mobile Client Logistics Listener implemented to display dispatch signals and instructions in real-time.
- Firestore Security Rules implemented and deployed for strict access control over responses and dispatch logs.

### Not Yet Implemented / Incomplete
- Simulation engine is not implemented (future stretch goal).

### Remaining Changes (Future Continuation)
- Add dashboard visual triage in additional monitoring panels (e.g., DeliveryLogs/TaskBoard cross-highlighting by `riskPriority`).
- Stabilize mobile `flutter run` environment on this machine (memory + symlink prerequisites) for reliable live demo rebuilds.

## Planned Phase Roadmap
1. Backend modularization and orchestration pipeline completion.
2. Multi-channel fallback stack (FCM -> SMS -> Voice) with delivery tracking.
3. Mobile offline-first completion (local persistence, siren, flash, rule engine).
4. Dashboard authority-grade view (status, maps, coordination signals).
5. Feedback loop hardening (response triage and rescue assignment hooks).
6. Security, testing, and production readiness.

## Change Log
- 2026-04-28: Added dashboard authority login, protected routes, and role-aware dashboard shell; updated shared authority roles for ADMIN/COLLECTOR/NDRF.
- 2026-04-28: Removed the unused mobile login screen and switched the app to anonymous session bootstrap only.
- 2026-04-28: Added SOS alert explainability panel (priority, intelligence score/reason, zone) and validated mobile analyze/tests.
- 2026-04-28: Added `onRiskUpdate` risk-alert payload mapper and integration-style tests validating enriched metadata fields (`riskPriority`, `riskIntelligenceScore`, `riskIntelligenceReason`).
- 2026-04-28: Added dashboard visual triage badges/colors for risk priority and intelligence bands; updated repository memory with explicit remaining work list.
- 2026-04-27: Implemented multi-source ingestion fan-in, zone resolution, intelligent risk scoring, and enriched alert metadata in the backend pipeline.
- 2026-04-25: Completed Phase 6: Authored, configured, and successfully deployed hardened Firestore Security Rules to production.
- 2026-04-25: Completed Phase 5: Implemented Mobile Feedback Loop to listen for incoming logistics dispatch signals and display them as alerts to the user.
- 2026-04-25: Started Phase 5: Added LogisticsDispatch component to dashboard for assigning rescue resources and sending coordination instructions.
- 2026-04-25: Started Phase 4: Implemented Dashboard Coordination Map to plot citizen response locations and distress signals in real-time.
- 2026-04-25: Completed Phase 3: Fixed LocalStorageService type inference bugs and finalized offline action hookups in mobile app.
- 2026-04-24: Implemented Phase 2: Multi-channel Fallback with Twilio SMS and Voice integration.
- 2026-04-23: Refactored backend into modular TypeScript pipeline and added dev environment scripts.
- 2026-04-23: Implemented offline `local_storage_service.dart` and `local_rules_engine.dart` in the mobile app.
- 2026-04-23: Created REPO_MEMORY.md and initialized baseline architecture, implementation status, and roadmap.
- 2026-04-23: Implemented dashboard AlertStatus feature and integrated it into the main dashboard layout.
