import { useAuth } from "../contexts/AuthContext";

function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account details.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Name" value={user?.name || "Not set"} />
          <ProfileField label="Email" value={user?.email || "Not set"} />
          <ProfileField label="Phone" value={user?.phone || "Not set"} />
          <ProfileField
            label="Phone Verified"
            value={user?.phone_verified_at ? "Yes" : "No"}
          />
          <ProfileField label="Role" value={user?.role || "Unknown"} />
          <ProfileField label="Status" value={user?.status || "Unknown"} />
          <ProfileField
            label="Member Since"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default Profile;
