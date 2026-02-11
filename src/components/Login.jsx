import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

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
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-lime-50">
      <div className="absolute rounded-full pointer-events-none -top-28 -left-28 h-72 w-72 bg-amber-200/40 blur-3xl" />
      <div className="absolute rounded-full pointer-events-none -bottom-24 -right-24 h-80 w-80 bg-rose-200/40 blur-3xl" />
      <div className="w-full max-w-md p-8 border shadow-xl bg-white/80 backdrop-blur border-white/60 rounded-2xl">
        <div className="mb-8 text-center">
          <img
            src="/new-logo-website.png"
            alt="AI Vox Agency"
            className="h-20 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-amber-100 text-amber-800">
            AI Receptionist
          </div>
          <h1 className="mt-4 mb-2 text-2xl font-bold text-gray-900">
            {isRegistering ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-gray-600">
            {isRegistering
              ? "Sign up to manage your voice agents"
              : "Sign in to manage your voice agents"}
          </p>
        </div>

        {!verificationEmail && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            {isRegistering && (
              <div>
                <label
                  htmlFor="phone"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <PhoneInput
                  defaultCountry="us"
                  value={phone}
                  onChange={(nextPhone) => setPhone(nextPhone)}
                  className="w-full"
                  inputClassName="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  countrySelectorStyleProps={{
                    buttonClassName:
                      "h-full px-3 border border-gray-300 rounded-lg bg-white",
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
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  className="text-gray-900 underline hover:text-gray-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

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
              {loading ? "Processing..." : isRegistering ? "Sign Up" : "Sign In"}
            </button>
          </form>
        )}

        {verificationEmail && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="text-sm font-semibold text-amber-900">Step 2: Verify your phone</div>
            <p className="mt-1 text-sm text-amber-800">
              Enter the verification code below (not in the login form). We sent it to the phone on
              your signup.
            </p>
            <form onSubmit={handleVerifyPhone} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter the 6-digit code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verificationLoading}
                className="w-full px-4 py-2 font-medium text-white transition duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationLoading ? "Verifying..." : "Verify Phone"}
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={verificationLoading}
                className="w-full text-gray-900 underline hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend verification code
              </button>
            </form>
          </div>
        )}

        {!verificationEmail && (
          <div className="mt-6 text-sm text-center text-gray-600">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="text-gray-900 underline hover:text-gray-700"
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
