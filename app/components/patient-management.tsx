"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiClientError, apiRequest, apiRequestWithMeta } from "../lib/api-client";

type Patient = {
  id: string;
  doctorId: string | null;
  name: string;
  condition?: string;
  createdAt: string;
  updatedAt: string;
};
type DoctorOption = { id: string; name: string; specialization?: string; hospital?: string };
type PatientDraft = { doctorId: string; name: string; condition: string };
type PatientField = "doctorId" | "name" | "condition";
type EditorMode = "create" | "edit";
type ActionConfirmation = { kind: "delete" | "detach"; patient: Patient };
type AppliedFilters = { search?: string; doctorId?: string; condition?: string; from?: string; to?: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type PrefillRequest = { doctor: DoctorOption; intent: "create" | "filter" } | null;

const blankDraft: PatientDraft = { doctorId: "", name: "", condition: "" };
const emptyPagination: Pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

function utcDate(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : "—";
}

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function PatientManagement({
  csrfToken,
  onSessionExpired,
  onDataChanged,
  initialRequest,
  onInitialRequestConsumed
}: {
  csrfToken: string;
  onSessionExpired: () => void;
  onDataChanged: () => void;
  initialRequest: PrefillRequest;
  onInitialRequestConsumed: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listReload, setListReload] = useState(0);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [extraDoctor] = useState<DoctorOption | null>(() => initialRequest?.doctor ?? null);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorReload, setDoctorReload] = useState(0);
  const [doctorsError, setDoctorsError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [doctorFilterInput, setDoctorFilterInput] = useState(() => initialRequest?.intent === "filter" ? initialRequest.doctor.id : "");
  const [conditionFilterInput, setConditionFilterInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [filters, setFilters] = useState<AppliedFilters>(() => initialRequest?.intent === "filter" ? { doctorId: initialRequest.doctor.id } : {});
  const [filterError, setFilterError] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailController = useRef<AbortController | null>(null);

  const [editorMode, setEditorMode] = useState<EditorMode | null>(() => initialRequest?.intent === "create" ? "create" : null);
  const [draft, setDraft] = useState<PatientDraft>(() => initialRequest?.intent === "create" ? { ...blankDraft, doctorId: initialRequest.doctor.id } : { ...blankDraft });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PatientField, string>>>({});
  const [formError, setFormError] = useState("");
  const [savePending, setSavePending] = useState(false);
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);

  const [confirmation, setConfirmation] = useState<ActionConfirmation | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);

  const doctorChoices = useMemo(() => extraDoctor && !doctors.some((doctor) => doctor.id === extraDoctor.id) ? [extraDoctor, ...doctors] : doctors, [doctors, extraDoctor]);
  const doctorById = useMemo(() => new Map(doctorChoices.map((doctor) => [doctor.id, doctor])), [doctorChoices]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    apiRequestWithMeta<{ doctors: DoctorOption[] }>("/doctors?page=1&limit=100", { signal: controller.signal })
      .then(({ data }) => {
        if (!active) return;
        setDoctors(data.doctors);
        setDoctorsError("");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        if (error instanceof ApiClientError && error.status === 401) {
          onSessionExpired();
          return;
        }
        setDoctorsError(describeError(error, "The doctor choices could not be loaded."));
      })
      .finally(() => { if (active) setDoctorsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [onSessionExpired, doctorReload]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.doctorId) params.set("doctorId", filters.doctorId);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(page));
    params.set("limit", String(limit));

    apiRequestWithMeta<{ patients: Patient[] }>("/patients?" + params.toString(), { signal: controller.signal })
      .then(({ data, meta }) => {
        if (!active) return;
        setPatients(data.patients);
        setPagination(meta?.pagination ?? { page, limit, total: data.patients.length, totalPages: data.patients.length ? 1 : 0 });
        setListError("");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        if (error instanceof ApiClientError && error.status === 401) {
          onSessionExpired();
          return;
        }
        setListError(describeError(error, "The patient directory could not be loaded."));
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; controller.abort(); };
  }, [filters, page, limit, listReload, onSessionExpired]);

  useEffect(() => () => detailController.current?.abort(), []);
  useEffect(() => { if (editorMode) editorHeadingRef.current?.focus(); }, [editorMode]);

  useEffect(() => {
    if (!confirmation) return;
    confirmationCancelRef.current?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actionPending) {
        setConfirmation(null);
        setActionError("");
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".patient-confirm-dialog");
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => window.removeEventListener("keydown", handleDialogKeys);
  }, [confirmation, actionPending]);

  useEffect(() => {
    if (initialRequest) onInitialRequestConsumed();
  }, [initialRequest, onInitialRequestConsumed]);

  async function openPatient(patientId: string) {
    detailController.current?.abort();
    const controller = new AbortController();
    detailController.current = controller;
    setSelectedPatient(null);
    setDetailError("");
    setDetailLoading(true);
    setNotice("");
    try {
      const result = await apiRequest<{ patient: Patient }>("/patients/" + encodeURIComponent(patientId), { signal: controller.signal });
      if (!controller.signal.aborted) setSelectedPatient(result.patient);
    } catch (error) {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) return;
      if (error instanceof ApiClientError && error.status === 401) { onSessionExpired(); return; }
      setDetailError(describeError(error, "Patient details could not be loaded."));
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError("");
    if (fromInput && toInput && fromInput > toInput) {
      setFilterError("The start date must be on or before the end date.");
      return;
    }
    setLoading(true);
    setNotice("");
    setPage(1);
    setFilters({
      search: searchInput.trim() || undefined,
      doctorId: doctorFilterInput || undefined,
      condition: conditionFilterInput.trim() || undefined,
      from: fromInput || undefined,
      to: toInput || undefined
    });
  }

  function resetFilters() {
    setSearchInput("");
    setDoctorFilterInput("");
    setConditionFilterInput("");
    setFromInput("");
    setToInput("");
    setFilterError("");
    setLoading(true);
    setPage(1);
    setFilters({});
    setListReload((value) => value + 1);
  }

  function refreshList() {
    setLoading(true);
    setListError("");
    setListReload((value) => value + 1);
  }

  function startCreate() {
    setSelectedPatient(null);
    setDetailError("");
    setEditorMode("create");
    setDraft({ ...blankDraft });
    setFieldErrors({});
    setFormError("");
    setNotice("");
  }

  function startEdit() {
    if (!selectedPatient) return;
    setEditorMode("edit");
    setDraft({
      doctorId: selectedPatient.doctorId ?? "",
      name: selectedPatient.name,
      condition: selectedPatient.condition ?? ""
    });
    setFieldErrors({});
    setFormError("");
    setNotice("");
  }

  function cancelEditor() {
    setEditorMode(null);
    setFieldErrors({});
    setFormError("");
  }

  function updateDraft(field: PatientField, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError("");
  }

  async function savePatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSavePending(true);
    try {
      if (draft.name.trim().length < 2 || draft.name.trim().length > 120) {
        setFieldErrors({ name: "Name must contain 2 to 120 characters." });
        return;
      }
      if (draft.condition.trim().length > 100) {
        setFieldErrors({ condition: "Condition must be at most 100 characters." });
        return;
      }
      if (draft.condition.trim().length === 0 && editorMode === "edit" && selectedPatient?.condition) {
        setFieldErrors({ condition: "The current API cannot clear an existing condition. Enter a replacement or cancel." });
        return;
      }
      if (editorMode === "create" && !draft.doctorId) {
        setFieldErrors({ doctorId: "Choose a doctor before creating the patient." });
        return;
      }
      if (editorMode === "edit" && !selectedPatient) {
        setFormError("Choose a patient record before saving changes.");
        return;
      }

      const isCreate = editorMode === "create";
      const payload: Record<string, string> = { name: draft.name.trim() };
      if (draft.condition.trim()) payload.condition = draft.condition.trim();
      if (draft.doctorId && (isCreate || draft.doctorId !== selectedPatient?.doctorId)) payload.doctorId = draft.doctorId;
      const path = isCreate ? "/patients" : "/patients/" + encodeURIComponent((selectedPatient as Patient).id);
      const result = await apiRequest<{ patient: Patient }>(path, {
        method: isCreate ? "POST" : "PATCH",
        body: isCreate ? { doctorId: draft.doctorId, ...payload } : payload,
        csrfToken
      });
      setSelectedPatient(result.patient);
      setEditorMode(null);
      setNotice(isCreate ? "Patient record created successfully." : "Patient record updated successfully.");
      setListError("");
      setLoading(true);
      setPage(1);
      setListReload((value) => value + 1);
      onDataChanged();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) { onSessionExpired(); return; }
      const message = describeError(error, "The patient record could not be saved.");
      const field = /condition/i.test(message) ? "condition" : /name/i.test(message) ? "name" : /doctor/i.test(message) ? "doctorId" : null;
      if (field && error instanceof ApiClientError && error.status === 400) setFieldErrors({ [field]: message });
      else setFormError(error instanceof ApiClientError && error.status === 404 && /doctor/i.test(message)
        ? "That doctor could not be found. Refresh the directory and choose an existing doctor."
        : message);
    } finally {
      setSavePending(false);
    }
  }

  async function performConfirmedAction() {
    if (!confirmation || actionPending) return;
    const current = confirmation;
    if (current.kind === "detach" && !current.patient.doctorId) return;
    setActionPending(true);
    setActionError("");
    try {
      if (current.kind === "delete") {
        await apiRequest<void>("/patients/" + encodeURIComponent(current.patient.id), {
          method: "DELETE", csrfToken
        });
      } else {
        await apiRequest<void>(
          "/doctors/" + encodeURIComponent(current.patient.doctorId as string) + "/patients/" + encodeURIComponent(current.patient.id),
          { method: "DELETE", csrfToken }
        );
      }
      setConfirmation(null);
      setSelectedPatient(null);
      setEditorMode(null);
      setNotice(current.kind === "delete"
        ? "Patient record permanently deleted."
        : "Patient detached from the doctor. The patient record was preserved.");
      setLoading(true);
      setListReload((value) => value + 1);
      onDataChanged();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) { onSessionExpired(); return; }
      setActionError(describeError(error, "The requested action could not be completed."));
    } finally {
      setActionPending(false);
    }
  }

  function doctorLabel(doctorId: string | null): string {
    if (!doctorId) return "Unassigned";
    const doctor = doctorById.get(doctorId);
    return doctor ? doctor.name : "Doctor " + doctorId.slice(0, 8) + "…";
  }

  return (
    <section className="patient-workspace" aria-labelledby="patient-list-heading">
      <div className="patient-toolbar">
        <div>
          <p className="section-kicker">PATIENT RECORDS</p>
          <h2 id="patient-list-heading">Patient directory</h2>
          <p>Manage the minimum patient record fields and preserve the distinction between detaching and deleting.</p>
        </div>
        <button type="button" className="primary-button patient-add-button" onClick={startCreate}>+ Add patient</button>
      </div>

      {notice && <p className="patient-notice" role="status" aria-live="polite">{notice}</p>}
      {doctorsError && <div className="patient-warning" role="status"><strong>Doctor choices unavailable</strong><span>{doctorsError} Listing patients still works; add or reassign needs an existing doctor identifier.</span><button type="button" className="secondary-button" onClick={() => { setDoctorsLoading(true); setDoctorReload((value) => value + 1); }}>Retry doctors</button></div>}

      {editorMode && (
        <section className="patient-editor" aria-labelledby="patient-editor-heading">
          <div className="patient-editor-heading">
            <div>
              <p className="section-kicker">{editorMode === "create" ? "NEW PATIENT RECORD" : "EDIT PATIENT RECORD"}</p>
              <h3 id="patient-editor-heading" ref={editorHeadingRef} tabIndex={-1}>{editorMode === "create" ? "Add a patient" : "Update patient details"}</h3>
              <p>Only the documented minimum fields are collected. The API validates and persists changes.</p>
            </div>
            <button type="button" className="secondary-button" onClick={cancelEditor} disabled={savePending}>Cancel</button>
          </div>
          {formError && <p className="patient-error" role="alert">{formError}</p>}
          <form className="patient-form" onSubmit={savePatient}>
            <label className="patient-field">
              <span>Patient name<i aria-hidden="true"> *</i></span>
              <input name="name" value={draft.name} minLength={2} maxLength={120} required autoComplete="off" placeholder="Patient name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "patient-field-error-name" : undefined} onChange={(event) => updateDraft("name", event.target.value)} disabled={savePending} />
              {fieldErrors.name && <small id="patient-field-error-name" className="patient-field-error">{fieldErrors.name}</small>}
            </label>
            <label className="patient-field">
              <span>Doctor association{editorMode === "create" ? <i aria-hidden="true"> *</i> : null}</span>
              <select name="doctorId" value={draft.doctorId} required={editorMode === "create"} aria-invalid={Boolean(fieldErrors.doctorId)} aria-describedby={fieldErrors.doctorId ? "patient-field-error-doctorId" : undefined} onChange={(event) => updateDraft("doctorId", event.target.value)} disabled={savePending || doctorsLoading}>
                <option value="">{doctorsLoading ? "Loading doctors…" : editorMode === "create" ? "Choose a doctor" : "Keep current association"}</option>
                {doctorChoices.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} — {doctor.specialization ?? "Doctor"}</option>)}
              </select>
              {fieldErrors.doctorId && <small id="patient-field-error-doctorId" className="patient-field-error">{fieldErrors.doctorId}</small>}
              {editorMode === "edit" && <small className="patient-field-hint">Choose a different doctor to reassign. Use the Detach action to preserve the patient record without a doctor.</small>}
            </label>
            <label className="patient-field">
              <span>Condition <small>(optional, free text)</small></span>
              <input name="condition" value={draft.condition} maxLength={100} autoComplete="off" placeholder="Optional condition" aria-invalid={Boolean(fieldErrors.condition)} aria-describedby={fieldErrors.condition ? "patient-field-error-condition" : "patient-condition-help"} onChange={(event) => updateDraft("condition", event.target.value)} disabled={savePending} />
              {fieldErrors.condition
                ? <small id="patient-field-error-condition" className="patient-field-error">{fieldErrors.condition}</small>
                : <small id="patient-condition-help" className="patient-field-hint">No controlled condition taxonomy is defined. Existing conditions cannot currently be cleared by the API; enter a replacement if needed.</small>}
            </label>
            <div className="patient-form-actions">
              <p>Passwords, credentials and additional patient demographics are not collected here.</p>
              <button type="submit" className="primary-button" disabled={savePending || (editorMode === "create" && doctorsLoading)}>{savePending ? "Saving…" : editorMode === "create" ? "Create patient" : "Save changes"}</button>
            </div>
          </form>
        </section>
      )}

      <section className="patient-filter-card" aria-label="Search and filter patients">
        <form className="patient-filter-form" onSubmit={applyFilters}>
          <label className="patient-filter-search"><span>Search patients</span><input type="search" value={searchInput} maxLength={100} onChange={(event) => setSearchInput(event.target.value)} placeholder="Patient name or condition" /></label>
          <label><span>Doctor</span><select value={doctorFilterInput} onChange={(event) => setDoctorFilterInput(event.target.value)}><option value="">All doctors</option>{doctorChoices.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></label>
          <label><span>Condition (exact)</span><input value={conditionFilterInput} maxLength={100} onChange={(event) => setConditionFilterInput(event.target.value)} placeholder="Exact condition" /></label>
          <label><span>Created from (UTC)</span><input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} /></label>
          <label><span>Created to (UTC)</span><input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} /></label>
          <div className="patient-filter-actions">
            <button type="submit" className="primary-button" disabled={loading}>Apply filters</button>
            <button type="button" className="secondary-button" onClick={resetFilters}>Reset</button>
          </div>
        </form>
        {filterError && <p className="patient-field-error patient-filter-error" role="alert">{filterError}</p>}
        <p className="patient-filter-note">Search uses a case-insensitive literal prefix. Date bounds include complete UTC calendar days. The doctor selector is limited to the API&apos;s first 100 doctor records; use “Add patient” from a doctor profile for another doctor.</p>
      </section>

      {(detailLoading || detailError || selectedPatient) && (
        <section className="patient-detail-card" aria-labelledby="patient-detail-heading" aria-busy={detailLoading}>
          {detailLoading && <p className="patient-loading" role="status">Loading patient details…</p>}
          {detailError && <p className="patient-error" role="alert">{detailError}</p>}
          {selectedPatient && !detailLoading && (
            <>
              <div className="patient-detail-heading">
                <div><p className="section-kicker">PATIENT PROFILE</p><h3 id="patient-detail-heading">{selectedPatient.name}</h3><p>{selectedPatient.condition ?? "No condition recorded"} · {doctorLabel(selectedPatient.doctorId)}</p></div>
                <div className="patient-detail-actions">
                  <button type="button" className="secondary-button" onClick={startEdit}>Edit details</button>
                  <button type="button" className="icon-button patient-close-detail" aria-label="Close patient details" onClick={() => setSelectedPatient(null)}>×</button>
                </div>
              </div>
              <dl className="patient-detail-grid">
                <div><dt>Patient identifier</dt><dd>{selectedPatient.id}</dd></div>
                <div><dt>Doctor association</dt><dd>{doctorLabel(selectedPatient.doctorId)}</dd></div>
                <div><dt>Created (UTC)</dt><dd>{utcDate(selectedPatient.createdAt)}</dd></div>
                <div><dt>Last updated (UTC)</dt><dd>{utcDate(selectedPatient.updatedAt)}</dd></div>
              </dl>
              <div className="patient-detail-actions patient-detail-bottom">
                {selectedPatient.doctorId && <button type="button" className="secondary-button" onClick={() => setConfirmation({ kind: "detach", patient: selectedPatient })}>Detach from doctor</button>}
                <button type="button" className="danger-button" onClick={() => setConfirmation({ kind: "delete", patient: selectedPatient })}>Delete patient record</button>
              </div>
            </>
          )}
        </section>
      )}

      {actionError && <p className="patient-error" role="alert">{actionError}</p>}

      <section className="patient-results-card" aria-label="Patient search results" aria-busy={loading}>
        <div className="patient-results-heading">
          <div><p className="section-kicker">PERSISTED RECORDS</p><h3>Patients <span className="patient-total-count">{pagination.total.toLocaleString()}</span></h3><p role="status" aria-live="polite">{loading ? "Updating the directory…" : pagination.total === 0 ? "No patient records match these filters." : "Showing " + Math.min((page - 1) * limit + 1, pagination.total).toLocaleString() + "–" + Math.min(page * limit, pagination.total).toLocaleString() + " of " + pagination.total.toLocaleString() + " records."}</p></div>
          <button type="button" className="secondary-button patient-refresh-button" onClick={refreshList} disabled={loading}>Refresh</button>
        </div>
        {listError && <div className="patient-error patient-list-error" role="alert"><span>{listError}</span><button type="button" className="secondary-button" onClick={refreshList}>Try again</button></div>}
        <div className="patient-table-wrap">
          <table className="patient-table">
            <caption>Patient records returned by the API</caption>
            <thead><tr><th scope="col">Patient</th><th scope="col">Doctor</th><th scope="col">Condition</th><th scope="col">Created (UTC)</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <th scope="row"><button type="button" className="patient-name-link" onClick={() => void openPatient(patient.id)}>{patient.name}</button><span className="patient-row-id">{patient.id}</span></th>
                  <td>{doctorLabel(patient.doctorId)}</td>
                  <td>{patient.condition ?? "—"}</td>
                  <td>{utcDate(patient.createdAt)}</td>
                  <td><div className="patient-row-actions"><button type="button" className="patient-view-link" onClick={() => void openPatient(patient.id)}>View</button>{patient.doctorId && <button type="button" className="patient-detach-link" onClick={() => setConfirmation({ kind: "detach", patient })}>Detach</button>}<button type="button" className="patient-delete-link" onClick={() => setConfirmation({ kind: "delete", patient })}>Delete</button></div></td>
                </tr>
              ))}
              {!loading && !listError && patients.length === 0 && <tr><td colSpan={5}><div className="patient-empty-state"><span className="patient-empty-symbol" aria-hidden="true">＋</span><strong>No patients found</strong><p>Create a patient record or adjust the current search and filters.</p><button type="button" className="secondary-button" onClick={resetFilters}>Clear filters</button></div></td></tr>}
              {loading && patients.length === 0 && <tr><td colSpan={5}><p className="patient-loading" role="status">Loading persisted patient records…</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="patient-pagination">
          <label>Rows per page<select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); setLoading(true); }} disabled={loading}>{[10, 20, 50, 100].map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <span>Page {Math.max(1, pagination.page)} of {Math.max(1, pagination.totalPages)}</span>
          <div><button type="button" className="secondary-button" onClick={() => { setPage((value) => Math.max(1, value - 1)); setLoading(true); }} disabled={loading || page <= 1} aria-label="Previous page">Previous</button><button type="button" className="secondary-button" onClick={() => { setPage((value) => value + 1); setLoading(true); }} disabled={loading || pagination.totalPages === 0 || page >= pagination.totalPages} aria-label="Next page">Next</button></div>
        </div>
      </section>

      <p className="patient-safety-note">Deleting a patient permanently removes the patient record. Detaching removes only the doctor association and preserves the patient. Both actions require confirmation and the API&apos;s CSRF protection.</p>

      {confirmation && (
        <div className="patient-dialog-backdrop">
          <section className="patient-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="patient-confirm-heading" aria-describedby="patient-confirm-description">
            <p className="section-kicker">{confirmation.kind === "delete" ? "PERMANENT ACTION" : "RELATIONSHIP CHANGE"}</p>
            <h3 id="patient-confirm-heading">{confirmation.kind === "delete" ? "Delete this patient record?" : "Detach this patient from the doctor?"}</h3>
            <p id="patient-confirm-description">{confirmation.kind === "delete"
              ? "This permanently deletes " + confirmation.patient.name + "'s patient record. This cannot be undone."
              : "This removes " + confirmation.patient.name + " from the doctor's list. The patient record and condition are preserved and remain searchable."}</p>
            {actionError && <p className="patient-error" role="alert">{actionError}</p>}
            <div className="patient-dialog-actions">
              <button ref={confirmationCancelRef} type="button" className="secondary-button" onClick={() => { setConfirmation(null); setActionError(""); }} disabled={actionPending}>Cancel</button>
              <button type="button" className={confirmation.kind === "delete" ? "danger-button" : "primary-button"} onClick={() => void performConfirmedAction()} disabled={actionPending}>{actionPending ? "Working…" : confirmation.kind === "delete" ? "Delete permanently" : "Detach and preserve"}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
