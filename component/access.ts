import type { AccessRule } from "./types";

export function canAccess(params: {
  ownerId: string;
  viewerId?: string | null;
  fileRule?: AccessRule;
  folderRule?: AccessRule;
}): boolean {
  const { ownerId, viewerId } = params;
  if (viewerId && viewerId === ownerId) return true;

  const rule = params.fileRule ?? params.folderRule;
  if (!rule) return false;

  if (viewerId && rule.denyUserIds?.includes(viewerId)) return false;

  if (rule.visibility === "public") return true;

  if (!viewerId) return false;

  if (rule.visibility === "private") return false;

  if (rule.visibility === "restricted") {
    return Boolean(rule.allowUserIds?.includes(viewerId));
  }

  return false;
}

export function sanitizeAccessRule(rule?: AccessRule): AccessRule | undefined {
  if (!rule) return undefined;
  const unique = (list?: string[]) =>
    list ? Array.from(new Set(list.filter((value) => value.length > 0))) : undefined;
  return {
    visibility: rule.visibility,
    allowUserIds: unique(rule.allowUserIds),
    denyUserIds: unique(rule.denyUserIds),
  };
}
