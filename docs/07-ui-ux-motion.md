# UI/UX and Motion Specification
## Information architecture
Sign-in, dashboard overview, doctor search/filter/pagination, doctor detail with associated patients, dedicated patient edit/delete/search/filter/pagination and shared navigation.
## Visual system
Use consistent spacing, type, color, border/radius, elevation and focus tokens. Maintain contrast and hierarchy; status must not rely on color alone.
## Motion
Use restrained, short opacity/transform transitions. Do not animate every row, block critical actions, flash, scroll-jack or use motion as the sole feedback. Respect prefers-reduced-motion.
## States and accessibility
Every data view covers loading, populated, empty, error/retry and permission-denied. Forms cover inline validation, server errors, pending state, double-submit prevention and success. Destructive actions require confirmation. Use semantic structure, keyboard controls, visible focus, input labels, dialog focus management, touch-friendly targets and chart text alternatives.
## Evidence
Verify desktop/tablet/mobile, keyboard-only use and reduced-motion. Desktop/mobile screenshots must contain synthetic data only.

## Shell implementation status
The initial shell uses semantic landmarks, a skip-to-content link, visible keyboard focus, focus movement to the selected view heading, a keyboard-operable mobile menu with Escape-to-close, and a global reduced-motion override. [CI #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40496413752) passed source lint and the production build on code commit `dda345a84530ff224d30ace034af09ec369b717a`. These are implementation/CI claims, not completed manual acceptance. The shell PR remains in progress until browser checks at desktop/tablet/mobile widths, keyboard-only navigation, reduced-motion behaviour and synthetic-only screenshots are recorded.
