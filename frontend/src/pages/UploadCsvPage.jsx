import { useState } from "react";
import api from "../api/client";

export default function UploadCsvPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/readings/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
    } finally { setUploading(false); }
  };

  return (
    <section className="glass-card p-5 max-w-3xl animate-rise">
      <h2 className="text-2xl font-semibold">Bulk Upload Sensor Data</h2>
      <p className="text-sm text-slate-600 mt-1">Upload CSV with fields: gas_level, temperature, pressure, smoke_level, location, shift.</p>
      <div className="mt-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mx-auto block text-sm" />
        <p className="text-xs text-slate-500 mt-2">{file ? `Selected: ${file.name}` : "Choose a CSV file to begin."}</p>
      </div>
      <button onClick={upload} disabled={!file || uploading} className="btn-primary mt-4 disabled:opacity-50">{uploading ? "Uploading..." : "Upload and Process"}</button>
      {result && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Successfully inserted <strong>{result.inserted}</strong> readings.</div>}
    </section>
  );
}
