export function selectPrimaryProduct(params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  next.set("product", key);
  const companions = (next.get("companions") ?? "")
    .split(",")
    .filter((item) => item && item !== key);
  if (companions.length) next.set("companions", companions.join(","));
  else next.delete("companions");
  next.delete("run");
  return next;
}

export function toggleCompanionProduct(params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  if (key === next.get("product")) return next;
  const selected = [...new Set((next.get("companions") ?? "").split(",").filter(Boolean))];
  const companions = selected.includes(key)
    ? selected.filter((item) => item !== key)
    : selected.length < 10
      ? [...selected, key]
      : selected;
  if (companions.length) next.set("companions", companions.join(","));
  else next.delete("companions");
  next.delete("run");
  return next;
}
