export const formatTaskDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export const formatTaskAssignee = (user) => {
  if (!user?.name) return "Unassigned";
  return user.empId ? `${user.name} (${user.empId})` : user.name;
};

export const nextEmployeeTaskStatus = (status) => ({
  pending: "in-progress",
  "in-progress": "done",
})[status] || null;
