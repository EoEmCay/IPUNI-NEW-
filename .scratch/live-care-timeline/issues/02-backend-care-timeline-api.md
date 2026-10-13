# 02: Backend Care & Insights API Endpoints

**What to build:** RESTful endpoints providing real-time timeline data and weekly insights for family members and caregivers.

**Blocked by:** 01 (Core Insights Logic & Test Coverage)

**Status:** resolved

- [x] Route `GET /api/v1/care/timeline`: Return combined medication doses, actual intake logs, and glucose measurements for a specific date, ordered by time.
- [x] Route `POST /api/v1/care/log-dose`: Allow recording medication intake by patient or caregiver with timestamp and optional notes.
- [x] Route `GET /api/v1/insights/weekly-summary`: Generate the 7-day adherence stats, pattern detection, and weekly digest text for the user.
- [x] Route `GET /api/v1/insights/doctor-report`: Return aggregated 30-day medical consultation briefing data.

## Answer

Implemented in `backend/src/modules/care/care.service.js`, `care.controller.js`, `care.routes.js`, and mounted in `backend/server.js`. Tested and validated with `backend/src/modules/care/care.test.js`.
