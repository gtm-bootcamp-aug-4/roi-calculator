import { computeRoi } from './roi';
import { toScriptJson } from './escape';
import type { PasswordGate, RoiInputs } from './types';

const ROI_FIELDS: Array<keyof RoiInputs> = [
  'engineers',
  'avgSalary',
  'toilPercent',
  'automationPercent',
  'devinAnnualCost',
];

/**
 * Builds the single inline <script> body for a generated page: the client-side
 * password gate plus the interactive ROI calculator. No network access, no
 * external dependencies.
 */
export function buildClientScript(roiDefaults: RoiInputs, gate?: PasswordGate): string {
  return `
(function () {
  var computeRoi = ${computeRoi.toString()};
  var ROI_FIELDS = ${toScriptJson(ROI_FIELDS)};
  var ROI_DEFAULTS = ${toScriptJson(roiDefaults)};
  var GATE = ${gate ? toScriptJson(gate) : 'null'};

  function money(value) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  function readInputs() {
    var values = {};
    ROI_FIELDS.forEach(function (field) {
      var el = document.getElementById('roi-' + field);
      var parsed = el ? parseFloat(el.value) : NaN;
      values[field] = isNaN(parsed) ? ROI_DEFAULTS[field] : parsed;
    });
    return values;
  }

  function render() {
    var result = computeRoi(readInputs());
    var payback =
      result.paybackMonths === null
        ? 'n/a'
        : result.paybackMonths.toFixed(1) + ' months';

    document.getElementById('roi-net').textContent = money(result.netAnnualSavings);
    document.getElementById('roi-toil-cost').textContent = money(result.toilCost);
    document.getElementById('roi-recovered').textContent = money(result.recoveredCost);
    document.getElementById('roi-multiple').textContent = result.roiMultiple.toFixed(1) + 'x';
    document.getElementById('roi-capacity').textContent =
      result.engineerYearsRecovered.toFixed(1) + ' engineer-years';
    document.getElementById('roi-payback').textContent = payback;
  }

  function initRoi() {
    ROI_FIELDS.forEach(function (field) {
      var el = document.getElementById('roi-' + field);
      if (el) {
        el.addEventListener('input', render);
      }
    });
    render();
  }

  function toHex(buffer) {
    return Array.prototype.map
      .call(new Uint8Array(buffer), function (byte) {
        return ('0' + byte.toString(16)).slice(-2);
      })
      .join('');
  }

  function unlock() {
    var gate = document.getElementById('gate');
    if (gate && gate.parentNode) {
      gate.parentNode.removeChild(gate);
    }
    document.body.setAttribute('data-locked', 'false');
    initRoi();
  }

  function initGate() {
    var form = document.getElementById('gate-form');
    var input = document.getElementById('gate-password');
    var error = document.getElementById('gate-error');

    if (!window.crypto || !window.crypto.subtle) {
      error.textContent = 'This browser cannot unlock the page. Try a modern browser over HTTPS.';
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.textContent = '';
      var encoded = new TextEncoder().encode(input.value + GATE.salt);
      window.crypto.subtle
        .digest('SHA-256', encoded)
        .then(function (digest) {
          if (toHex(digest) === GATE.hash) {
            unlock();
          } else {
            error.textContent = 'Incorrect password.';
            input.value = '';
            input.focus();
          }
        })
        .catch(function () {
          error.textContent = 'Something went wrong. Please try again.';
        });
    });

    input.focus();
  }

  if (GATE) {
    initGate();
  } else {
    initRoi();
  }
})();
`;
}
