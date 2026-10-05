/**
 * Shared constants used across explore, synthesize, and pipeline modules.
 */

/** Default daemon port for HTTP/WebSocket communication with browser extension */
export const DEFAULT_DAEMON_PORT = 19825;

/**
 * Chrome Web Store extension id for OpenCLI's own Browser Bridge extension
 * (https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk).
 * This is the only `chrome-extension://` origin the daemon's WebSocket
 * endpoint trusts by default, since `origin.startsWith('chrome-extension://')`
 * alone matches every installed extension, not specifically this one.
 */
export const OFFICIAL_EXTENSION_ID = 'ildkmabpimmkaediidaifkhjpohdnifk';

/**
 * Extension ids the daemon's WebSocket endpoint accepts, beyond the published
 * Chrome Web Store build. A sideloaded/dev unpacked extension's id is derived
 * from its install path and is not know-able ahead of time, so operators who
 * run one opt in explicitly via OPENCLI_ALLOWED_EXTENSION_IDS (comma-separated
 * 32-character extension ids).
 */
export function allowedExtensionIds(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const ids = new Set<string>([OFFICIAL_EXTENSION_ID]);
  const extra = env.OPENCLI_ALLOWED_EXTENSION_IDS;
  if (extra) {
    for (const id of extra.split(',')) {
      const trimmed = id.trim();
      if (trimmed) ids.add(trimmed);
    }
  }
  return ids;
}

/**
 * True when `origin` is a `chrome-extension://<id>` origin whose id is in
 * `allowedIds`. Any other shape, including a bare `chrome-extension://`
 * prefix with an unrecognized id, is rejected.
 */
export function isAllowedExtensionOrigin(
  origin: string | undefined,
  allowedIds: Set<string> = allowedExtensionIds(),
): boolean {
  if (!origin) return false;
  const prefix = 'chrome-extension://';
  if (!origin.startsWith(prefix)) return false;
  const id = origin.slice(prefix.length);
  return allowedIds.has(id);
}

export function unsupportedDaemonPortEnvMessage(value?: string): string {
  const suffix = value ? ` (received ${value})` : '';
  return `OPENCLI_DAEMON_PORT is no longer supported${suffix}. ` +
    `The OpenCLI Chrome extension can only connect to localhost:${DEFAULT_DAEMON_PORT}. ` +
    'Unset OPENCLI_DAEMON_PORT and rerun opencli.';
}

/**
 * True when OPENCLI_DAEMON_PORT carries no real configuration: unset, empty,
 * or equal to the default port. Launchers (notably OpenCLIApp) inject the
 * variable with the default value into every CLI they manage — rejecting that
 * harmless redundancy bricked all commands on fresh installs (#2068). Only a
 * NON-default value is a genuine misconfiguration worth failing on.
 */
export function isIgnorableDaemonPortEnv(value: string | undefined): boolean {
  if (value === undefined) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return Number(trimmed) === DEFAULT_DAEMON_PORT;
}
