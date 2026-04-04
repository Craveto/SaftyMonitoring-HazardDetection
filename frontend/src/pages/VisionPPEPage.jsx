import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function VisionPPEPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [violations, setViolations] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchViolations = async () => {
    const { data } = await api.get("/ppe/violations");
    setViolations(data);
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/ppe/violations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      fetchViolations();
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}> <BackIcon /> </button>
        <div>
          <h2 className="text-2xl font-semibold">AI / CV PPE Check</h2>
          <p className="text-sm text-slate-600 mt-1">Upload an image or short video to simulate PPE detection.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="flow-card">
          <div className="section-title">Upload Media</div>
          <p className="text-sm text-slate-600">Supported: JPG, PNG, MP4. Detection is simulated for demo.</p>
          <input type="file" accept="image/*,video/*" className="mt-3" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn-primary mt-3" disabled={!file || uploading} onClick={onUpload}>
            {uploading ? "Running Check..." : "Run PPE Check"}
          </button>
          {result && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <div className="font-semibold">Result</div>
              <div>Violation: {result.detected ? "Yes" : "No"}</div>
              <div>Type: {result.violation_type}</div>
              <div>Confidence: {Math.round((result.confidence || 0) * 100)}%</div>
            </div>
          )}
        </div>

        <div className="flow-card">
          <div className="section-title">Recent PPE Alerts</div>
          <div className="table-scroll mt-2">
            <table className="data-table min-w-[520px]">
              <thead><tr><th>ID</th><th>File</th><th>Violation</th><th>Status</th></tr></thead>
              <tbody>
                {violations.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-500">No checks yet.</td></tr>
                ) : (
                  violations.map((v) => (
                    <tr key={v.id}>
                      <td>#{v.id}</td>
                      <td>{v.filename}</td>
                      <td>{v.detected ? `${v.violation_type} (${Math.round(v.confidence * 100)}%)` : "clear"}</td>
                      <td>{v.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

