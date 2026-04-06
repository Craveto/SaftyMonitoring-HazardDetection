import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import iconVision from "../assets/icon-vision.svg";

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
  const [validation, setValidation] = useState({ valid: true, errors: [], warnings: [] });
  const [errorModal, setErrorModal] = useState({ open: false, title: "", details: [] });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });

  const showErrorModal = (title, details) => {
    setErrorModal({ open: true, title, details });
  };

  const closeErrorModal = () => {
    setErrorModal({ open: false, title: "", details: [] });
  };

  const openDetailModal = (row) => {
    setDetailModal({ open: true, data: row });
  };

  const closeDetailModal = () => {
    setDetailModal({ open: false, data: null });
  };

  const validateMedia = (candidate) => {
    if (!candidate) return { valid: false, errors: ["Please choose an image or video file."], warnings: [] };
    const name = candidate.name.toLowerCase();
    const sizeLimit = 25 * 1024 * 1024;
    const allowed = [".jpg", ".jpeg", ".png", ".mp4"];
    if (!allowed.some((ext) => name.endsWith(ext))) {
      return { valid: false, errors: ["Unsupported file type. Use JPG, PNG, or MP4."], warnings: [] };
    }
    if (candidate.size === 0) {
      return { valid: false, errors: ["The selected file is empty."], warnings: [] };
    }
    if (candidate.size > sizeLimit) {
      return { valid: false, errors: ["File is larger than 25MB. Please upload a smaller file."], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  };

  const parseServerError = (err) => {
    if (!err?.response) {
      if (err?.code === "ECONNABORTED") {
        return ["Upload timed out. Please try a smaller file or check your network."];
      }
      return ["Network error. Please check your connection and try again."];
    }
    const { status, data } = err.response;
    if (status === 413) return ["File too large for the server. Please upload a smaller file."];
    if (status === 415) return ["Unsupported media type. Please upload JPG, PNG, or MP4."];
    if (status === 400) {
      if (Array.isArray(data?.errors)) return data.errors;
      if (typeof data?.detail === "string") return [data.detail];
      if (typeof data?.error === "string") return [data.error];
      return ["Validation failed on the server. Please try another file."];
    }
    return [data?.detail || data?.error || "PPE check failed due to a server error."];
  };

  const fetchViolations = async () => {
    const { data } = await api.get("/ppe/violations");
    setViolations(data);
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const onUpload = async () => {
    if (!file) {
      showErrorModal("No file selected", ["Please choose an image or video before running the check."]);
      return;
    }
    const check = validateMedia(file);
    setValidation(check);
    if (!check.valid) {
      showErrorModal("Media format issue", check.errors);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/ppe/violations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      fetchViolations();
    } catch (err) {
      showErrorModal("PPE check failed", parseServerError(err));
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
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PPE Check Error</p>
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
      {detailModal.open && detailModal.data && (
        <div className="modal-backdrop" onClick={closeDetailModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PPE Alert Detail</p>
                <h3 className="text-lg font-semibold">File: {detailModal.data.filename}</h3>
              </div>
              <button className="modal-close" onClick={closeDetailModal}>Close</button>
            </div>
            <div className="steps-panel space-y-3 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Violation</div>
                  <div className="text-base font-semibold text-slate-900">
                    {detailModal.data.detected
                      ? `${detailModal.data.violation_type} (${Math.round(detailModal.data.confidence * 100)}%)`
                      : "clear"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Status</div>
                  <div className="text-base font-semibold text-slate-900">{detailModal.data.status}</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Media Preview</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <img src={iconVision} alt="PPE preview" className="w-8 h-8" />
                  </div>
                  <div className="text-sm text-slate-600">
                    {detailModal.data.filename}
                    <div className="text-xs text-slate-500 mt-1">Preview is simulated for demo.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Activity Log</div>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li>1. Media uploaded and queued for PPE scan.</li>
                  <li>2. Model evaluated helmet/vest/goggles/gloves.</li>
                  <li>
                    3. Result: {detailModal.data.detected ? "Violation detected" : "No violation"}.
                  </li>
                  <li>4. Alert saved and visible on PPE alerts list.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}> <BackIcon /> </button>
        <div>
          <h2 className="text-2xl font-semibold">AI / CV PPE Check</h2>
          <p className="text-sm text-slate-600 mt-1">Upload an image or short video to simulate PPE detection.</p>
        </div>
        <img className="page-illustration ml-auto" src={iconVision} alt="PPE vision check" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="flow-card">
          <div className="section-title">Upload Media</div>
          <p className="text-sm text-slate-600">
            Supported: JPG, PNG, MP4. Detection is simulated for demo.
          </p>
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">How this AI/CV PPE check works</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>1. You upload a photo or short clip from the shop floor.</li>
              <li>2. A PPE detector scans for helmet, vest, goggles, and gloves.</li>
              <li>3. If PPE is missing, we create a PPE alert in the database.</li>
              <li>4. The alert shows up in Recent PPE Alerts and can be resolved.</li>
            </ul>
            <div className="mt-2 text-xs text-slate-500">
              In production, this can be powered by YOLOv8 or similar CV models.
            </div>
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            className="mt-3"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
              if (selected) {
                const check = validateMedia(selected);
                setValidation(check);
                if (!check.valid) {
                  showErrorModal("Media format issue", check.errors);
                }
              } else {
                setValidation({ valid: true, errors: [], warnings: [] });
              }
            }}
          />
          {!validation.valid && (
            <p className="text-xs text-rose-600 mt-2">Selected media has issues. Please review the error details.</p>
          )}
          <button className="btn-primary mt-3" disabled={!file || uploading || !validation.valid} onClick={onUpload}>
            {uploading ? "Running Check..." : "Run PPE Check"}
          </button>
          {result && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <div className="font-semibold">Result</div>
              <div>Violation: {result.detected ? "Yes" : "No"}</div>
              <div>Type: {result.violation_type}</div>
              <div>Confidence: {Math.round((result.confidence || 0) * 100)}%</div>
              <div className="mt-1 text-xs text-slate-600">
                {result.detected
                  ? "Alert saved. Review in Alerts or mark resolved."
                  : "No violation detected. Logged for audit trace."}
              </div>
            </div>
          )}
        </div>

        <div className="flow-card">
          <div className="section-title">Recent PPE Alerts</div>
          <div className="table-scroll mt-2" style={{ maxHeight: "260px" }}>
            <table className="data-table min-w-[520px]">
              <thead><tr><th>ID</th><th>File</th><th>Violation</th><th>Status</th></tr></thead>
              <tbody>
                {violations.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-500">No checks yet.</td></tr>
                ) : (
                  violations.map((v) => (
                    <tr key={v.id} className="cursor-pointer" onClick={() => openDetailModal(v)}>
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

