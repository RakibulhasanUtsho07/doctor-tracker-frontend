# ADR-001: Separate frontend and API
Status: Proposed for assignment; validate during implementation.
Use Next.js in the frontend repository and Express REST API in the backend repository; only the API accesses MongoDB. This satisfies separate repository/deployment goals but requires CORS/session tests and contract synchronization.
