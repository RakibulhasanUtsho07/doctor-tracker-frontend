# Database Engineering
## Proposed collections
users: normalized unique email, passwordHash, role, active flag and timestamps. Never store plaintext passwords.
doctors: name and normalized search field, specialization, hospital, phone, normalized email and timestamps.
patients: doctorId ObjectId reference, name and normalized search field, approved minimum condition/category and timestamps. The assignment does not enumerate patient fields or condition taxonomy; confirm before schema freeze.
## Relationships and deletion
One doctor may have many patients. Validate doctor existence on patient create/update. Clarify whether removing from a doctor's list means deleting or detaching the patient and record the decision in an ADR.
## Candidate indexes and query rules
Unique users.emailNormalized; doctor indexes aligned to actual search/sort; patient compound doctorId + createdAt and date/condition combinations only when justified by explain plans. Use bounded page sizes (proposed max 100), stable sort, allowlisted sort fields, projections, UTC timestamps and server-side dashboard aggregates. Avoid N+1 loops, raw client query objects and arbitrary regex. Index choices require measured evidence.
