import { toScriptJson } from '../generator/escape';
import { DEFAULT_QUESTIONS, DEFAULT_STEPS } from './game';
import { validateIntake } from './validate';
import type { IntakeAppOptions, IntakeField, ProgressStep, TriviaQuestion } from './types';

const FIELDS: IntakeField[] = [
  'companyName',
  'websiteUrl',
  'password',
  'passwordConfirm',
  'role',
  'useCase',
];

/**
 * The single inline <script> for the entry experience: validation, local
 * password hashing, submit, the waiting game, and the two-minute fallback.
 *
 * `validateIntake` is serialized rather than reimplemented so the browser runs
 * the same rules the test suite checks.
 */
export function buildIntakeScript(options: Required<IntakeAppOptions>): string {
  const questions: TriviaQuestion[] = options.questions;
  const steps: ProgressStep[] = options.steps;

  return `
(function () {
  var validateIntake = ${validateIntake.toString()};
  var FIELDS = ${toScriptJson(FIELDS)};
  var QUESTIONS = ${toScriptJson(questions)};
  var STEPS = ${toScriptJson(steps)};
  var ENDPOINT = ${toScriptJson(options.endpoint)};
  var MAX_WAIT_MS = ${options.maxWaitSeconds * 1000};
  var DEMO = ${options.demo ? 'true' : 'false'};
  var DEMO_RESULT_URL = ${toScriptJson(options.demoResultUrl)};
  var DEMO_DURATION_MS = ${options.demoDurationSeconds * 1000};

  /* Step times are authored against the real wait, so a shortened demo run
     compresses them; otherwise a 24s demo would only ever reach step two. */
  var RUN_MS = DEMO ? DEMO_DURATION_MS : MAX_WAIT_MS;
  var TIME_SCALE = RUN_MS / MAX_WAIT_MS;

  var startedAt = 0;
  var timers = [];

  function el(id) { return document.getElementById(id); }

  function screen(name) {
    document.body.setAttribute('data-screen', name);
    window.scrollTo(0, 0);
  }

  function readValues() {
    var values = {};
    FIELDS.forEach(function (field) {
      var input = el('field-' + field);
      values[field] = input ? input.value : '';
    });
    return values;
  }

  function showErrors(errors) {
    var first = null;
    FIELDS.forEach(function (field) {
      var wrapper = el('wrap-' + field);
      var slot = el('error-' + field);
      var message = errors[field] || '';
      if (slot) slot.textContent = message;
      if (wrapper) wrapper.setAttribute('data-invalid', message ? 'true' : 'false');
      if (message && !first) first = el('field-' + field);
    });
    if (first) first.focus();
  }

  function toHex(buffer) {
    return Array.prototype.map
      .call(new Uint8Array(buffer), function (byte) {
        return ('0' + byte.toString(16)).slice(-2);
      })
      .join('');
  }

  /**
   * Hashes the chosen password in the browser with a fresh salt, so the
   * plaintext never leaves the page and never reaches a log or the CRM.
   */
  function buildGate(password) {
    var salt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    var encoded = new TextEncoder().encode(password + salt);
    return window.crypto.subtle.digest('SHA-256', encoded).then(function (digest) {
      return { salt: salt, hash: toHex(digest) };
    });
  }

  function normalizeUrl(value) {
    var trimmed = value.trim();
    var withScheme = /^https?:\\/\\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    try {
      return new URL(withScheme).origin;
    } catch (error) {
      return trimmed;
    }
  }

  function submission(values, gate) {
    return {
      companyName: values.companyName.trim(),
      websiteUrl: normalizeUrl(values.websiteUrl),
      role: values.role.trim() || undefined,
      useCase: values.useCase.trim() || undefined,
      passwordGate: gate,
      submittedAt: new Date().toISOString()
    };
  }

  /* ---- waiting screen ---- */

  function startsAt(step) { return step.startsAt * TIME_SCALE; }

  function renderSteps(elapsed) {
    STEPS.forEach(function (step, index) {
      var item = el('step-' + index);
      var block = el('wait-preview-block-' + index);
      var next = STEPS[index + 1];
      var state = 'pending';
      if (elapsed >= startsAt(step)) state = next && elapsed >= startsAt(next) ? 'done' : 'active';
      if (item) item.setAttribute('data-state', state);
      /* The wireframe fills in as the matching step lands, so the wait shows
         a page being assembled rather than a spinner. */
      if (block) block.setAttribute('data-built', state === 'pending' ? 'false' : 'true');
      if (index === 0) {
        var hero = el('wait-preview-block-hero');
        if (hero) hero.setAttribute('data-built', state === 'pending' ? 'false' : 'true');
      }
    });
  }

  var RING_CIRCUMFERENCE = 339.292;

  function tick() {
    var elapsed = (Date.now() - startedAt) / 1000;
    var pct = Math.min(100, (elapsed * 1000 / RUN_MS) * 100);
    el('progress-bar').style.width = pct + '%';
    el('progress-pct').textContent = Math.round(pct) + '%';
    el('progress-ring').setAttribute(
      'stroke-dashoffset',
      String(RING_CIRCUMFERENCE * (1 - pct / 100))
    );
    el('elapsed').textContent = Math.floor(elapsed) + 's elapsed';
    renderSteps(elapsed);
  }

  /* ---- trivia game ---- */

  var gameIndex = 0;
  var gameScore = 0;

  function renderQuestion() {
    var question = QUESTIONS[gameIndex % QUESTIONS.length];
    el('game-question').textContent = question.question;
    el('game-score').textContent =
      gameScore + ' / ' + gameIndex + ' correct';
    el('game-explanation').textContent = '';

    var options = el('game-options');
    options.textContent = '';
    question.options.forEach(function (label, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      var letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = 'ABCDEF'.charAt(index);
      button.appendChild(letter);
      button.appendChild(document.createTextNode(label));
      button.addEventListener('click', function () {
        answer(question, index, options);
      });
      options.appendChild(button);
    });
  }

  function answer(question, chosen, options) {
    var buttons = options.querySelectorAll('button');
    var correct = chosen === question.answerIndex;
    if (correct) gameScore += 1;
    gameIndex += 1;

    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].disabled = true;
      if (i === question.answerIndex) buttons[i].setAttribute('data-state', 'correct');
      else if (i === chosen) buttons[i].setAttribute('data-state', 'wrong');
    }

    el('game-explanation').textContent =
      (correct ? 'Correct. ' : 'Not quite. ') + question.explanation;
    el('game-score').textContent = gameScore + ' / ' + gameIndex + ' correct';

    timers.push(setTimeout(renderQuestion, 2600));
  }

  /* ---- flow ---- */

  function stopTimers() {
    timers.forEach(clearTimeout);
    timers.forEach(clearInterval);
    timers = [];
  }

  function ready(url) {
    stopTimers();
    el('progress-bar').style.width = '100%';
    el('ready-link').textContent = url;
    el('ready-open').setAttribute('href', url);
    el('ready-score').textContent =
      gameIndex > 0 ? 'You got ' + gameScore + ' of ' + gameIndex + ' right while you waited.' : '';
    screen('ready');
  }

  function fallback() {
    stopTimers();
    screen('fallback');
  }

  function startWaiting(payload) {
    startedAt = Date.now();
    screen('waiting');
    el('waiting-company').textContent = payload.companyName;
    var labels = document.querySelectorAll('[data-preview-company]');
    for (var i = 0; i < labels.length; i += 1) labels[i].textContent = payload.companyName;
    var host = payload.websiteUrl.replace(/^https?:\\/\\//i, '').replace(/\\/.*$/, '');
    var locks = document.querySelectorAll('.preview-chrome .lock');
    for (var j = 0; j < locks.length; j += 1) {
      locks[j].textContent = '\u{1F512} ' + host + '/devin \u00B7 password required';
    }
    renderQuestion();
    tick();
    timers.push(setInterval(tick, 500));
    timers.push(setTimeout(fallback, MAX_WAIT_MS));

    if (DEMO) {
      timers.push(setTimeout(function () {
        ready(DEMO_RESULT_URL || 'https://devin.ai/');
      }, DEMO_DURATION_MS));
      return;
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Generation failed');
        return response.json();
      })
      .then(function (body) {
        if (body && body.url) ready(body.url);
        else fallback();
      })
      .catch(fallback);
  }

  function init() {
    var form = el('intake-form');
    var submit = el('intake-submit');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var values = readValues();
      var errors = validateIntake(values);
      showErrors(errors);
      if (Object.keys(errors).length > 0) return;

      if (!window.crypto || !window.crypto.subtle) {
        showErrors({ password: 'This browser cannot secure your page. Try a modern browser over HTTPS.' });
        return;
      }

      submit.disabled = true;
      buildGate(values.password)
        .then(function (gate) {
          var payload = submission(values, gate);
          /* Plaintext is dropped as soon as the gate exists. */
          el('field-password').value = '';
          el('field-passwordConfirm').value = '';
          startWaiting(payload);
        })
        .catch(function () {
          submit.disabled = false;
          showErrors({ password: 'Something went wrong. Please try again.' });
        });
    });

    FIELDS.forEach(function (field) {
      var input = el('field-' + field);
      if (!input) return;
      input.addEventListener('input', function () {
        var wrapper = el('wrap-' + field);
        if (wrapper && wrapper.getAttribute('data-invalid') === 'true') {
          var errors = validateIntake(readValues());
          if (!errors[field]) {
            wrapper.setAttribute('data-invalid', 'false');
            el('error-' + field).textContent = '';
          }
        }
      });
    });

    el('fallback-restart').addEventListener('click', function () {
      stopTimers();
      submit.disabled = false;
      screen('form');
    });

    screen('form');
  }

  init();
})();
`;
}

export const DEFAULT_APP_OPTIONS = {
  demo: false,
  demoResultUrl: '',
  demoDurationSeconds: 24,
  maxWaitSeconds: 120,
  questions: DEFAULT_QUESTIONS,
  steps: DEFAULT_STEPS,
};
