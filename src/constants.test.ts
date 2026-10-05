import { describe, expect, it } from 'vitest';

import { OFFICIAL_EXTENSION_ID, allowedExtensionIds, isAllowedExtensionOrigin } from './constants.js';

describe('isAllowedExtensionOrigin', () => {
  it('allows the published Chrome Web Store extension id', () => {
    expect(isAllowedExtensionOrigin(`chrome-extension://${OFFICIAL_EXTENSION_ID}`)).toBe(true);
  });

  it('rejects a different, syntactically valid chrome-extension:// origin', () => {
    // Regression for the origin-impersonation bug: any OTHER installed
    // extension previously passed this check identically to the real one.
    expect(isAllowedExtensionOrigin('chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false);
  });

  it('rejects a missing origin', () => {
    // Regression: the daemon used to accept WebSocket upgrades with no
    // Origin header at all.
    expect(isAllowedExtensionOrigin(undefined)).toBe(false);
  });

  it('rejects a non-extension origin', () => {
    expect(isAllowedExtensionOrigin('https://example.com')).toBe(false);
  });

  it('allows an id explicitly listed in OPENCLI_ALLOWED_EXTENSION_IDS', () => {
    const allowed = allowedExtensionIds({ OPENCLI_ALLOWED_EXTENSION_IDS: 'sideloaded-dev-id' } as NodeJS.ProcessEnv);
    expect(isAllowedExtensionOrigin('chrome-extension://sideloaded-dev-id', allowed)).toBe(true);
    expect(isAllowedExtensionOrigin(`chrome-extension://${OFFICIAL_EXTENSION_ID}`, allowed)).toBe(true);
    expect(isAllowedExtensionOrigin('chrome-extension://still-not-allowed', allowed)).toBe(false);
  });
});

describe('allowedExtensionIds', () => {
  it('always includes the official extension id', () => {
    expect(allowedExtensionIds({} as NodeJS.ProcessEnv).has(OFFICIAL_EXTENSION_ID)).toBe(true);
  });

  it('ignores empty/whitespace-only entries in the env override', () => {
    const ids = allowedExtensionIds({ OPENCLI_ALLOWED_EXTENSION_IDS: ' , ,abc,' } as NodeJS.ProcessEnv);
    expect(ids).toEqual(new Set([OFFICIAL_EXTENSION_ID, 'abc']));
  });
});
