import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
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

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: "", tone: "success" }), 3000);
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
    if (!file) return;
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
      showToast(`Uploaded ${data.inserted} readings successfully`, "success");
    } catch (err) {
      showToast("Upload failed. Please check the CSV format and try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Bulk Upload Sensor Data</h2>
          <p className="text-sm text-slate-600 mt-1">Upload CSV with fields: gas_level, temperature, pressure, smoke_level, location, shift.</p>
        </div>
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
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mx-auto block text-sm" />
        <p className="text-xs text-slate-500 mt-2">{file ? `Selected: ${file.name}` : "Choose a CSV file to begin."}</p>
      </div>

      <button onClick={upload} disabled={!file || uploading} className="btn-primary mt-4 disabled:opacity-50">{uploading ? "Uploading..." : "Upload and Process"}</button>

      {uploading && (
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Upload progress: {progress}%</p>
        </div>
      )}

      {result && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Successfully inserted <strong>{result.inserted}</strong> readings.</div>}
    </section>
  );
}

