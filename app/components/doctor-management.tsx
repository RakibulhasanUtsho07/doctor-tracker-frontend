"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiClientError, apiRequest, apiRequestWithMeta } from "../lib/api-client";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type DoctorDraft = Pick<Doctor, "name" | "specialization" | "hospital" | "phone" | "email">;
type DoctorField = keyof DoctorDraft;
type DoctorListPayload = { doctors: Doctor[] };
type PatientSummary = { id: string; doctorId: string | null; name: string; condition?: string; createdAt: string; updatedAt: string };
type EditorMode = "create" | "edit";

type AppliedFilters = {
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const emptyDraft: DoctorDraft = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: ""
};

const fields: Array<{ id: DoctorField; label: string; type: string; minLength: number; maxLength: number; placeholder: string }> = [
  { id: "name", label: "Full name", type: "text", minLength: 2, maxLength: 120, placeholder: "Dr. Amina Rahman" },
  { id: "specialization", label: "Specialization", type: "text", minLength: 2, maxLength: 120, placeholder: "Cardiology" },
  { id: "hospital", label: "Hospital / clinic", type: "text", minLength: 2, maxLength: 160, placeholder: "Central Medical Centre" },
  { id: "phone", label: "Phone", type: "tel", minLength: 5, maxLength: 30, placeholder: "+880 1700 000000" },
  { id: "email", label: "Email address", type: "email", minLength: 5, maxLength: 254, placeholder: "doctor@example.com" }
];

function formatUtcDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "—";
  return new Date(timestamp).toISOString().slice(0, 10);
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.status === 0) return error.message;
  if (error instanceof ApiClientError) return error.message;
  return error instanceof Error ? error.message : fallback;
}

function fieldForServerMessage(message: string): DoctorField | null {
  if (/\bname\b/i.test(message)) return "name";
  if (/specialization/i.test(message)) return "specialization";
  if (/hospital/i.test(message)) return "hospital";
  if (/\bphone\b/i.test(message)) return "phone";
  if (/\bemail\b/i.test(message)) return "email";
  return null;
}

export default function DoctorManagement({
  csrfToken,
  onSessionExpired,
  onDataChanged,
  onAddPatient,
  onViewPatients
}: {
  csrfToken: string;
  onSessionExpired: () => void;
  onDataChanged: () => void;
  onAddPatient: (doctor: { id: string; name: string; specialization: string; hospital: string }) => void;
  onViewPatients: (doctor: { id: string; name: string; specialization: string; hospital: string }) => void;
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [specializationInput, setSpecializationInput] = useState("");
  const [hospitalInput, setHospitalInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [filterError, setFilterError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const selectedDoctorId = selectedDoctor?.id;
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailController = useRef<AbortController | null>(null);
  const [associatedPatients, setAssociatedPatients] = useState<PatientSummary[]>([]);
  const [associatedPatientsTotal, setAssociatedPatientsTotal] = useState(0);
  const [associatedPatientsLoading, setAssociatedPatientsLoading] = useState(false);
  const [associatedPatientsError, setAssociatedPatientsError] = useState("");
  const [associationReload, setAssociationReload] = useState(0);

  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<DoctorDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DoctorField, string>>>({});
  const [formError, setFormError] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [notice, setNotice] = useState("");
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.specialization) params.set("specialization", filters.specialization);
    if (filters.hospital) params.set("hospital", filters.hospital);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(page));
    params.set("limit", String(limit));

    apiRequestWithMeta<DoctorListPayload>("/doctors?" + params.toString(), { signal: controller.signal })
      .then(({ data, meta }) => {
        if (!active) return;
        setDoctors(data.doctors);
        const apiPagination = meta?.pagination;
        setPagination(apiPagination ?? {
          page,
          limit,
          total: data.doctors.length,
          totalPages: data.doctors.length === 0 ? 0 : 1
        });
        setListError("");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        if (error instanceof ApiClientError && error.status === 401) {
          onSessionExpired();
          return;
        }
        setListError(errorMessage(error, "The doctor directory could not be loaded."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [filters, page, limit, reloadCount, onSessionExpired]);

  useEffect(() => () => detailController.current?.abort(), []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const controller = new AbortController();
    let active = true;
    apiRequestWithMeta<{ patients: PatientSummary[] }>("/doctors/" + encodeURIComponent(selectedDoctorId) + "/patients?page=1&limit=10", { signal: controller.signal })
      .then(({ data, meta }) => {
        if (!active) return;
        setAssociatedPatients(data.patients);
        setAssociatedPatientsTotal(meta?.pagination?.total ?? data.patients.length);
        setAssociatedPatientsError("");
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        if (error instanceof ApiClientError && error.status === 401) { onSessionExpired(); return; }
        setAssociatedPatientsError(errorMessage(error, "Associated patients could not be loaded."));
      })
      .finally(() => { if (active) setAssociatedPatientsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [selectedDoctorId, associationReload, onSessionExpired]);

  useEffect(() => {
    if (editorMode) editorHeadingRef.current?.focus();
  }, [editorMode]);

  async function openDetails(doctorId: string) {
    detailController.current?.abort();
    const controller = new AbortController();
    detailController.current = controller;
    setSelectedDoctor(null);
    setAssociatedPatients([]);
    setAssociatedPatientsTotal(0);
    setAssociatedPatientsLoading(true);
    setAssociatedPatientsError("");
    setDetailError("");
    setDetailLoading(true);
    setNotice("");
    try {
      const result = await apiRequest<{ doctor: Doctor }>("/doctors/" + encodeURIComponent(doctorId), {
        signal: controller.signal
      });
      if (!controller.signal.aborted) setSelectedDoctor(result.doctor);
    } catch (error) {
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) return;
      if (error instanceof ApiClientError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setDetailError(errorMessage(error, "Doctor details could not be loaded."));
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
      specialization: specializationInput.trim() || undefined,
      hospital: hospitalInput.trim() || undefined,
      from: fromInput || undefined,
      to: toInput || undefined
    });
  }

  function resetFilters() {
    setSearchInput("");
    setSpecializationInput("");
    setHospitalInput("");
    setFromInput("");
    setToInput("");
    setFilterError("");
    setLoading(true);
    setPage(1);
    setFilters({});
    setReloadCount((value) => value + 1);
  }

  function refreshList() {
    setLoading(true);
    setListError("");
    setReloadCount((value) => value + 1);
  }

  function startCreate() {
    setSelectedDoctor(null);
    setDetailError("");
    setEditorMode("create");
    setDraft({ ...emptyDraft });
    setFieldErrors({});
    setFormError("");
    setNotice("");
  }

  function startEdit() {
    if (!selectedDoctor) return;
    setEditorMode("edit");
    setDraft({
      name: selectedDoctor.name,
      specialization: selectedDoctor.specialization,
      hospital: selectedDoctor.hospital,
      phone: selectedDoctor.phone,
      email: selectedDoctor.email
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

  async function saveDoctor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSavePending(true);

    try {
      const isCreate = editorMode === "create";
      if (!isCreate && !selectedDoctor) {
        setFormError("Choose a doctor record before saving changes.");
        return;
      }
      const path = isCreate ? "/doctors" : "/doctors/" + encodeURIComponent((selectedDoctor as Doctor).id);
      const result = await apiRequest<{ doctor: Doctor }>(path, {
        method: isCreate ? "POST" : "PATCH",
        body: draft,
        csrfToken
      });
      setSelectedDoctor(result.doctor);
      setEditorMode(null);
      setNotice(isCreate ? "Doctor record created successfully." : "Doctor record updated successfully.");
      setListError("");
      setLoading(true);
      setPage(1);
      if (isCreate) {
        setSearchInput("");
        setSpecializationInput("");
        setHospitalInput("");
        setFromInput("");
        setToInput("");
        setFilters({});
      }
      setReloadCount((value) => value + 1);
      onDataChanged();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        onSessionExpired();
        return;
      }
      const message = errorMessage(error, "The doctor record could not be saved.");
      if (error instanceof ApiClientError && error.status === 409) {
        setFieldErrors({ email: "A doctor with this email already exists." });
      } else {
        const field = fieldForServerMessage(message);
        if (field && error instanceof ApiClientError && error.status === 400) setFieldErrors({ [field]: message });
        else setFormError(message);
      }
    } finally {
      setSavePending(false);
    }
  }

  function updateDraft(field: DoctorField, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError("");
  }

  return (
    <section className="doctor-workspace" aria-labelledby="doctor-list-heading">
      <div className="doctor-toolbar">
        <div>
          <p className="section-kicker">DOCTOR DIRECTORY</p>
          <h2 id="doctor-list-heading">Care team directory</h2>
          <p>Search, review and maintain doctor records from the secured API.</p>
        </div>
        <button type="button" className="primary-button doctor-add-button" onClick={startCreate}>+ Add doctor</button>
      </div>

      {notice && <p className="doctor-notice" role="status" aria-live="polite">{notice}</p>}

      {editorMode && (
        <section className="doctor-editor" aria-labelledby="doctor-editor-heading">
          <div className="doctor-editor-heading">
            <div>
              <p className="section-kicker">{editorMode === "create" ? "NEW DIRECTORY RECORD" : "EDIT DIRECTORY RECORD"}</p>
              <h3 id="doctor-editor-heading" ref={editorHeadingRef} tabIndex={-1}>{editorMode === "create" ? "Add a doctor" : "Update doctor details"}</h3>
              <p>All fields below are validated by the API before they are saved.</p>
            </div>
            <button type="button" className="secondary-button" onClick={cancelEditor} disabled={savePending}>Cancel</button>
          </div>
          {formError && <p className="doctor-error" role="alert">{formError}</p>}
          <form className="doctor-form" onSubmit={saveDoctor}>
            {fields.map((field) => (
              <label className="doctor-field" key={field.id}>
                <span>{field.label}<i aria-hidden="true"> *</i></span>
                <input
                  name={field.id}
                  type={field.type}
                  value={draft[field.id]}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  required
                  autoComplete={field.id === "email" ? "email" : field.id === "phone" ? "tel" : "off"}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(fieldErrors[field.id])}
                  aria-describedby={fieldErrors[field.id] ? "doctor-field-error-" + field.id : undefined}
                  onChange={(event) => updateDraft(field.id, event.target.value)}
                  disabled={savePending}
                />
                {fieldErrors[field.id] && <small id={"doctor-field-error-" + field.id} className="doctor-field-error">{fieldErrors[field.id]}</small>}
              </label>
            ))}
            <div className="doctor-form-actions">
              <p>Changes are saved immediately to the API; there is no local draft persistence.</p>
              <button type="submit" className="primary-button" disabled={savePending}>{savePending ? "Saving…" : editorMode === "create" ? "Create doctor" : "Save changes"}</button>
            </div>
          </form>
        </section>
      )}

      <section className="doctor-filter-card" aria-label="Search and filter doctors">
        <form className="doctor-filter-form" onSubmit={applyFilters}>
          <label className="doctor-filter-search"><span>Search directory</span><input type="search" value={searchInput} maxLength={100} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, specialty, hospital or email" /></label>
          <label><span>Specialization</span><input value={specializationInput} maxLength={100} onChange={(event) => setSpecializationInput(event.target.value)} placeholder="Exact specialization" /></label>
          <label><span>Hospital / clinic</span><input value={hospitalInput} maxLength={160} onChange={(event) => setHospitalInput(event.target.value)} placeholder="Exact hospital" /></label>
          <label><span>Created from (UTC)</span><input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} /></label>
          <label><span>Created to (UTC)</span><input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} /></label>
          <div className="doctor-filter-actions">
            <button type="submit" className="primary-button" disabled={loading}>Apply filters</button>
            <button type="button" className="secondary-button" onClick={resetFilters}>Reset</button>
          </div>
        </form>
        {filterError && <p className="doctor-field-error doctor-filter-error" role="alert">{filterError}</p>}
        <p className="doctor-filter-note">Search uses a case-insensitive prefix. Date bounds include the full UTC calendar days.</p>
      </section>

      {(detailLoading || detailError || selectedDoctor) && (
        <section className="doctor-detail-card" aria-labelledby="doctor-detail-heading" aria-busy={detailLoading}>
          {detailLoading && <p className="doctor-loading" role="status">Loading doctor details…</p>}
          {detailError && <p className="doctor-error" role="alert">{detailError}</p>}
          {selectedDoctor && !detailLoading && (
            <>
              <div className="doctor-detail-heading">
                <div>
                  <p className="section-kicker">DOCTOR PROFILE</p>
                  <h3 id="doctor-detail-heading">{selectedDoctor.name}</h3>
                  <p>{selectedDoctor.specialization} · {selectedDoctor.hospital}</p>
                </div>
                <div className="doctor-detail-actions">
                  <button type="button" className="secondary-button" onClick={startEdit}>Edit details</button>
                  <button type="button" className="icon-button doctor-close-detail" aria-label="Close doctor details" onClick={() => setSelectedDoctor(null)}>×</button>
                </div>
              </div>
              <dl className="doctor-detail-grid">
                <div><dt>Email address</dt><dd>{selectedDoctor.email}</dd></div>
                <div><dt>Phone</dt><dd>{selectedDoctor.phone}</dd></div>
                <div><dt>Created (UTC)</dt><dd>{formatUtcDate(selectedDoctor.createdAt)}</dd></div>
                <div><dt>Last updated (UTC)</dt><dd>{formatUtcDate(selectedDoctor.updatedAt)}</dd></div>
                <div className="doctor-detail-id"><dt>Record identifier</dt><dd>{selectedDoctor.id}</dd></div>
              </dl>
              <section className="doctor-associated-patients" aria-labelledby="doctor-associated-heading" aria-busy={associatedPatientsLoading}>
                <div className="doctor-associated-heading">
                  <div><p className="section-kicker">CARE RELATIONSHIPS</p><h4 id="doctor-associated-heading">Associated patients <span>{associatedPatientsTotal.toLocaleString()}</span></h4><p>Detaching a patient preserves the patient record.</p></div>
                  <div className="doctor-detail-actions">
                    <button type="button" className="secondary-button" onClick={() => onViewPatients(selectedDoctor)}>View all</button>
                    <button type="button" className="primary-button" onClick={() => onAddPatient(selectedDoctor)}>+ Add patient</button>
                  </div>
                </div>
                {associatedPatientsError && <p className="doctor-error" role="alert">{associatedPatientsError} <button type="button" className="secondary-button" onClick={() => setAssociationReload((value) => value + 1)}>Retry</button></p>}
                {associatedPatientsLoading && <p className="doctor-loading" role="status">Loading associated patients…</p>}
                {!associatedPatientsLoading && !associatedPatientsError && associatedPatients.length === 0 && <p className="doctor-associated-empty">No patients are currently associated with this doctor.</p>}
                {!associatedPatientsLoading && associatedPatients.length > 0 && <ul className="doctor-associated-list">{associatedPatients.map((patient) => <li key={patient.id}><span><strong>{patient.name}</strong><small>{patient.condition ?? "No condition recorded"}</small></span><span className="doctor-associated-date">{formatUtcDate(patient.createdAt)}</span></li>)}</ul>}
                {associatedPatientsTotal > associatedPatients.length && <p className="doctor-detail-note">Showing the first {associatedPatients.length} associated patients. Use “View all” to search or paginate the complete relationship list.</p>}
              </section>
            </>
          )}
        </section>
      )}

      <section className="doctor-results-card" aria-label="Doctor search results" aria-busy={loading}>
        <div className="doctor-results-heading">
          <div>
            <p className="section-kicker">PERSISTED RECORDS</p>
            <h3>Doctors <span className="doctor-total-count">{pagination.total.toLocaleString()}</span></h3>
            <p id="doctor-results-summary" role="status" aria-live="polite">{loading ? "Updating the directory…" : pagination.total === 0 ? "No doctor records match these filters." : "Showing " + Math.min((page - 1) * limit + 1, pagination.total).toLocaleString() + "–" + Math.min(page * limit, pagination.total).toLocaleString() + " of " + pagination.total.toLocaleString() + " records."}</p>
          </div>
          <button type="button" className="secondary-button doctor-refresh-button" onClick={refreshList} disabled={loading}>Refresh</button>
        </div>
        {listError && <div className="doctor-error doctor-list-error" role="alert"><span>{listError}</span><button type="button" className="secondary-button" onClick={refreshList}>Try again</button></div>}
        <div className="doctor-table-wrap">
          <table className="doctor-table">
            <caption>Doctor directory records returned by the API</caption>
            <thead><tr><th scope="col">Doctor</th><th scope="col">Specialization</th><th scope="col">Hospital / clinic</th><th scope="col">Phone</th><th scope="col">Created (UTC)</th><th scope="col" aria-label="Actions"></th></tr></thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <th scope="row">
                    <button type="button" className="doctor-name-link" onClick={() => void openDetails(doctor.id)}>{doctor.name}</button>
                    <span className="doctor-email">{doctor.email}</span>
                  </th>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.hospital}</td>
                  <td>{doctor.phone}</td>
                  <td>{formatUtcDate(doctor.createdAt)}</td>
                  <td><button type="button" className="doctor-view-link" onClick={() => void openDetails(doctor.id)} aria-label={"View " + doctor.name}>View</button></td>
                </tr>
              ))}
              {!loading && !listError && doctors.length === 0 && (
                <tr><td colSpan={6}><div className="doctor-empty-state"><span className="doctor-empty-symbol" aria-hidden="true">＋</span><strong>No doctors found</strong><p>Create a doctor record or adjust the current search and filters.</p><button type="button" className="secondary-button" onClick={resetFilters}>Clear filters</button></div></td></tr>
              )}
              {loading && doctors.length === 0 && (
                <tr><td colSpan={6}><p className="doctor-loading" role="status">Loading persisted doctor records…</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="doctor-pagination">
          <label>Rows per page
            <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); setLoading(true); }} disabled={loading}>
              {[10, 20, 50, 100].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <span>Page {Math.max(1, pagination.page)} of {Math.max(1, pagination.totalPages)}</span>
          <div>
            <button type="button" className="secondary-button" onClick={() => { setPage((value) => Math.max(1, value - 1)); setLoading(true); }} disabled={loading || page <= 1} aria-label="Previous page">Previous</button>
            <button type="button" className="secondary-button" onClick={() => { setPage((value) => value + 1); setLoading(true); }} disabled={loading || pagination.totalPages === 0 || page >= pagination.totalPages} aria-label="Next page">Next</button>
          </div>
        </div>
      </section>
      <p className="doctor-safety-note">This directory supports create and update only. Deletion and patient-link management are intentionally unavailable because the current API contract has no corresponding safe operations.</p>
    </section>
  );
}
