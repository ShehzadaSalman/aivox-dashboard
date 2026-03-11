import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ForgotPassword() {
  const [step, setStep] = useState("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { startPasswordResetEmail, completePasswordResetEmail } = useAuth();
  const navigate = useNavigate();

  const handleStart = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (!email) {
        setError("Email is required.");
        return;
      }
      const result = await startPasswordResetEmail(email);
      if (result.success) {
        setNotice("If that account exists, a reset code was sent.");
        setStep("complete");
      } else {
        setError(result.error || "Failed to send reset code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (!email) {
        setError("Email is required.");
        return;
      }
      if (!code) {
        setError("Reset code is required.");
        return;
      }
      if (!password) {
        setError("New password is required.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      const result = await completePasswordResetEmail(email, code, password);
      if (result.success) {
        navigate("/", { state: { resetSuccess: true } });
      } else {
        setError(result.error || "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-surface-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,31,53,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,45,32,0.1),_transparent_50%),radial-gradient(circle_at_left,_rgba(240,165,0,0.08),_transparent_45%)]" />
      <div className="relative w-full max-w-md p-8 card-surface rounded-2xl">
        <div className="mb-6 text-center">
          <img
            src="/new-logo-website.png"
            alt="AI Vox Agency"
            className="h-16 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-[0.3em] uppercase rounded-full bg-gold-500/15 text-gold-600">
            Reset Password
          </div>
          <h1 className="mt-4 mb-2 text-3xl font-semibold text-navy-900">
            Recover your account
          </h1>
          <p className="text-ink-600">
            We will email you a 6-digit reset code.
          </p>
        </div>

        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
          >
            Back to login
          </button>
        </div>

        {step === "start" && (
          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label
                htmlFor="resetEmail"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                Email
              </label>
              <input
                id="resetEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-center text-accent-700 rounded-md bg-accent-600/10 border border-accent-600/20">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 text-sm text-center rounded-md text-navy-900 bg-navy-50 border border-navy-100">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        )}

        {step === "complete" && (
          <form onSubmit={handleComplete} className="space-y-5">
            <div>
              <label
                htmlFor="resetCode"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                Reset Code
              </label>
              <input
                id="resetCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-base"
                placeholder="Enter the 6-digit code"
                required
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                placeholder="Enter your new password"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-base"
                placeholder="Re-enter your new password"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-center text-accent-700 rounded-md bg-accent-600/10 border border-accent-600/20">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 text-sm text-center rounded-md text-navy-900 bg-navy-50 border border-navy-100">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend reset code
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-center text-ink-600">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
