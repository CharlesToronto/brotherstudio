export function normalizeProjectViewerEmail(value: string) {
  return value.trim().toLowerCase();
}

export function maskProjectViewerEmail(value: string) {
  const normalizedEmail = normalizeProjectViewerEmail(value);
  const [localPart = "user"] = normalizedEmail.split("@");
  const sanitizedLocalPart = localPart.replace(/[^a-z0-9]/gi, "") || "user";
  const visiblePart = sanitizedLocalPart.slice(0, 4) || "user";
  const hiddenLength = Math.max(sanitizedLocalPart.length - visiblePart.length, 1);

  return `${visiblePart}${"*".repeat(hiddenLength)}`;
}

export function getProjectViewerStorageKey(projectId: string) {
  return `bs_project_access_email:${projectId}`;
}

export function getProjectViewerCookieName(projectId: string) {
  return `bs_myproject_viewer_${projectId}`;
}

export function normalizeProjectViewerRole(value: string | null | undefined) {
  return value === "team" ? "team" : "visitor";
}

export function getProjectViewerRoleStorageKey(projectId: string) {
  return `bs_project_access_role:${projectId}`;
}

export function getProjectViewerRoleCookieName(projectId: string) {
  return `bs_myproject_role_${projectId}`;
}

export function getProjectViewerEntryStorageKey(projectId: string) {
  return `bs_project_access_entry:${projectId}`;
}
