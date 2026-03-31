export default function LoginPage() {
  return (
    <section className="min-h-[74vh] flex items-center justify-center p-3">
      <div className="grid lg:grid-cols-2 max-w-4xl w-full glass-card overflow-hidden animate-rise">
        <div className="p-7 bg-gradient-to-br from-blue-700 to-cyan-700 text-white">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Safety Ops</p>
          <h2 className="text-3xl font-bold mt-2">Welcome Back</h2>
          <p className="text-sm mt-2 text-blue-100">Sign in to monitor alerts, manage incidents, and keep plant operations safe.</p>
        </div>
        <div className="p-7 bg-white">
          <h3 className="text-xl font-semibold mb-4">Operator Login</h3>
          <div className="space-y-3">
            <input className="input-ui" placeholder="Email" />
            <input className="input-ui" type="password" placeholder="Password" />
            <button className="btn-primary w-full">Sign In</button>
            <p className="text-xs text-slate-500">Auth integration pending with backend JWT/session module.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
