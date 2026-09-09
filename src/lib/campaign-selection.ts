export function pickCampaign(params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  if ((next.get("picked") ?? next.get("campaign")) !== key) {
    for (const field of ["campaign", "product", "companions", "brandId", "productIndex", "run"])
      next.delete(field);
  }
  next.set("picked", key);
  return next;
}
