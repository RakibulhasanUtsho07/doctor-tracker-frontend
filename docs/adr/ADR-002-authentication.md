# ADR-002: Administrator authentication and session lifetime

**Status:** Accepted  
**Date:** 2026-10-28

## Decision

- Administrator accounts are provisioned by the system operator through the backend's one-time bootstrap workflow; there is no public registration or client-side hard-coded admin password.
- Password verification and session persistence are handled by the backend. The browser receives an opaque server-issued session cookie marked HttpOnly; production uses the `__Host-dt_session` cookie with Secure and SameSite=None for the separately hosted frontend/API, while the development cookie uses SameSite=Strict without Secure on local HTTP.
- The API stores a hash of the random session token, enforces an eight-hour expiry, revokes sessions at logout, and clears/rejects inactive or expired sessions. Mutations require the session's CSRF token in `X-CSRF-Token`.
- The CSRF token is held in React memory only. Never persist session tokens, CSRF tokens or credentials in localStorage/sessionStorage; the API base URL is public configuration, not a secret.
- The frontend observes the API-returned `expiresAt`, clears the authenticated shell and protected in-memory dashboard/record view at the deadline, and rechecks the deadline when a background tab becomes visible. If the server revokes a session early, the next protected-request 401 also clears protected state and returns to sign-in.
- The browser timer is a UX and state-clearing measure only; every API operation continues to enforce the server-side session and admin authorization.

## Verification

The short-TTL synthetic browser test verifies expiry without a triggering API request. The real API/MongoDB browser test revokes the server session out-of-band, forces the next protected request to return 401, and verifies that patient content, the authenticated badge and browser storage do not retain protected state. Latest real API test-ordering SHA: `b93921b806e9a9a506fc7873034bb76025442133`; pinned backend API SHA: `efd1fd0f016d98da1fe91bdea52bc48f6295217f`.

Production-origin cookie behavior, deployed session-expiry smoke and independent security review remain release gates; automated CI does not close them.
