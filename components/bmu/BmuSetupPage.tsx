"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, ExternalLink, FileUp, RefreshCw, Save, ShieldCheck, XCircle } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import {
  createBmuCertificateSignedUrl,
  fetchBmuSetupContext,
  reviewBmuCertificate,
  updateBmuCertificateMetadata,
  updateBmuProfile,
  uploadBmuCertificate,
} from "@/services/bmu-service";
import type { BmuCertificate, BmuCertificateInput, BmuProfileUpdateInput, BmuSetupContext, BmuSetupProfile } from "@/types/bmu";

type Profile = {
  id: string;
  role: string;
  county_id: string | null;
  sub_county_id: string | null;
  ward_id: string | null;
  bmu_id: string | null;
};

type CertificateDraft = Omit<BmuCertificateInput, "file"> & { file: File | null };

const allowedRoles = new Set(["Government Admin", "KFS Officer", "County Officer", "BMU Manager"]);
const reviewerRoles = new Set(["Government Admin", "County Officer"]);
const emptyContext: BmuSetupContext = { bmus: [], certificates: [], locations: { counties: [], subCounties: [], wards: [] } };

function fieldClass() {
  return "w-full min-w-0 min-h-11 rounded-xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-text)] transition focus:border-cyan-400";
}

function Label({ children }: { children: string }) {
  return <span className="block text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-text)]">{children}</span>;
}

function statusTone(status?: string | null) {
  if (status === "Verified") return "border-emerald-300/40 bg-emerald-300/15 text-emerald-700";
  if (status === "Rejected") return "border-rose-300/40 bg-rose-300/15 text-rose-700";
  if (status === "Expired") return "border-slate-300/40 bg-slate-300/15 text-slate-600";
  return "border-amber-300/40 bg-amber-300/15 text-amber-700";
}

function CertificateBadge({ status }: { status?: string | null }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(status)}`}>{status ?? "Pending"}</span>;
}

function dateOrDash(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function makeDraft(bmuId: string): CertificateDraft {
  return {
    bmu_id: bmuId,
    certificate_type: "BMU Registration Certificate",
    certificate_number: "",
    area: "",
    issue_date: "",
    expiry_date: "",
    file: null,
  };
}

export function BmuSetupPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [context, setContext] = useState<BmuSetupContext>(emptyContext);
  const [selectedBmuId, setSelectedBmuId] = useState("");
  const [bmuForm, setBmuForm] = useState<BmuProfileUpdateInput | null>(null);
  const [certificateDraft, setCertificateDraft] = useState<CertificateDraft>(makeDraft(""));
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedBmu = useMemo(() => context.bmus.find((bmu) => bmu.id === selectedBmuId) ?? null, [context.bmus, selectedBmuId]);
  const selectedCertificates = useMemo(() => context.certificates.filter((certificate) => certificate.bmu_id === selectedBmuId), [context.certificates, selectedBmuId]);
  const subCounties = useMemo(() => context.locations.subCounties.filter((item) => item.county_id === bmuForm?.county_id), [bmuForm?.county_id, context.locations.subCounties]);
  const wards = useMemo(() => context.locations.wards.filter((item) => item.sub_county_id === bmuForm?.sub_county_id), [bmuForm?.sub_county_id, context.locations.wards]);
  const canReview = profile ? reviewerRoles.has(profile.role) : false;
  const canEdit = profile ? ["Government Admin", "County Officer", "BMU Manager"].includes(profile.role) : false;

  function hydrateBmuForm(bmu: BmuSetupProfile) {
    setBmuForm({
      id: bmu.id,
      name: bmu.name,
      registration_code: bmu.registration_code ?? "",
      county: bmu.county ?? "",
      county_id: bmu.county_id ?? "",
      sub_county_id: bmu.sub_county_id ?? "",
      ward_id: bmu.ward_id ?? "",
      setup_status: bmu.setup_status ?? "In Progress",
    });
    setCertificateDraft(makeDraft(bmu.id));
  }

  async function load(preferredBmuId?: string) {
    setError("");
    if (!hasSupabaseConfig()) {
      setError("Supabase env variables are missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const isDemo =
        typeof document !== "undefined" &&
        (document.cookie.includes("blue_demo_session=true") || Boolean(localStorage.getItem("blue_demo_user")));

      if (isDemo) {
        const demoProfile: Profile = {
          id: "demo-admin-uuid-001",
          role: "Government Admin",
          county_id: "a30fc6e2-6a50-472b-b6f4-ee52f229740c",
          sub_county_id: null,
          ward_id: null,
          bmu_id: "775660f7-c8d8-4e7a-99e8-f65c72152ecc",
        };
        setProfile(demoProfile);
        const nextContext = await fetchBmuSetupContext();
        setContext(nextContext);
        const nextBmuId = preferredBmuId || selectedBmuId || nextContext.bmus[0]?.id || "";
        setSelectedBmuId(nextBmuId);
        const bmu = nextContext.bmus.find((item) => item.id === nextBmuId);
        if (bmu) hydrateBmuForm(bmu);
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!userData.user) throw new Error("Please log in to manage BMU setup.");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,role,county_id,sub_county_id,ward_id,bmu_id")
        .eq("id", userData.user.id)
        .single();
      if (profileError) throw new Error(profileError.message);
      const nextProfile = profileData as Profile;
      setProfile(nextProfile);
      if (!allowedRoles.has(nextProfile.role)) {
        setContext(emptyContext);
        return;
      }
      const nextContext = await fetchBmuSetupContext();
      setContext(nextContext);
      const nextBmuId = preferredBmuId || selectedBmuId || nextProfile.bmu_id || nextContext.bmus[0]?.id || "";
      setSelectedBmuId(nextBmuId);
      const bmu = nextContext.bmus.find((item) => item.id === nextBmuId);
      if (bmu) hydrateBmuForm(bmu);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load BMU setup.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectBmu(id: string) {
    setSelectedBmuId(id);
    const bmu = context.bmus.find((item) => item.id === id);
    if (bmu) hydrateBmuForm(bmu);
  }

  function updateBmuForm<K extends keyof BmuProfileUpdateInput>(key: K, value: BmuProfileUpdateInput[K]) {
    setBmuForm((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      if (key === "county_id") {
        const county = context.locations.counties.find((item) => item.id === value);
        next.county = county?.name ?? "";
        next.sub_county_id = "";
        next.ward_id = "";
      }
      if (key === "sub_county_id") next.ward_id = "";
      return next;
    });
  }

  async function saveBmuProfile() {
    if (!bmuForm) return;
    setError("");
    setNotice("");
    setBusy("bmu");
    try {
      const updated = await updateBmuProfile(bmuForm);
      setContext((current) => ({ ...current, bmus: current.bmus.map((bmu) => (bmu.id === updated.id ? updated : bmu)) }));
      hydrateBmuForm(updated);
      setNotice("BMU setup details saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save BMU profile.");
    } finally {
      setBusy("");
    }
  }

  async function submitCertificateUpload() {
    if (!certificateDraft.file || !certificateDraft.bmu_id) {
      setError("Choose a certificate file before uploading.");
      return;
    }
    setError("");
    setNotice("");
    setBusy("certificate-upload");
    try {
      const certificate = await uploadBmuCertificate({ ...certificateDraft, file: certificateDraft.file });
      await load(certificate.bmu_id);
      setNotice("Certificate uploaded for review.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload certificate.");
    } finally {
      setBusy("");
    }
  }

  async function saveCertificateMetadata(certificate: BmuCertificate) {
    setError("");
    setNotice("");
    setBusy(certificate.id);
    try {
      const updated = await updateBmuCertificateMetadata(certificate);
      setContext((current) => ({ ...current, certificates: current.certificates.map((item) => (item.id === updated.id ? updated : item)) }));
      setNotice("Certificate metadata updated and returned to pending review.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update certificate.");
    } finally {
      setBusy("");
    }
  }

  async function reviewCertificate(certificate: BmuCertificate, status: "Verified" | "Rejected") {
    setError("");
    setNotice("");
    setBusy(`${status}-${certificate.id}`);
    try {
      const updated = await reviewBmuCertificate(certificate, status, reviewNotesById[certificate.id] ?? "");
      await load(updated.bmu_id);
      setNotice(status === "Verified" ? "Certificate verified." : "Certificate rejected.");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review certificate.");
    } finally {
      setBusy("");
    }
  }

  async function openCertificate(certificate: BmuCertificate) {
    setError("");
    setBusy(`open-${certificate.id}`);
    try {
      const signedUrl = await createBmuCertificateSignedUrl(certificate);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Unable to create signed file link.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingState />;
  if (error && !profile) return <EmptyState title="Cannot load BMU setup" body={error} />;
  if (!profile || !allowedRoles.has(profile.role)) return <EmptyState title="BMU setup unavailable" body="Your role does not have access to BMU setup or certificate review." />;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-500">BMU Setup & Verification</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--text)] sm:text-4xl">Profile and Certificate Verification</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted-text)]">
            Manage BMU registration details, upload official certificates, and perform authorized compliance reviews.
          </p>
        </div>
        <button
          onClick={() => void load(selectedBmuId)}
          className="ocean-panel inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[var(--text)] transition hover:border-cyan-400"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            error ? "border-rose-400/40 bg-rose-500/10 text-rose-500" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {error || notice}
        </div>
      )}

      {/* Accessible BMUs Selector */}
      <div className="ocean-panel rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Accessible BMUs</h2>
            <p className="text-xs text-[var(--muted-text)]">Shown according to your assigned role and location scope.</p>
          </div>
          <span className="text-xs font-semibold text-cyan-400">
            {context.bmus.length} {context.bmus.length === 1 ? "BMU" : "BMUs"} accessible
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {context.bmus.length ? (
            context.bmus.map((bmu) => (
              <button
                key={bmu.id}
                type="button"
                onClick={() => selectBmu(bmu.id)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                  selectedBmuId === bmu.id
                    ? "border-cyan-400 bg-cyan-500/10 shadow-sm ring-1 ring-cyan-400/30"
                    : "border-[var(--line)] bg-[var(--soft)] hover:border-cyan-400/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-sm font-bold text-[var(--text)]">{bmu.name}</strong>
                  <CertificateBadge status={bmu.certificate_status} />
                </div>
                <p className="mt-2 text-xs text-[var(--muted-text)]">
                  {bmu.registration_code ?? "No registration code"} · {bmu.county ?? "County not set"}
                </p>
              </button>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState title="No BMUs available" body="No BMU records are currently available under your access scope." />
            </div>
          )}
        </div>
      </div>

      {selectedBmu && bmuForm ? (
        <>
          {/* BMU Profile Details */}
          <div className="ocean-panel rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{selectedBmu.name} Profile</h2>
                <p className="mt-1 text-xs text-[var(--muted-text)]">County, sub-county, ward, and BMU details used for access scoping.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CertificateBadge status={selectedBmu.certificate_status} />
                <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]">
                  {selectedBmu.setup_status ?? "Pending"}
                </span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="BMU name">
                <input
                  disabled={!canEdit}
                  className={fieldClass()}
                  value={bmuForm.name}
                  onChange={(event) => updateBmuForm("name", event.target.value)}
                />
              </Field>
              <Field label="Registration code">
                <input
                  disabled={!canEdit}
                  className={fieldClass()}
                  value={bmuForm.registration_code ?? ""}
                  onChange={(event) => updateBmuForm("registration_code", event.target.value)}
                />
              </Field>
              <Field label="County">
                <select
                  disabled={!canEdit}
                  className={fieldClass()}
                  value={bmuForm.county_id ?? ""}
                  onChange={(event) => updateBmuForm("county_id", event.target.value)}
                >
                  <option value="">Select county</option>
                  {context.locations.counties.map((county) => (
                    <option key={county.id} value={county.id}>
                      {county.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-county">
                <select
                  disabled={!canEdit || !bmuForm.county_id}
                  className={fieldClass()}
                  value={bmuForm.sub_county_id ?? ""}
                  onChange={(event) => updateBmuForm("sub_county_id", event.target.value)}
                >
                  <option value="">Select sub-county</option>
                  {subCounties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ward">
                <select
                  disabled={!canEdit || !bmuForm.sub_county_id}
                  className={fieldClass()}
                  value={bmuForm.ward_id ?? ""}
                  onChange={(event) => updateBmuForm("ward_id", event.target.value)}
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Setup status">
                <select
                  disabled={!canEdit}
                  className={fieldClass()}
                  value={bmuForm.setup_status ?? "In Progress"}
                  onChange={(event) => updateBmuForm("setup_status", event.target.value)}
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Complete</option>
                </select>
              </Field>
            </div>
            {canEdit && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => void saveBmuProfile()}
                  disabled={busy === "bmu"}
                  className="ocean-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save BMU Profile
                </button>
              </div>
            )}
          </div>

          {/* 2-Column Responsive Section: Upload Certificate & Certificate Review */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Column 1: Upload Certificate */}
            <div className="ocean-panel rounded-2xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text)]">Upload Certificate</h2>
              <p className="mt-1 text-xs text-[var(--muted-text)]">
                Files are stored securely. Reviewers open time-limited signed links only.
              </p>
              {canEdit ? (
                <div className="mt-5 grid grid-cols-1 gap-4">
                  <Field label="Certificate type">
                    <input
                      className={fieldClass()}
                      value={certificateDraft.certificate_type}
                      onChange={(event) =>
                        setCertificateDraft((current) => ({ ...current, certificate_type: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Certificate number">
                    <input
                      className={fieldClass()}
                      value={certificateDraft.certificate_number ?? ""}
                      placeholder="e.g. KE-BMU-CERT-2026-001"
                      onChange={(event) =>
                        setCertificateDraft((current) => ({ ...current, certificate_number: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Area">
                    <input
                      className={fieldClass()}
                      value={certificateDraft.area ?? ""}
                      placeholder="e.g. Kilifi Creek & North Channel"
                      onChange={(event) =>
                        setCertificateDraft((current) => ({ ...current, area: event.target.value }))
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Issue date">
                      <input
                        type="date"
                        className={fieldClass()}
                        value={certificateDraft.issue_date ?? ""}
                        onChange={(event) =>
                          setCertificateDraft((current) => ({ ...current, issue_date: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Expiry date">
                      <input
                        type="date"
                        className={fieldClass()}
                        value={certificateDraft.expiry_date ?? ""}
                        onChange={(event) =>
                          setCertificateDraft((current) => ({ ...current, expiry_date: event.target.value }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Certificate file">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className={fieldClass()}
                      onChange={(event) =>
                        setCertificateDraft((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                      }
                    />
                  </Field>
                  <div>
                    <button
                      type="button"
                      onClick={() => void submitCertificateUpload()}
                      disabled={busy === "certificate-upload"}
                      className="ocean-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition active:scale-95 disabled:opacity-50"
                    >
                      <FileUp className="h-4 w-4" /> Upload Certificate
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="View only"
                  body="Your role can view BMU certificate status but cannot upload or edit certificate files."
                />
              )}
            </div>

            {/* Column 2: Certificate Review */}
            <div className="ocean-panel rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Certificate Review</h2>
                  <p className="mt-1 text-xs text-[var(--muted-text)]">
                    BMU Manager can verify certificates. County Officer review is scoped by county.
                  </p>
                </div>
                <span className="text-xs font-semibold text-cyan-400">
                  {selectedCertificates.length} {selectedCertificates.length === 1 ? "record" : "records"}
                </span>
              </div>
              <div className="mt-5 grid gap-4">
                {selectedCertificates.length ? (
                  selectedCertificates.map((certificate) => (
                    <CertificateCard
                      key={certificate.id}
                      certificate={certificate}
                      canEdit={canEdit}
                      canReview={canReview}
                      busy={busy}
                      reviewNote={reviewNotesById[certificate.id] ?? ""}
                      onReviewNoteChange={(value) =>
                        setReviewNotesById((current) => ({ ...current, [certificate.id]: value }))
                      }
                      onOpen={() => void openCertificate(certificate)}
                      onSave={(nextCertificate) => void saveCertificateMetadata(nextCertificate)}
                      onVerify={() => void reviewCertificate(certificate, "Verified")}
                      onReject={() => void reviewCertificate(certificate, "Rejected")}
                    />
                  ))
                ) : (
                  <EmptyState title="No certificate uploaded" body="Upload a BMU certificate to start verification." />
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="Select a BMU" body="Choose an accessible BMU to view setup and certificate verification details." />
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0 w-full">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function CertificateCard({
  certificate,
  canEdit,
  canReview,
  busy,
  reviewNote,
  onReviewNoteChange,
  onOpen,
  onSave,
  onVerify,
  onReject,
}: {
  certificate: BmuCertificate;
  canEdit: boolean;
  canReview: boolean;
  busy: string;
  reviewNote: string;
  onReviewNoteChange: (value: string) => void;
  onOpen: () => void;
  onSave: (certificate: BmuCertificate) => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  const [draft, setDraft] = useState(certificate);

  useEffect(() => {
    setDraft(certificate);
  }, [certificate]);

  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--line)] pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
            <strong className="text-sm font-bold text-[var(--text)] truncate">{certificate.file_name}</strong>
            <CertificateBadge status={certificate.status} />
          </div>
          <p className="mt-1 text-xs text-[var(--muted-text)]">
            Uploaded {dateOrDash(certificate.created_at)} · Issue {dateOrDash(certificate.issue_date)} · Expiry {dateOrDash(certificate.expiry_date)}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          disabled={busy === `open-${certificate.id}`}
          className="ocean-panel inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-cyan-400 disabled:opacity-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open signed file
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2">
          <Field label="Certificate type">
            <input
              disabled={!canEdit}
              className={fieldClass()}
              value={draft.certificate_type ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, certificate_type: event.target.value }))}
            />
          </Field>
        </div>
        <div className="min-w-0">
          <Field label="Certificate number">
            <input
              disabled={!canEdit}
              className={fieldClass()}
              value={draft.certificate_number ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, certificate_number: event.target.value }))}
            />
          </Field>
        </div>
        <div className="min-w-0">
          <Field label="Area">
            <input
              disabled={!canEdit}
              className={fieldClass()}
              value={draft.area ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
            />
          </Field>
        </div>
        <div className="min-w-0">
          <Field label="Issue date">
            <input
              disabled={!canEdit}
              type="date"
              className={fieldClass()}
              value={draft.issue_date ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, issue_date: event.target.value }))}
            />
          </Field>
        </div>
        <div className="min-w-0">
          <Field label="Expiry date">
            <input
              disabled={!canEdit}
              type="date"
              className={fieldClass()}
              value={draft.expiry_date ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, expiry_date: event.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={busy === certificate.id}
            className="ocean-panel inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-cyan-400 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Save metadata
          </button>
        )}
      </div>

      {canReview && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--input)] p-3.5">
          <Label>Review notes</Label>
          <textarea
            value={reviewNote}
            onChange={(event) => onReviewNoteChange(event.target.value)}
            className={`${fieldClass()} mt-2 min-h-20 w-full`}
            placeholder="Add verification or rejection notes..."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onVerify}
              disabled={busy === `Verified-${certificate.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Verify
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={busy === `Rejected-${certificate.id}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 px-3.5 py-1.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/30 active:scale-95 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
