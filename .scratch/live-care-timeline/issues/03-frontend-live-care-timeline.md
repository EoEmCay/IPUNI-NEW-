# 03: Frontend Live Care Timeline (Grab-style)

**What to build:** An intuitive, real-time vertical event progression ("Grab-like live timeline") for family members and caregivers showing the day's care status from top to bottom.

**Blocked by:** 02 (Backend Care & Insights API Endpoints)

**Status:** resolved

- [x] Component `CareTimeline`: Render vertical node list with clear color states (Green: Completed, Blue/Teal: In progress/Upcoming, Red: Missed/Attention needed).
- [x] Support 3 user perspectives:
  - Perspective A (Elderly user): High readability, 1-touch confirmation button "Tôi đã uống cữ này".
  - Perspective B (Caregiver/Hộ lý): Quick checklist to record given doses, glucose, handover notes.
  - Perspective C (Family observer): Real-time peace of mind view showing parent's daily progress.
- [x] Weekly Digest card displaying the automated natural-language summary.

## Answer

Implemented in `frontend/src/components/care/CareTimeline.jsx` and `CareTimeline.module.css`. Integrated seamlessly into `frontend/src/pages/Tabs/FamilyPage.jsx`. Build passes cleanly.
