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

The shell uses semantic landmarks, a skip-to-content link, visible keyboard focus, focus movement to the selected view heading, a keyboard-operable mobile menu with Escape-to-close, and a global reduced-motion override. Draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9) adds a dedicated Playwright acceptance workflow and synthetic-only screenshots at 1440×1000, 768×1024, 390×844 and 320×800. Regression cases cover horizontal overflow on dashboard and doctor/patient placeholder views, preview-only metrics, no fabricated records, navigation/current-page semantics, heading focus, skip-link behavior, reduced-motion CSS and mobile menu focus restoration.

The latest validated source/test candidate is `90acaacffd3ae7d7b8b2497f0d981bc1ef0d73d6`. [Shell browser acceptance #40734481302](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302) passed with 18 passed and 2 expected desktop/tablet skips; [Frontend CI #40734481280](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481280) also passed. PR-triggered checks [#40734490848](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490848) and [#40734490743](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490743) passed on the same source/test SHA. The synthetic [viewport artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302/artifacts/12837305294) is retained for 14 days. Later documentation-only commits must be checked on their exact resulting head. Automated success does not close actual 200% zoom, physical-device/touch, human keyboard-only or screen-reader acceptance.
