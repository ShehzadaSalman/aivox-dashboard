import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const ROLE_STYLES = {
  SUPERADMIN: "bg-amber-100 text-amber-800",
  ADMIN: "bg-navy-100 text-navy-800",
  USER: "bg-navy-50 text-ink-600",
};
const STATUS_STYLES = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-gold-500/15 text-gold-600",
  REJECTED: "bg-accent-600/10 text-accent-700",
};

function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message, variant = "success") => setToast({ message, variant });

  const nameDirty = (name || "").trim() !== (user?.name || "").trim();

  const handleSaveName = async () => {
    setSavingName(true);
    const result = await updateProfile({ name: name.trim() });
    setSavingName(false);
    if (result.success) {
      showToast("Profile updated.");
    } else {
      showToast(result.error || "Couldn't update profile.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${
              toast.variant === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-semibold text-navy-900 mb-2">Profile</h1>
        <p className="text-ink-600">Manage your account details and password.</p>
      </div>

      {/* Account */}
      <div className="card-surface rounded-lg p-6">
        <h2 className="text-lg font-semibold text-navy-900">Account</h2>

        <div className="mt-4 max-w-md">
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={!nameDirty || savingName}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t border-navy-100 pt-6">
          <ReadOnly label="Email" value={user?.email || "—"} />
          <ReadOnly
            label="Phone"
            value={user?.phone || "—"}
            badge={
              user?.phone
                ? user?.phone_verified_at
                  ? { text: "Verified", cls: "bg-emerald-100 text-emerald-800" }
                  : { text: "Unverified", cls: "bg-gold-500/15 text-gold-600" }
                : null
            }
          />
          <ReadOnly
            label="Role"
            badge={{ text: user?.role || "—", cls: ROLE_STYLES[user?.role] || "bg-navy-50 text-ink-600" }}
          />
          <ReadOnly
            label="Status"
            badge={{ text: user?.status || "—", cls: STATUS_STYLES[user?.status] || "bg-navy-50 text-ink-600" }}
          />
          <ReadOnly
            label="Member since"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
          />
        </div>
        <p className="mt-4 text-xs text-ink-400">
          To change your email or phone number, contact support.
        </p>
      </div>

      {/* Security */}
      <PasswordSection showToast={showToast} />
    </div>
  );
}

function PasswordSection({ showToast }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    const result = await changePassword(current, next);
    setSaving(false);
    if (result.success) {
      reset();
      showToast("Password updated.");
    } else {
      setError(result.error || "Couldn't update password.");
    }
  };

  return (
    <div className="card-surface rounded-lg p-6">
      <h2 className="text-lg font-semibold text-navy-900">Security</h2>
      <p className="text-sm text-ink-500 mt-1">Change your password.</p>
      <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
        <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" hint="At least 8 characters." />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && (
          <div className="rounded-lg bg-accent-600/10 border border-accent-600/20 px-4 py-2 text-sm text-accent-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={saving || !current || !next || !confirm}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

function ReadOnly({ label, value, badge }) {
  return (
    <div>
      <div className="text-sm text-ink-500">{label}</div>
      {badge ? (
        <span
          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}
        >
          {badge.text}
        </span>
      ) : (
        <div className="text-base font-semibold text-navy-900">{value}</div>
      )}
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
      />
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export default Profile;
