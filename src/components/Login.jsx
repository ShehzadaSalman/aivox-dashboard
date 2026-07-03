import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import PendingApproval from "./PendingApproval";

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
  const [pendingApproval, setPendingApproval] = useState(false);
  const {
    login,
    register,
    startPhoneVerification,
    verifyPhone,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.resetSuccess) {
      setNotice("Password reset successfully. Please sign in.");
      setError("");
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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
      } else if (result.pending) {
        // Approved-status check failed: account exists but awaits approval.
        setPendingApproval(true);
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
        setNotice(
          "Email verified! Your account is pending approval — we'll email you as soon as it's active."
        );
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


  if (pendingApproval) {
    return (
      <PendingApproval
        email={verificationEmail || email}
        onBack={() => {
          setPendingApproval(false);
          setError("");
          setNotice("");
          setPassword("");
        }}
      />
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-surface-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,31,53,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,45,32,0.1),_transparent_50%),radial-gradient(circle_at_left,_rgba(240,165,0,0.08),_transparent_45%)]" />
      <div className="relative w-full max-w-md p-8 card-surface rounded-2xl">
        <div className="mb-8 text-center">
          <img
            src="/candibly-vertical-logo.png"
            alt="Candibly"
            className="h-20 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-[0.3em] uppercase rounded-full bg-gold-500/15 text-gold-600">
            AI Receptionist
          </div>
          <h1 className="mt-4 mb-2 text-3xl font-semibold text-navy-900">
            {isRegistering ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-ink-600">
            {isRegistering
              ? "Sign up to manage your voice agents"
              : "Sign in to manage your voice agents"}
          </p>
        </div>

        {!verificationEmail && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
                Step 1 of 2
              </div>
            )}
            {isRegistering && (
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="input-base"
                placeholder="Enter your email"
                required
              />
            </div>

            {isRegistering && (
              <div>
                <label
                  htmlFor="phone"
                  className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
                >
                  Phone
                </label>
                <PhoneInput
                  defaultCountry="us"
                  value={phone}
                  onChange={(nextPhone) => setPhone(nextPhone)}
                  className="w-full"
                  inputClassName="w-full rounded-md border border-navy-100 bg-white px-4 py-2 text-ink-900 outline-none transition focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
                  countrySelectorStyleProps={{
                    buttonClassName:
                      "h-full px-3 border border-navy-100 rounded-md bg-white text-ink-900",
                    buttonContentWrapperClassName: "gap-2",
                  }}
                  inputProps={{ id: "phone" }}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="input-base"
                placeholder="Enter your password"
                required
              />
            </div>

            {!isRegistering && (
              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/forgot-password");
                  }}
                  className="font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
                >
                  Forgot password?
                </button>
              </div>
            )}

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
              {loading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
            </button>
          </form>
        )}

        {verificationEmail && (
          <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/80 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
              Step 2 of 2
            </div>
            <div className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-navy-900">
              Verify your email
            </div>
            <p className="mt-1 text-sm text-ink-600">
              We emailed a 6-digit code to <span className="font-semibold text-navy-900">{verificationEmail}</span>. Enter it below to confirm your address.
            </p>
            <form onSubmit={handleVerifyPhone} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600"
                >
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="input-base"
                  placeholder="Enter the 6-digit code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verificationLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? "Verifying..." : "Verify Email"}
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={verificationLoading}
                className="w-full font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend verification code
              </button>
            </form>
          </div>
        )}

        {!verificationEmail && (
          <div className="mt-6 text-sm text-center text-ink-600">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
