# 🚨 PeopleFirst – System Context

## 🧭 Project Overview

PeopleFirst is a real-time disaster response system designed to bridge the gap between disaster prediction and action.

The system is built to ensure:

* Fast alert delivery
* Offline functionality
* Real-time citizen feedback
* Coordinated rescue operations

Core principle:
**Even if the internet fails, alerts and actions should still work.**

---

## 🏗️ System Architecture

The implementation is split into four layers:

1. Backend (Firebase Functions)
2. Mobile App (Flutter)
3. Dashboard (React)
4. Shared models and constants

### Project Structure

```text
backend/
├── functions/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/firebase.ts
│   │   ├── modules/
│   │   │   ├── risk/riskEngine.ts
│   │   │   ├── alerts/
│   │   │   │   ├── alertOrchestrator.ts
│   │   │   │   ├── fcmService.ts
│   │   │   │   ├── smsFallback.ts
│   │   │   │   ├── offlineTrigger.ts
│   │   │   │   └── deliveryTracker.ts
│   │   │   ├── users/
│   │   │   └── zones/
│   │   ├── triggers/
│   │   │   ├── onRiskUpdate.ts
│   │   │   └── onUserResponse.ts
│   │   └── utils/networkCheck.ts
│   └── firebase.json

mobile_app/
├── lib/
│   ├── core/services/
│   │   ├── notification_service.dart
│   │   ├── sms_service.dart
│   │   ├── offline_alert_service.dart
│   │   ├── connectivity_service.dart
│   │   └── local_storage_service.dart
│   ├── features/
│   │   ├── alerts/
│   │   │   ├── alert_listener.dart
│   │   │   └── alert_controller.dart
│   │   ├── emergency/emergency_actions.dart
│   │   └── offline/
│   │       ├── siren_player.dart
│   │       ├── flash_alert.dart
│   │       └── local_rules_engine.dart
│   └── main.dart

dashboard/
└── src/
    └── features/
        ├── alerts/
        │   ├── AlertManager.jsx
        │   └── AlertStatus.jsx
        └── monitoring/DeliveryLogs.jsx

shared/
├── models/
│   ├── user.ts
│   ├── alert.ts
│   ├── zone.ts
│   └── shelter.ts
└── constants/enums.ts

firestore/
├── users/
├── alerts/
├── zones/
├── shelters/
├── responses/
└── tasks/
```

---

## 🔁 Core Flow

1. Disaster data is received from IMD or mock sources.
2. `riskEngine.ts` calculates the risk level.
3. `onRiskUpdate.ts` triggers the alert pipeline.
4. `alertOrchestrator.ts` decides the delivery channel.
5. `networkCheck.ts` selects FCM, SMS fallback, or offline mode.
6. The mobile app receives the alert and presents the emergency UI.
7. The user responds with safe/help actions.
8. The dashboard updates delivery and response status.
9. Authorities use the live status to plan rescue.

---

## 🚨 Multi-Channel Alert System

The alert system uses a fallback-based strategy with this priority order:

1. FCM as the primary channel
2. SMS via device as the fallback channel
3. Offline alerts as the last fallback

Decision logic:

* If internet is available, use FCM.
* If internet is unavailable but the device can still send SMS, use SMS fallback.
* If neither channel is available, trigger offline siren and flash alerts.

This logic is controlled in:
backend/functions/src/modules/alerts/alertOrchestrator.ts

Channel detection is coordinated through:
backend/functions/src/utils/networkCheck.ts

Delivery tracking is recorded in:
backend/functions/src/modules/alerts/deliveryTracker.ts

---

## 📱 Mobile App Responsibilities

* Receive alerts through FCM.
* Display emergency UI.
* Allow user actions:
  * I am Safe
  * Need Help
* Share location when needed.
* Work offline with siren and flash feedback.
* Apply local rules for emergency handling.
* Support volunteer and rescue task flows.

Key mobile modules:

* notification_service.dart handles FCM.
* sms_service.dart handles SMS fallback.
* offline_alert_service.dart triggers siren and flash.
* connectivity_service.dart detects internet availability.
* alert_listener.dart decides how incoming alerts are handled.

---

## 🖥️ Dashboard Responsibilities

* Show live risk and alert status.
* Monitor delivery logs.
* Track delivery outcomes:
  * FCM delivered
  * SMS fallback used
  * Offline triggered
* View user responses.
* Assign rescue teams.
* Track shelters and resources.

---

## ⚙️ Backend Responsibilities

### Risk Engine

* Input: weather or disaster data
* Output: risk level such as LOW, MEDIUM, or HIGH

### Alert Orchestrator

* Decides how to send alerts.
* Calls the FCM, SMS, or offline modules.
* Keeps the delivery path centralized in the backend.

### Triggers

* onRiskUpdate.ts sends alerts after a risk change.
* onUserResponse.ts updates response state and dashboard data.

---

## 🔥 Key Design Principles

1. Offline-first system
2. Multi-channel communication
3. Real-time feedback loop
4. Modular architecture
5. Scalable Firebase backend

---

## 📊 Firestore Collections

* users
* alerts
* zones
* shelters
* responses
* tasks

---

## 🧠 Important Notes for Development

* Do not rely only on internet connectivity.
* Every alert must have a fallback path.
* Keep modules independent.
* Keep critical logic in the backend.
* Mobile should handle offline cases gracefully.

---

## 🎯 Goal of Implementation

Build a system that:

* Works during disasters.
* Handles network failure.
* Provides real-time coordination.
* Scales to district and state level.

---
