import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import iconReport from "../assets/icon-report.svg";

const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initialState = {
  title: "",
  description: "",
  location: "Zone A",
  severity: "medium",
  reported_by: "",
};

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [toast, setToast] = useState("");

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    const { data } = await api.post("/hazards", form);
    setToast(`Hazard report submitted (ID ${data.id})`);
    setTimeout(() => setToast(""), 2500);
    setForm(initialState);
  };

  const applyTemplate = (template) => {
    setForm((prev) => ({ ...prev, ...template }));
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button
          className="back-btn"
          title="Back"
          aria-label="Back"
          onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}
        >
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Report Hazard</h2>
          <p className="text-sm text-slate-600 mt-1">Log a near-miss or unsafe act for immediate review.</p>
        </div>
        <img className="page-illustration ml-auto" src={iconReport} alt="Hazard report" />
      </div>

      {toast && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {toast}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] mt-5">
        <article>
          <div className="flow-card mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Report Checklist</p>
            <p className="text-sm mt-1 text-slate-700">
              A great hazard report answers what happened, where, who noticed it, and how risky it could become.
            </p>
            <div className="grid gap-3 mt-4 sm:grid-cols-2 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">What</div>
                <div className="font-medium text-slate-800">Describe the unsafe condition or near-miss.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Where</div>
                <div className="font-medium text-slate-800">Add location and zone so teams can respond fast.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Impact</div>
                <div className="font-medium text-slate-800">Choose severity based on potential impact.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Owner</div>
                <div className="font-medium text-slate-800">Provide who noticed it for follow-up.</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick Templates</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    applyTemplate({
                      title: "Oil spill near pump room",
                      severity: "high",
                      location: "Zone B",
                      description: "Slip hazard with visible oil near pump access. Needs cleanup and signage.",
                    })
                  }
                >
                  Oil Spill
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    applyTemplate({
                      title: "Loose ladder on scaffold",
                      severity: "medium",
                      location: "Zone C",
                      description: "Unsecured ladder near scaffold edge. Risk of fall or equipment drop.",
                    })
                  }
                >
                  Loose Ladder
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    applyTemplate({
                      title: "Unmarked hot surface",
                      severity: "critical",
                      location: "Zone A",
                      description: "Hot pipe near aisle without warning. Burn risk for operators.",
                    })
                  }
                >
                  Hot Surface
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Title
              <input name="title" className="input-ui mt-1" value={form.title} onChange={onChange} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Location
              <input name="location" className="input-ui mt-1" value={form.location} onChange={onChange} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Severity
              <select name="severity" className="select-ui mt-1" value={form.severity} onChange={onChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Reported By
              <input name="reported_by" className="input-ui mt-1" value={form.reported_by} onChange={onChange} />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Description
              <textarea name="description" className="textarea-ui mt-1" rows={4} value={form.description} onChange={onChange} />
            </label>
          </div>
          <button className="btn-primary mt-5" onClick={submit}>Submit Hazard Report</button>
        </article>

        <article>
          <div className="flow-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">What happens next</h3>
              <span className="status-badge">Review Flow</span>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Step 1</div>
                <div className="font-semibold text-slate-900">Safety lead reviews the report</div>
                <div className="text-sm text-slate-600 mt-1">Assigns severity, confirms location, and validates details.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Step 2</div>
                <div className="font-semibold text-slate-900">Corrective action is logged</div>
                <div className="text-sm text-slate-600 mt-1">CAPA tasks are created and tracked until closure.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Step 3</div>
                <div className="font-semibold text-slate-900">Lessons learned are shared</div>
                <div className="text-sm text-slate-600 mt-1">Findings are added to training and audits.</div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Severity guide: Low = minor unsafe act, Medium = probable incident, High = serious risk, Critical = immediate danger.
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
