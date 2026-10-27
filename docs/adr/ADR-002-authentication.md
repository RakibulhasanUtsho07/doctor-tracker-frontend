# ADR-002: Authentication
Status: Proposed; implementation not started.
Choose password hashing and initial admin provisioning before coding login. For cookies, configure Secure/HttpOnly/SameSite and CSRF protection. For JWT, validate signature, algorithm, issuer, audience and expiry. Never store long-lived credentials in localStorage. Record final design once agreed.
