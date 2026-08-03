// Used to build a unique, URL-safe Company.slug from its (Arabic or
// English) display name plus a per-user suffix.
export function slugify(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "company"}-${suffix}`;
}
