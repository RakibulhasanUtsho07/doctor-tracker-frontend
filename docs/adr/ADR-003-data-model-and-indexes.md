# ADR-003: Data model and indexes
Status: Proposed; patient fields pending clarification.
Use users, doctors and patients collections with patient.doctorId referencing a doctor. Add indexes only for real access patterns and validate with explain plans. Confirm patient fields, condition vocabulary and delete-vs-detach semantics before schema freeze.
