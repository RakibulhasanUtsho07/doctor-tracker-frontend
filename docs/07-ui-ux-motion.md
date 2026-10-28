# UI/UX and Motion Specification

## Information architecture
Sign-in, dashboard overview, doctor search/filter/pagination, doctor detail with associated patients, dedicated patient edit/delete/search/filter/pagination and shared navigation.

## Visual system
Use consistent spacing, type, color, border/radius, elevation and focus tokens. Maintain contrast and hierarchy; status must not rely on color alone.

## Motion
Use restrained, short opacity/transform transitions. Do not animate every row, block critical actions, flash, scroll-jack or use motion as the sole feedback. Respect `prefers-reduced-motion`.

## States and accessibility
Every data view covers loading, populated, empty, error/retry and permission-denied. Forms cover inline validation, server errors, pending state, double-submit prevention and success. Destructive actions require confirmation. Use semantic structure, keyboard controls, visible focus, input labels, dialog focus management, touch-friendly targets and chart text alternatives.

## Evidence
Automated Chromium coverage is not a substitute for real desktop/tablet/mobile browser review, 200% browser zoom, physical touch-device tests, keyboard-only review and assistive-technology review. Desktop/mobile screenshots must use synthetic content only.

## Shell implementation and automated acceptance

The initial shell uses semantic landmarks, a skip-to-content link, visible keyboard focus, focus movement to the selected view heading, a keyboard-operable mobile menu with Escape-to-close, and a global reduced-motion override. Draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9) adds a dedicated Playwright acceptance workflow and synthetic-only screenshots at 1440×1000, 768×1024, 390×844 and 320×800. Its regression cases cover horizontal document overflow, preview-only metrics, placeholder states without fake records, navigation/heading focus, skip-link behavior, reduced-motion CSS and mobile menu focus restoration.

Initial exact-head evidence: [shell browser acceptance #40734087305](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734087305) passed on source/test commit `fba944f4926fa18e192f1447a86b919fba34544e` with 18 passed and 2 expected desktop/tablet skips; [Frontend CI #40734087102](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734087102) also passed on that SHA. The follow-up extends overflow assertions to the doctor/patient placeholder pages and updates the Action runtime pins. Use the branch's exact-head checks for that follow-up; do not transfer the earlier run result to a later SHA. Even when automation is green, actual 200% zoom, physical-device/touch testing, human keyboard-only walkthrough and screen-reader acceptance remain separate manual release gates.
