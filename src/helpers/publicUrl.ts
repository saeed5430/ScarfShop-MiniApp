/**
 * @returns A complete public URL prefixed with the public static assets base
 * path.
 * @param path - path to prepend prefix to
 */
export function publicUrl(path: string): string {
  // The baseUrl must be ending with the slash. The reason is if the baseUrl will
  // equal to "/my-base", then passing the path equal to "tonconnect-manifest.json" will not
  // give us the expected result, it will actually be "/tonconnect-manifest.json", but the expected
  // one is "/my-base/tonconnect-manifest.json". This is due to the URL constructor.
  let baseUrl = import.meta.env.BASE_URL;
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  let isBaseAbsolute = false;
  try {
    new URL(baseUrl);
    isBaseAbsolute = true;
  } catch { /* empty */
  }

  const absoluteBase = isBaseAbsolute
    ? baseUrl
    : new URL(baseUrl, window.location.href).toString();

  return new URL(
    // The path is not allowed to be starting with the slash as long as it will break the
    // base URL. For instance, having the "/my-base/" base URL and path
    // equal to "/tonconnect-manifest.json", we will not get the expected result like
    // "/my-base/tonconnect-manifest.json", but "/tonconnect-manifest.json".
    path.replace(/^\/+/, ''),
    absoluteBase,
  ).toString();
}

/**
 * Resolves an asset path from the database (e.g. "/products/hijab/x.jpg")
 * into an absolute URL against the current document location, so relative
 * paths keep working both at the site root and under a GitHub Pages subpath.
 * @returns The resolved URL, or the input when it is empty or non-resolvable.
 */
export function resolveAssetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('blob:')) return path;
  try {
    return new URL(path.replace(/^\/+/, ''), window.location.href).toString();
  } catch {
    return path;
  }
}