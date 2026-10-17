import { useAuth } from "../auth/useAuth";
import Header from "../../shared/components/Header";

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
};

const Profile = () => {
  const { user, status, error, refreshSession } = useAuth();

  if (status === "loading") {
    return <p role="status" className="p-6 text-text">Loading profile...</p>;
  }

  if (status === "error") {
    return (
      <div className="p-6 text-text">
        <p role="alert">{error || "Unable to load your profile."}</p>
        <button type="button" onClick={refreshSession} className="mt-3 text-cta hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role === "admin" ? "Admin" : user.role === "employee" ? "Employee" : null;
  const accountStatus = user.status === "active" ? "Active" : user.status === "inactive" ? "Inactive" : null;
  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["Phone", user.phone],
    ["Role", role],
    ["Employee identifier", user.empId],
    ["Designation", user.designation],
    ["Account created", formatDate(user.createdAt)],
    ["Account status", accountStatus],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

  return (
    <div className="flex flex-col">
      <Header title="Profile" />
      <div className="m-6 max-w-xl rounded-md bg-card-bg p-6 shadow-md">
        <dl className="space-y-4">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-3 gap-y-1">
              <dt className="text-secondary-text">{label}</dt>
              <dd className="break-words text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default Profile;
