import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import iconUpload from "../assets/icon-upload.svg";
import { setCache } from "../api/cache";

const sampleCsv = `timestamp,gas_level,temperature,pressure,smoke_level,location,shift
2026-01-01 00:00:00,120,65,210,4,Zone A,Morning
2026-01-01 00:01:00,260,95,190,18,Zone B,Night
`;

const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function UploadCsvPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const [validation, setValidation] = useState({ valid: true, errors: [], warnings: [] });
  const [errorModal, setErrorModal] = useState({ open: false, title: "", details: [] });
  const [bucketOpen, setBucketOpen] = useState(false);
  const [bucketMeta, setBucketMeta] = useState({ rows: 0, alerts: 0, duplicates: 0 });
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: "", tone: "success" }), 3000);
  };

  const showErrorModal = (title, details) => {
    setErrorModal({ open: true, title, details });
  };

  const closeErrorModal = () => {
    setErrorModal({ open: false, title: "", details: [] });
  };

  const normalizeHeader = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const isAlertRow = (row) => {
    const gas = toNumber(row.gas_level);
    const temp = toNumber(row.temperature);
    const smoke = toNumber(row.smoke_level);
    return (gas !== null && gas > 250) || (smoke !== null && smoke > 15) || (temp !== null && temp > 90);
  };

  const buildFingerprint = (row) => {
    const parts = [
      row.timestamp || "",
      row.gas_level || "",
      row.temperature || "",
      row.pressure || "",
      row.smoke_level || "",
      row.location || "",
      row.shift || "",
      "csv",
    ];
    return parts.map((p) => String(p).trim().toLowerCase()).join("|");
  };

  const parseCsvPreview = async (candidate) => {
    if (!candidate) {
      setPreviewRows([]);
      setPreviewHeaders([]);
      setBucketMeta({ rows: 0, alerts: 0, duplicates: 0 });
      return;
    }
    const text = await candidate.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;
    const rawHeaders = lines[0].split(",").map((h) => h.trim());
    const headers = rawHeaders.map(normalizeHeader);
    setPreviewHeaders(rawHeaders);

    const rows = lines.slice(1).map((line) => {
      const values = line.split(",");
      const row = {};
      headers.forEach((key, idx) => {
        row[key] = (values[idx] ?? "").trim();
      });
      return row;
    });

    const seen = new Set();
    const uniqueRows = [];
    let duplicateCount = 0;
    rows.forEach((row) => {
      const fp = buildFingerprint(row);
      if (seen.has(fp)) {
        duplicateCount += 1;
        return;
      }
      seen.add(fp);
      uniqueRows.push(row);
    });

    const alertCount = uniqueRows.reduce((acc, row) => acc + (isAlertRow(row) ? 1 : 0), 0);
    setBucketMeta({ rows: uniqueRows.length, alerts: alertCount, duplicates: duplicateCount });
    setPreviewRows(uniqueRows.slice(0, 60));
  };

  const validateCsv = async (candidate) => {
    if (!candidate) return { valid: false, errors: ["Please choose a CSV file."], warnings: [] };
    if (!candidate.name.toLowerCase().endsWith(".csv")) {
      return { valid: false, errors: ["File must be a .csv format."], warnings: [] };
    }
    if (candidate.size === 0) {
      return { valid: false, errors: ["The CSV file is empty."], warnings: [] };
    }
    if (candidate.size > 10 * 1024 * 1024) {
      return { valid: false, errors: ["File is larger than 10MB. Please upload a smaller CSV."], warnings: [] };
    }

    const head = await candidate.slice(0, 4096).text();
    const firstLine = head.split(/\r?\n/)[0]?.trim();
    if (!firstLine) {
      return { valid: false, errors: ["CSV header row is missing."], warnings: [] };
    }

    const headers = firstLine.split(",").map(normalizeHeader).filter(Boolean);
    if (!headers.length) {
      return { valid: false, errors: ["CSV header row is invalid."], warnings: [] };
    }

    const required = ["gas_level", "temperature", "pressure", "smoke_level", "location", "shift"];
    const optional = ["timestamp"];
    const allowed = new Set([...required, ...optional]);

    const duplicates = headers.filter((h, idx) => headers.indexOf(h) !== idx);
    const missing = required.filter((h) => !headers.includes(h));
    const unknown = headers.filter((h) => !allowed.has(h));

    const errors = [];
    const warnings = [];

    if (missing.length) {
      errors.push(`Missing required columns: ${missing.join(", ")}`);
    }
    if (headers.length < required.length) {
      errors.push("CSV must include all required columns.");
    }
    if (unknown.length) {
      warnings.push(`Extra columns will be ignored: ${unknown.join(", ")}`);
    }
    if (duplicates.length) {
      warnings.push(`Duplicate columns detected: ${[...new Set(duplicates)].join(", ")}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  };

  const parseServerError = (err) => {
    if (!err?.response) {
      if (err?.code === "ECONNABORTED") {
        return ["Upload timed out. Please try again or upload a smaller file."];
      }
      return ["Network error. Please check your connection and try again."];
    }
    const { status, data } = err.response;
    if (status === 413) {
      return ["File too large for the server. Please upload a smaller CSV."];
    }
    if (status === 415) {
      return ["Unsupported file type. Please upload a CSV file."];
    }
    if (status === 400) {
      if (Array.isArray(data?.errors)) return data.errors;
      if (typeof data?.detail === "string") return [data.detail];
      if (typeof data?.error === "string") return [data.error];
      return ["CSV validation failed on the server. Please check column names and data types."];
    }
    return [data?.detail || data?.error || "Upload failed due to a server error."];
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_safety_monitoring.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    if (!file) {
      showErrorModal("No file selected", ["Please choose a CSV file before uploading."]);
      return;
    }
    const check = await validateCsv(file);
    setValidation(check);
    if (!check.valid) {
      showErrorModal("CSV format issues", check.errors);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/readings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResult(data);
      setCache("alerts_list", null);
      setCache("dashboard_summary", null);
      setBucketOpen(true);
      showToast(`Uploaded ${data.inserted} readings successfully`, "success");
    } catch (err) {
      const errors = parseServerError(err);
      showErrorModal("Upload failed", errors);
      showToast("Upload failed. Please review the error details.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel p-5">
      {errorModal.open && (
        <div className="modal-backdrop" onClick={closeErrorModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Upload Error</p>
                <h3 className="text-lg font-semibold">{errorModal.title}</h3>
              </div>
              <button className="modal-close" onClick={closeErrorModal}>Close</button>
            </div>
            <div className="steps-panel">
              <div className="space-y-2 text-sm text-slate-700">
                {errorModal.details.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="steps-item">
                    <div className="steps-index">!</div>
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Bulk Upload Sensor Data</h2>
          <p className="text-sm text-slate-600 mt-1">Upload CSV with fields: gas_level, temperature, pressure, smoke_level, location, shift.</p>
        </div>
        <img className="page-illustration ml-auto" src={iconUpload} alt="Upload CSV" />
      </div>

      {toast.message && (
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">Download a ready-to-use example file if needed.</p>
        </div>
        <button onClick={downloadSample} className="btn-primary">Download Sample CSV</button>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={async (e) => {
            const selected = e.target.files?.[0] || null;
            setFile(selected);
            if (selected) {
              const check = await validateCsv(selected);
              setValidation(check);
              await parseCsvPreview(selected);
              if (!check.valid) {
                showErrorModal("CSV format issues", check.errors);
              } else if (check.warnings.length) {
                showToast(check.warnings[0], "success");
              }
            } else {
              setValidation({ valid: true, errors: [], warnings: [] });
              setPreviewRows([]);
              setPreviewHeaders([]);
              setBucketMeta({ rows: 0, alerts: 0, duplicates: 0 });
            }
          }}
          className="mx-auto block text-sm"
        />
        <p className="text-xs text-slate-500 mt-2">
          {file ? `Selected: ${file.name}` : "Choose a CSV file to begin."}
        </p>
        {!validation.valid && (
          <p className="text-xs text-rose-600 mt-2">CSV has format issues. Please review the error details.</p>
        )}
      </div>

      <button
        onClick={upload}
        disabled={!file || uploading || !validation.valid}
        className="btn-primary mt-4 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload and Process"}
      </button>

      {uploading && (
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Upload progress: {progress}%</p>
        </div>
      )}

      {result && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Successfully inserted <strong>{result.inserted}</strong> readings.</div>}

      {file && previewRows.length > 0 && (
        <div className="mt-6 flow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">CSV Bucket</div>
              <div className="text-lg font-semibold text-slate-900">{file.name}</div>
              <div className="text-sm text-slate-600 mt-1">
                {bucketMeta.rows} unique rows. {bucketMeta.alerts} readings trigger alerts.
                {bucketMeta.duplicates > 0 && ` ${bucketMeta.duplicates} duplicate rows skipped.`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-chip status-critical">Alerts {bucketMeta.alerts}</span>
              <button className="btn-secondary" onClick={() => setBucketOpen((prev) => !prev)}>
                {bucketOpen ? "Hide Preview" : "Open Preview"}
              </button>
            </div>
          </div>

          {bucketOpen && (
            <div className="mt-4">
              <div className="table-scroll">
                <table className="data-table min-w-[920px]">
                  <thead>
                    <tr>
                      {previewHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const alert = isAlertRow(row);
                      return (
                        <tr key={`${row.timestamp || idx}-${idx}`} className={alert ? "alert-row" : ""}>
                          {previewHeaders.map((header) => {
                            const key = normalizeHeader(header);
                            return <td key={`${idx}-${header}`}>{row[key] || "-"}</td>;
                          })}
                          <td>
                            <span className={`alert-pill ${alert ? "alert-pill-critical" : "alert-pill-clear"}`}>
                              {alert ? "Alert" : "Clear"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Showing first {previewRows.length} rows. Alerts are highlighted in red.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

