// src/components/Icons.jsx
import * as LucideIcons from "lucide-react";

export default function Icon({ name, size = 24, className = "" }) {
  if (!name) {
    console.warn("⚠️ No icon name provided to <Icon />");
    return null;
  }
  // Convert to PascalCase because Lucide uses PascalCase names (e.g. "User", "LayoutDashboard")
  const pascalName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const LucideIcon = LucideIcons[pascalName];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <LucideIcon size={size} className={className} />;
}
