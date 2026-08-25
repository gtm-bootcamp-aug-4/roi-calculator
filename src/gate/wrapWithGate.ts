import { escapeHtml, toScriptJson } from '../generator/escape';
import type { PasswordGate } from '../generator/types';

/**
 * Wraps a complete HTML result in a self-contained client-side password gate.
 * The gate is deliberately an obfuscation layer: the result HTML and digest
 * both ship to the browser, but the password itself never does.
 */
export function wrapWithGate(html: string, gate: PasswordGate, title: string): string {
  const embeddedHtml = toScriptJson(html);
  const gateData = toScriptJson(gate);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  background: #0d0d0d;
  color: #f2f2f2;
  font-family: Arial, Helvetica, sans-serif;
}
#gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
#gate-card {
  width: 100%;
  max-width: 380px;
  padding: 28px;
  text-align: center;
  background: #171717;
  border: 1px solid #3a3a3a;
  border-radius: 10px;
}
#gate-card h1 { margin: 0 0 8px; font-size: 20px; }
#gate-card p { color: #a3a3a3; font-size: 14px; line-height: 1.5; }
#gate-form { display: grid; gap: 12px; margin-top: 20px; }
#gate-password {
  width: 100%;
  padding: 11px 13px;
  color: #f2f2f2;
  background: #222;
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  font: inherit;
}
#gate-password:focus-visible, button:focus-visible {
  outline: 2px solid #d40000;
  outline-offset: 2px;
}
button {
  padding: 11px 18px;
  color: #fff;
  background: #d40000;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}
#gate-error { min-height: 18px; margin: 0; color: #f87171; }
</style>
</head>
<body>
<main id="gate">
  <section id="gate-card">
    <h1>${escapeHtml(title)}</h1>
    <p>This page is password protected. Enter the password you were given to continue.</p>
    <form id="gate-form">
      <input type="password" id="gate-password" autocomplete="current-password" placeholder="Password" />
      <p id="gate-error" role="alert"></p>
      <button type="submit">Unlock</button>
    </form>
  </section>
</main>
<script>
(function () {
  var GATE = ${gateData};
  var HTML = ${embeddedHtml};
  var form = document.getElementById('gate-form');
  var input = document.getElementById('gate-password');
  var error = document.getElementById('gate-error');

  function toHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
      return ('0' + byte.toString(16)).slice(-2);
    }).join('');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    error.textContent = '';
    if (!window.crypto || !window.crypto.subtle) {
      error.textContent = 'This browser cannot unlock the page. Try a modern browser over HTTPS.';
      return;
    }
    var encoded = new TextEncoder().encode(input.value + GATE.salt);
    window.crypto.subtle.digest('SHA-256', encoded).then(function (digest) {
      if (toHex(digest) === GATE.hash) {
        document.open();
        document.write(HTML);
        document.close();
      } else {
        error.textContent = 'Incorrect password.';
        input.value = '';
        input.focus();
      }
    }).catch(function () {
      error.textContent = 'Something went wrong. Please try again.';
    });
  });
  input.focus();
})();
</script>
</body>
</html>
`;
}
