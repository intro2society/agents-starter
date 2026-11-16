const PRIVATE_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home", ".lan", ".test", ".invalid", ".example"];

/** Accept only public HTTPS hostnames for server-side outbound requests. */
export function isPublicHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\\.$/, "");
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    !hostname.includes(".") ||
    hostname === "localhost" ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    /^\\d{1,3}(?:\\.\\d{1,3}){3}$/.test(hostname) ||
    hostname.includes(":") ||
    hostname.startsWith("[") ||
    hostname === "0.0.0.0"
  ) {
    return false;
  }

  return true;
}

export function assertPublicHttpsUrl(value: string): URL {
  if (!isPublicHttpsUrl(value)) {
    throw new Error("Only public HTTPS URLs without credentials or custom ports are allowed.");
  }
  return new URL(value);
}
