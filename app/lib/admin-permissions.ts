export const adminRoles = ["owner", "admin", "manager", "kitchen", "viewer"] as const;
export type AdminRole = typeof adminRoles[number];

export type AdminPermission =
  | "dashboard:read"
  | "orders:read"
  | "orders:transition"
  | "orders:notes"
  | "kitchen:read"
  | "reports:read"
  | "settings:read";

const permissionsByRole: Record<AdminRole, readonly AdminPermission[]> = {
  owner: ["dashboard:read", "orders:read", "orders:transition", "orders:notes", "kitchen:read", "reports:read", "settings:read"],
  admin: ["dashboard:read", "orders:read", "orders:transition", "orders:notes", "kitchen:read", "reports:read", "settings:read"],
  manager: ["dashboard:read", "orders:read", "orders:transition", "orders:notes", "kitchen:read", "reports:read"],
  kitchen: ["dashboard:read", "orders:read", "orders:transition", "kitchen:read"],
  viewer: ["dashboard:read", "orders:read"],
};

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  kitchen: "Kitchen staff",
  viewer: "Read only",
};

export function isAdminRole(value: string): value is AdminRole {
  return (adminRoles as readonly string[]).includes(value);
}

export function adminCan(role: AdminRole, permission: AdminPermission) {
  return permissionsByRole[role].includes(permission);
}
