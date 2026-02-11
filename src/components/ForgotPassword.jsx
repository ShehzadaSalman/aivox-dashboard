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
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-lime-50">
      <div className="absolute rounded-full pointer-events-none -top-28 -left-28 h-72 w-72 bg-amber-200/40 blur-3xl" />
      <div className="absolute rounded-full pointer-events-none -bottom-24 -right-24 h-80 w-80 bg-rose-200/40 blur-3xl" />
      <div className="w-full max-w-md p-8 border shadow-xl bg-white/80 backdrop-blur border-white/60 rounded-2xl">
        <div className="mb-6 text-center">
          <img
            src="/new-logo-website.png"
            alt="AI Vox Agency"
            className="h-20 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-amber-100 text-amber-800">
            Reset Password
          </div>
          <h1 className="mt-4 mb-2 text-2xl font-bold text-gray-900">
            Recover your account
          </h1>
          <p className="text-gray-600">
            We will email you a 6-digit reset code.
          </p>
        </div>

        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-gray-900 underline hover:text-gray-700"
          >
            Back to login
          </button>
        </div>

        {step === "start" && (
          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label
                htmlFor="resetEmail"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="resetEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-center text-red-500 rounded-lg bg-red-50">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 text-sm text-center rounded-lg text-emerald-600 bg-emerald-50">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white transition duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Reset Code
              </label>
              <input
                id="resetCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter the 6-digit code"
                required
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your new password"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Re-enter your new password"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-center text-red-500 rounded-lg bg-red-50">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 text-sm text-center rounded-lg text-emerald-600 bg-emerald-50">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white transition duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full text-gray-900 underline hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend reset code
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-center text-gray-600">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-gray-900 underline hover:text-gray-700"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
