import { describe, expect, it } from 'vitest';

import { wrapWithGate } from '../src/gate';
import { hashPassword } from '../src/generator/passwordGate';

describe('wrapWithGate', () => {
  const gate = { salt: 'a1b2c3d4e5f60708', hash: hashPassword('correct horse', 'a1b2c3d4e5f60708') };

  it('compares the browser digest to the hash produced by hashPassword', () => {
    const wrapped = wrapWithGate('<!doctype html><title>Result</title>', gate, 'Result');

    expect(gate.hash).toBe(hashPassword('correct horse', gate.salt));
    expect(wrapped).toContain("digest('SHA-256'");
    expect(wrapped).toContain('toHex(digest) === GATE.hash');
  });

  it('JSON-escapes embedded HTML so a closing script tag cannot escape', () => {
    const wrapped = wrapWithGate('<script>const value = "</script>";</script>', gate, 'Result');

    expect(wrapped).toContain('\\u003c/script\\u003e');
    expect(wrapped).not.toContain('const value = "</script>"');
  });

  it('contains no external asset references', () => {
    const wrapped = wrapWithGate('<!doctype html><p>Result</p>', gate, 'Result');

    expect(wrapped).not.toMatch(/<script[^>]+src=/i);
    expect(wrapped).not.toMatch(/<link[^>]+href=/i);
    expect(wrapped).not.toMatch(/@import|url\(/i);
  });
});
