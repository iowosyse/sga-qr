# SGA-QR Final Report: Executive Summary

## 1. Architectural Overview

The SGA-QR project was built upon a modern, scalable, and resilient technology stack designed to handle real-time synchronization and high-availability demands.

- **Backend (FastAPI & Python)**: Serves as the high-performance core engine. FastAPI was selected for its native asynchronous capabilities, ensuring rapid handling of concurrent HTTP requests and WebSockets.
- **Frontend (React & Vite)**: Provides a highly responsive, Single Page Application (SPA) experience for both students and teachers, with specialized hooks to handle hardware permissions (camera/geolocation) natively.
- **Database (PostgreSQL & SQLAlchemy)**: Acts as the transactional source of truth. The ORM enforces strict relational integrity, while constraints protect data against race conditions at the deepest database level.
- **Real-Time Communication (WebSockets)**: Facilitates instant data propagation. Teachers see attendance records pop up the exact millisecond a student registers, thanks to an active pub-sub integration managed within FastAPI.

## 2. Security and Anti-Fraud Mechanisms

The system employs multiple layers of defensive programming to ensure attendance data is unfalsifiable and resistant to exploitation.

- **Dynamic Time-Based One-Time Passwords (TOTP)**: Static QR codes are vulnerable to duplication. The system generates cryptographically secure, rotating TOTP tokens every 15 seconds. Any token older than its immediate validity window is mathematically rejected.
- **Strict Geofencing (Haversine Formula)**: Employs precise geographical bounding. By calculating the exact distance between the student's device and the teacher's device down to the meter, it strictly denies attendance attempts originating from outside the classroom perimeter (e.g., > 15 meters).
- **Concurrency Mitigation (Race Conditions)**: Addresses the critical "Double Scan" problem. By utilizing database-level `UniqueConstraint` mechanisms, the system reliably throws `409 Conflict` errors if two identical attendance requests arrive at the exact same millisecond, preventing duplicate ledger entries.
- **Rate Limiting**: Protects against brute-force attacks on the TOTP endpoint. An in-memory sliding window algorithm aggressively restricts the number of attempts a single client can make per second, mitigating denial-of-service and token-guessing vectors.
- **Automated Memory Cleanup**: A background process driven by `APScheduler` binds to the application lifespan, periodically purging orphaned or timed-out sessions to prevent memory leaks and zombie states.

## 3. Testing Strategy and Quality Assurance

The project maintained an uncompromising standard of Quality Assurance, utilizing rigorous methodologies to guarantee deterministic behavior.

- **Strict Test-Driven Development (TDD)**: Every feature followed the Red-Green-Refactor cycle. Tests were written prior to implementation, ensuring that the source code strictly addressed predefined specifications without over-engineering.
- **Zero Mocking Policy for Database Integrations**: Stubs and mocks were strictly prohibited in data access layers. Integration tests operate against real PostgreSQL instances, validating that transactional rollbacks, constraints, and constraints function perfectly under real-world conditions.
- **End-to-End (E2E) Automation (Cypress)**: Simulates real users navigating Chromium browsers. The UI components were validated by interacting with actual DOM elements, network interceptions, and hardware permission simulations to guarantee the full user journey.
- **Load and Stress Testing (Locust)**: Subjected the system to high-concurrency environments. Virtualizing dozens of simultaneous users bombarding the system validated the resilience of the WebSockets, the efficiency of the connection pool, and the stability of Uvicorn workers under extreme pressure.
