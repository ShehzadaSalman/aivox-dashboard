import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register, startPhoneVerification, verifyPhone } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      let result;
      if (isRegistering) {
        if (!name) {
          setError("Name is required for registration");
          setLoading(false);
          return;
        }
        if (!phone) {
          setError("Phone number is required for registration");
          setLoading(false);
          return;
        }
        result = await register(email, password, name, phone);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        if (result.pending) {
          setNotice(result.message || "Your account is pending approval.");
          setVerificationEmail(email);
          setIsRegistering(false);
          setName("");
          setPassword("");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setVerificationLoading(true);

    try {
      if (!verificationEmail) {
        setError("Please register to verify your phone number.");
        return;
      }
      if (!verificationCode) {
        setError("Verification code is required.");
        return;
      }
      const result = await verifyPhone(verificationEmail, verificationCode);
      if (result.success) {
        setNotice("Phone number verified successfully.");
        setVerificationCode("");
        setVerificationEmail("");
      } else {
        setError(result.error || "Verification failed");
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setNotice("");
    setVerificationLoading(true);
    try {
      if (!verificationEmail) {
        setError("Please register to receive a verification code.");
        return;
      }
      const result = await startPhoneVerification(verificationEmail, phone);
      if (result.success) {
        setNotice("Verification code sent.");
      } else {
        setError(result.error || "Failed to resend code");
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-lime-50 flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="bg-white/80 backdrop-blur border border-white/60 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="AI Vox Agency"
            className="h-12 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold tracking-wide uppercase">
            AI Receptionist
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">Sign in to manage your voice agents</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              placeholder="Enter your email"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Enter your phone number"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          {notice && (
            <div className="text-emerald-600 text-sm text-center bg-emerald-50 p-3 rounded-lg">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {verificationEmail && (
          <form onSubmit={handleVerifyPhone} className="mt-6 space-y-4">
            <div className="text-center text-sm text-gray-600">
              Enter the verification code sent to your phone.
            </div>
            <div>
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="Enter the 6-digit code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={verificationLoading}
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verificationLoading ? "Verifying..." : "Verify Phone"}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={verificationLoading}
              className="w-full text-gray-900 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend verification code
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-gray-900 hover:text-gray-700 underline"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
