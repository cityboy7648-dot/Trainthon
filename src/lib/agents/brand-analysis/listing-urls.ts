const LISTING_PATH =
  /(?:^|\/)(menu|menus|products?|shop|store|pricing|plans?|services?|catalog|category|정보|메뉴|상품|제품|서비스|요금)(?:\/|$)/i;
const EXCLUDED_PATH =
  /review|photo|login|logout|policy|privacy|mail|blog|feed|cart|checkout|account/i;

export function pageKey(value: string): string | null {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

export function samePage(left: string, right: string): boolean {
  const leftKey = pageKey(left);
  const rightKey = pageKey(right);
  return leftKey !== null && leftKey === rightKey;
}

function resourceIds(value: string): string[] {
  try {
    return new URL(value).pathname.split("/").filter((part) => /^\d{5,}$/.test(part));
  } catch {
    return [];
  }
}

function isSameEntity(href: string, sourceUrl: string): boolean {
  const ids = resourceIds(sourceUrl);

  if (ids.length === 0) {
    try {
      return new URL(href).origin === new URL(sourceUrl).origin;
    } catch {
      return false;
    }
  }

  return ids.every((id) => href.includes(id));
}

export function listingUrlsFromLinks(links: string[], sourceUrl: string, limit: number): string[] {
  const urls = new Map<string, string>();

  for (const href of links) {
    const key = pageKey(href);

    if (!key || urls.has(key) || samePage(key, sourceUrl)) {
      continue;
    }

    try {
      const url = new URL(key);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        continue;
      }
      if (EXCLUDED_PATH.test(url.pathname)) {
        continue;
      }
      if (!LISTING_PATH.test(url.pathname) || !isSameEntity(key, sourceUrl)) {
        continue;
      }
      urls.set(key, key);
    } catch {
      continue;
    }

    if (urls.size >= limit) {
      break;
    }
  }

  return [...urls.values()];
}
