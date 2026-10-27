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
