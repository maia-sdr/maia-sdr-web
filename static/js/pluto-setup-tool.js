(function () {
  'use strict';

  const BAUD_RATE = 115200;
  const CONTAINS_UIO = v => typeof v === 'string' && v.includes('uio_pdrv_genirq.of_id=uio_pdrv_genirq');

  const BOOTARGS = {
    ramboot_verbose:
      'adi_hwref;echo Copying Linux from DFU to RAM... && run dfu_ram;if run adi_loadvals; then echo Loaded AD936x refclk frequency and model into devicetree; fi; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw earlyprintk clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config}',

    qspiboot_verbose:
      'adi_hwref;echo Copying Linux from QSPI flash to RAM... && run read_sf && if run adi_loadvals; then echo Loaded AD936x refclk frequency and model into devicetree; fi; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw earlyprintk clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config} || echo BOOT failed entering DFU mode ... && run dfu_sf',

    qspiboot:
      'set stdout nulldev;adi_hwref;test -n $PlutoRevA || gpio input 14 && set stdout serial@e0001000 && sf probe && sf protect lock 0 100000 && run dfu_sf;  set stdout serial@e0001000;itest *f8000258 == 480003 && run clear_reset_cause && run dfu_sf; itest *f8000258 == 480007 && run clear_reset_cause && run ramboot_verbose; itest *f8000258 == 480006 && run clear_reset_cause && run qspiboot_verbose; itest *f8000258 == 480002 && run clear_reset_cause && exit; echo Booting silently && set stdout nulldev; run read_sf && run adi_loadvals; envversion;setenv bootargs console=ttyPS0,115200 maxcpus=${maxcpus} rootfstype=ramfs root=/dev/ram0 rw quiet loglevel=4 clk_ignore_unused uio_pdrv_genirq.of_id=uio_pdrv_genirq uboot="${uboot-version}" && bootm ${fit_load_address}#${fit_config} || set stdout serial@e0001000;echo BOOT failed entering DFU mode ... && sf protect lock 0 100000 && run dfu_sf',
  };


  const CHECKS = [
    { key: 'ramboot_verbose', requirement: 'must contain uio_pdrv_genirq.of_id=uio_pdrv_genirq', check: CONTAINS_UIO, recommended: BOOTARGS.ramboot_verbose },
    { key: 'qspiboot_verbose', requirement: 'must contain uio_pdrv_genirq.of_id=uio_pdrv_genirq', check: CONTAINS_UIO, recommended: BOOTARGS.qspiboot_verbose },
    { key: 'qspiboot', requirement: 'must contain uio_pdrv_genirq.of_id=uio_pdrv_genirq', check: CONTAINS_UIO, recommended: BOOTARGS.qspiboot },
    { key: 'attr_name', requirement: 'must equal "compatible"', check: v => v === 'compatible', recommended: 'compatible' },
    { key: 'attr_val', requirement: 'must equal "ad9364"', check: v => v === 'ad9364', recommended: 'ad9364' },
    { key: 'mode', requirement: 'must equal "1r1t"', check: v => v === '1r1t', recommended: '1r1t' },
  ];

  // Maia-sdr-specific overrides that can be unset to fall back to u-boot
  // defaults. attr_name/attr_val/mode are ADI-native and stay.
  const OVERRIDE_KEYS = CHECKS.filter(c => c.check === CONTAINS_UIO).map(c => c.key);

  const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  function isValidIpv4(s) {
    return IPV4_RE.test(s);
  }

  // A valid dotted-quad netmask is a contiguous run of 1s followed by 0s —
  // 10.5.3.1 is a syntactically valid IPv4 but not a valid mask. Convert to a
  // 32-bit int; the inverse must be 2^n − 1 for some n, i.e. `inv & (inv+1)`
  // is zero.
  function isValidNetmask(s) {
    if (!IPV4_RE.test(s)) return false;
    let mask = 0;
    for (const n of s.split('.')) mask = (mask << 8) | Number(n);
    mask >>>= 0;
    const inv = (~mask) >>> 0;
    return (((inv & (inv + 1)) >>> 0) === 0);
  }

  const NETWORKING_FIELDS = [
    { key: 'ipaddr',      label: 'Pluto IP (ipaddr)',               placeholder: '192.168.2.1',   validate: isValidIpv4,    hint: 'dotted-quad IPv4 (e.g. 192.168.2.1)' },
    { key: 'netmask',     label: 'Netmask',                         placeholder: '255.255.255.0', validate: isValidNetmask, hint: 'contiguous-bits mask (e.g. 255.255.255.0, 255.255.254.0)' },
    { key: 'ipaddr_host', label: 'Suggested host IP (ipaddr_host)', placeholder: '192.168.2.10',  validate: isValidIpv4,    hint: 'dotted-quad IPv4 (e.g. 192.168.2.10)' },
  ];

  // USB ethernet compatibility mode, per the ADI Pluto customization wiki.
  // Blank/unset is treated as RNDIS (the firmware default).
  const USB_MODES = [
    { value: 'rndis', label: 'RNDIS',   support: { Windows: true,  Linux: true, macOS: false, iPadOS: false, Android: false } },
    { value: 'ncm',   label: 'CDC-NCM', support: { Windows: false, Linux: true, macOS: true,  iPadOS: true,  Android: false } },
    { value: 'ecm',   label: 'CDC-ECM', support: { Windows: false, Linux: true, macOS: false, iPadOS: false, Android: true  } },
  ];
  const USB_MODE_OSES = ['Windows', 'Linux', 'macOS', 'iPadOS', 'Android'];

  // --- Serial connection ---

  class PlutoSerial {
    constructor({ onLog, onDisconnect }) {
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.buffer = '';
      this.onLog = onLog;
      this.onDisconnect = onDisconnect;
      this._intentionalClose = false;
      // Promise chain that serializes login/exec so concurrent callers can't
      // step on each other's shared buffer.
      this._queue = Promise.resolve();
    }

    async connect() {
      this._intentionalClose = false;
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: BAUD_RATE, dataBits: 8, stopBits: 1, parity: 'none' });
      const decoder = new TextDecoderStream();
      this._readableClosed = this.port.readable.pipeTo(decoder.writable).catch(() => {});
      this.reader = decoder.readable.getReader();
      const encoder = new TextEncoderStream();
      this._writableClosed = encoder.readable.pipeTo(this.port.writable).catch(() => {});
      this.writer = encoder.writable.getWriter();
      this._pump();
    }

    async _pump() {
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          this.buffer += value;
          this.onLog(value, 'rx');
        }
      } catch (_) {}
      // Pump exited: either user called disconnect(), or the port closed
      // unexpectedly (cable yank, device reboot, OS driver). Surface the
      // latter so the UI can reset state.
      const wasIntentional = this._intentionalClose;
      this.port = null;
      this.reader = null;
      this.writer = null;
      if (!wasIntentional) this.onDisconnect?.();
    }

    async disconnect() {
      this._intentionalClose = true;
      try { await this.reader?.cancel(); } catch (_) {}
      try { await this.writer?.close(); } catch (_) {}
      try { await this._readableClosed; } catch (_) {}
      try { await this._writableClosed; } catch (_) {}
      try { await this.port?.close(); } catch (_) {}
      this.port = null;
      this.reader = null;
      this.writer = null;
    }

    async _send(s) {
      await this.writer.write(s);
      this.onLog(s, 'tx');
    }

    async _waitFor(predicate, timeoutMs) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const match = predicate(this.buffer);
        if (match) return match;
        await sleep(30);
      }
      throw new Error('Timed out waiting on serial response');
    }

    login(user, pass) {
      return this._enqueue(() => this._doLogin(user, pass));
    }

    async _doLogin(user, pass) {
      this.buffer = '';
      await this._send('\r\n');
      await sleep(400);
      if (/login:\s*$/i.test(this.buffer)) {
        await this._send(user + '\r\n');
        await this._waitFor(b => /password:\s*$/i.test(b), 5000);
        this.buffer = '';
        await this._send(pass + '\r\n');
        await this._waitFor(b => /[#$]\s*$/.test(b), 10000);
      } else if (/[#$]\s*$/.test(this.buffer)) {
        // already at a shell prompt — nothing to do
      } else {
        throw new Error(
          'No login or shell prompt detected. Make sure the Pluto has finished booting, then try again.'
        );
      }
      this.buffer = '';
    }

    exec(cmd, timeoutMs = 5000) {
      return this._enqueue(() => this._doExec(cmd, timeoutMs));
    }

    async _doExec(cmd, timeoutMs) {
      if (!this.writer) throw new Error('Not connected');
      const sentinel = 'MAIA_DONE_' + Math.random().toString(36).slice(2, 10);
      // `2>&1` merges stderr so that tool error messages (e.g. `fw_setenv:
      // Can't set keys...`) surface to JS. `$?` is expanded before `echo`
      // runs, so it captures the exit code of `cmd`, not the merge.
      const fullCmd = `{ ${cmd}; } 2>&1; echo ${sentinel}$?`;
      this.buffer = '';
      await this._send(fullCmd + '\r\n');
      const sentinelRe = new RegExp(sentinel + '(\\d+)');
      const match = await this._waitFor(b => b.match(sentinelRe), timeoutMs);
      let out = this.buffer.slice(0, match.index);
      const echoIdx = out.indexOf(fullCmd);
      if (echoIdx !== -1) out = out.slice(echoIdx + fullCmd.length);
      return {
        stdout: out.replace(/^\r?\n/, '').replace(/\r?\n$/, ''),
        exitCode: parseInt(match[1], 10),
      };
    }

    // Serialize async work against the single shared read buffer. Each caller
    // awaits the tail of the queue, runs its task, and becomes the new tail.
    _enqueue(task) {
      const next = this._queue.then(task, task);
      this._queue = next.catch(() => {});
      return next;
    }
  }

  // --- u-boot env helpers ---

  // Read multiple u-boot env vars in one fw_printenv call. fw_printenv prints
  // `key=value` for each match and writes "## Error: ..." on stderr (which we
  // don't capture) for each missing one, so unmatched keys surface as null.
  async function readEnv(serial, keys) {
    const result = Object.fromEntries(keys.map(k => [k, null]));
    const { stdout } = await serial.exec(`fw_printenv ${keys.join(' ')}`, 8000);
    for (const line of stdout.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const key = line.slice(0, eq);
      if (key in result) result[key] = line.slice(eq + 1);
    }
    return result;
  }

  // 15s covers UBIFS flash writes on slower Plutos. fw_setenv is almost always
  // sub-second, but we've seen rare multi-second stalls when the env partition
  // is under write pressure from other processes.
  async function setEnv(serial, key, value) {
    const cmd = value === null || value === undefined
      ? `fw_setenv ${key}`
      : `fw_setenv ${key} ${shellSingleQuote(value)}`;
    const { exitCode, stdout } = await serial.exec(cmd, 15000);
    if (exitCode !== 0) throw new Error(`fw_setenv ${key} failed: ${stdout || 'no output'}`);
  }

  function shellSingleQuote(s) {
    return "'" + String(s).replace(/'/g, "'\\''") + "'";
  }

  // --- File helpers ---

  async function readFile(serial, path) {
    const { stdout, exitCode } = await serial.exec(`cat ${shellSingleQuote(path)}`, 10000);
    if (exitCode !== 0) throw new Error(`Failed to read ${path} (exit ${exitCode})`);
    return stdout;
  }

  // Upload a file by streaming its base64 encoding to a temp file in chunks,
  // then decoding in place. Chunked so we stay under the busybox shell's input
  // line limit. 2 KB per chunk keeps a typical /opt/config.txt (1–2 KB) to one
  // or two round trips.
  async function writeFile(serial, path, contents) {
    const b64 = utf8ToBase64(contents);
    const tmp = `/tmp/.maia_write_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const qTmp = shellSingleQuote(tmp);
    const qPath = shellSingleQuote(path);
    let r = await serial.exec(`: > ${qTmp}`, 5000);
    if (r.exitCode !== 0) throw new Error('Could not create temp file');
    const CHUNK = 2048;
    for (let i = 0; i < b64.length; i += CHUNK) {
      const chunk = b64.slice(i, i + CHUNK);
      r = await serial.exec(`printf %s '${chunk}' >> ${qTmp}`, 5000);
      if (r.exitCode !== 0) throw new Error('Failed to append file chunk');
    }
    r = await serial.exec(`base64 -d < ${qTmp} > ${qPath} && rm ${qTmp}`, 10000);
    if (r.exitCode !== 0) throw new Error(`base64 decode/write to ${path} failed`);
  }

  function utf8ToBase64(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Disable `btn`, report pending/success/failure status around an awaited
  // function, and re-enable the button on the way out. `success` and `failure`
  // may be strings or functions of the result / error. Pass `onError` to
  // surface failures beyond the status line (e.g. the error banner).
  async function runAction(btn, setStatus, opts, fn) {
    const { pending, success, failure, onError } = opts;
    btn.disabled = true;
    try {
      setStatus(pending);
      const result = await fn();
      setStatus(typeof success === 'function' ? success(result) : success);
      return result;
    } catch (e) {
      setStatus((typeof failure === 'function' ? failure(e) : failure) + ': ' + e.message);
      onError?.(e);
    } finally {
      btn.disabled = false;
    }
  }

  // --- Inline confirmation ---
  //
  // Inserts a themed confirm strip immediately after `anchor` and resolves
  // `true`/`false` when the user clicks Confirm/Cancel (or presses Escape).
  // For table rows pass placement:'tr' and colspan.

  function askConfirm(anchor, opts) {
    const {
      message, detail, confirmLabel = 'Confirm',
      danger = true, placement = 'after', colspan = 1,
    } = opts;
    return new Promise(resolve => {
      // Preempt any open strip already anchored here. Its __cancel handles
      // listener cleanup and promise resolution for the previous call.
      const existing = anchor.nextElementSibling;
      if (existing && existing.classList?.contains('pt-confirm-host')) {
        existing.__cancel?.();
      }

      const strip = document.createElement('div');
      strip.className = 'pt-confirm-strip' + (danger ? ' pt-confirm-danger' : '');
      const text = document.createElement('div');
      text.className = 'pt-confirm-text';
      const msg = document.createElement('div');
      msg.className = 'pt-confirm-msg';
      msg.textContent = message;
      text.appendChild(msg);
      if (detail) {
        const pre = document.createElement('pre');
        pre.className = 'pt-confirm-detail';
        pre.textContent = detail;
        text.appendChild(pre);
      }
      strip.appendChild(text);
      const actions = document.createElement('span');
      actions.className = 'pt-confirm-actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'pt-confirm-cancel';
      cancel.textContent = 'Cancel';
      actions.appendChild(cancel);
      const ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'pt-confirm-ok';
      ok.textContent = confirmLabel;
      actions.appendChild(ok);
      strip.appendChild(actions);

      let host;
      if (placement === 'tr') {
        host = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = colspan;
        cell.appendChild(strip);
        host.appendChild(cell);
      } else {
        host = document.createElement('div');
        host.appendChild(strip);
      }
      host.classList.add('pt-confirm-host');
      anchor.after(host);

      function done(answer) {
        document.removeEventListener('keydown', onKey);
        host.remove();
        resolve(answer);
      }
      function onKey(e) { if (e.key === 'Escape') done(false); }

      host.__cancel = () => done(false);
      cancel.addEventListener('click', () => done(false));
      ok.addEventListener('click', () => done(true));
      document.addEventListener('keydown', onKey);

      cancel.focus();
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      host.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // --- UI ---

  function init() {
    const root = document.getElementById('pluto-tool');
    if (!root) return;

    const $ = sel => root.querySelector(sel);

    if (!('serial' in navigator)) {
      $('#pt-browser-warning').hidden = false;
      $('.pt-controls').hidden = true;
      return;
    }

    const connectBtn = $('#pt-connect');
    const disconnectBtn = $('#pt-disconnect');
    const statusEl = $('#pt-status');
    const loginSection = $('.pt-login');
    const userInput = $('#pt-user');
    const passInput = $('#pt-pass');
    const loginBtn = $('#pt-login');
    const postLoginSection = $('.pt-post-login');
    const logPre = $('#pt-log');
    const errorBanner = $('#pt-error');
    const errorMsg = errorBanner.querySelector('.pt-error-msg');
    const errorDismiss = errorBanner.querySelector('.pt-error-dismiss');

    // Cap the log DOM to avoid unbounded growth during long sessions.
    const LOG_MAX_ENTRIES = 2000;
    function log(chunk, dir) {
      const span = document.createElement('span');
      span.className = 'pt-log-' + dir;
      span.textContent = chunk;
      logPre.appendChild(span);
      while (logPre.childNodes.length > LOG_MAX_ENTRIES) {
        logPre.removeChild(logPre.firstChild);
      }
      logPre.scrollTop = logPre.scrollHeight;
    }

    const setStatus = msg => { statusEl.textContent = msg; };
    const logDetails = root.querySelector('details');
    const showError = e => {
      errorMsg.textContent = e.message || String(e);
      errorBanner.hidden = false;
      if (logDetails) logDetails.open = true;
    };
    const clearError = () => { errorBanner.hidden = true; };
    errorDismiss.addEventListener('click', clearError);

    const serial = new PlutoSerial({
      onLog: log,
      onDisconnect: () => {
        setState('disconnected', 'Port closed unexpectedly — reconnect the Pluto');
        showError({ message: 'Serial port closed unexpectedly. If you didn\'t unplug the Pluto, the device may have rebooted.' });
      },
    });

    function setState(s, message) {
      statusEl.textContent = message || s;
      connectBtn.disabled = s !== 'disconnected';
      disconnectBtn.disabled = s === 'disconnected';
      loginSection.hidden = s !== 'connected';
      postLoginSection.hidden = s !== 'ready';
    }

    connectBtn.addEventListener('click', async () => {
      try {
        setState('connecting', 'Requesting serial port…');
        await serial.connect();
        setState('connected', 'Connected — log in to continue');
      } catch (e) {
        setState('disconnected', 'Error: ' + e.message);
      }
    });

    disconnectBtn.addEventListener('click', async () => {
      await serial.disconnect();
      setState('disconnected', 'Disconnected');
    });

    loginBtn.addEventListener('click', async () => {
      loginBtn.disabled = true;
      try {
        setState('connected', 'Logging in…');
        await serial.login(userInput.value || 'root', passInput.value || 'analog');
        setState('ready', 'Logged in');
        // Keyboard users landed in the hidden login form; move them to the
        // first actionable control in the newly-visible panels.
        postLoginSection.querySelector('button')?.focus();
      } catch (e) {
        setState('connected', 'Login failed: ' + e.message);
      } finally {
        loginBtn.disabled = false;
      }
    });

    const submitOnEnter = e => { if (e.key === 'Enter') loginBtn.click(); };
    userInput.addEventListener('keydown', submitOnEnter);
    passInput.addEventListener('keydown', submitOnEnter);

    setupUbootPanel(root, serial, setStatus, showError, clearError);
    setupNetworkingPanel(root, serial, setStatus, showError, clearError);
    setupUsbModePanel(root, serial, setStatus, showError, clearError);
    setupConfigTxtPanel(root, serial, setStatus, showError, clearError);
    setupFirmwarePanel(root, serial, setStatus);

    setState('disconnected', 'Disconnected');
  }

  // --- U-boot panel ---

  function setupUbootPanel(root, serial, setStatus, showError, clearError) {
    const checkBtn = root.querySelector('#pt-check');
    const resetBtn = root.querySelector('#pt-reset-overrides');
    const resultsTable = root.querySelector('#pt-results');
    const resultsBody = resultsTable.querySelector('tbody');

    async function refresh() {
      const values = await readEnv(serial, CHECKS.map(c => c.key));
      renderResults(values);
    }

    checkBtn.addEventListener('click', () => runAction(checkBtn, setStatus, {
      pending: 'Reading u-boot environment…',
      success: 'Environment read',
      failure: 'Read failed',
    }, refresh));

    resetBtn.addEventListener('click', async () => {
      const ok = await askConfirm(resetBtn.closest('.pt-panel-actions'), {
        message: `Unset ${OVERRIDE_KEYS.join(', ')} — bootloader defaults will apply on next boot. attr_name / attr_val / mode are left alone.`,
        confirmLabel: 'Unset overrides',
      });
      if (!ok) return;
      clearError();
      await runAction(resetBtn, setStatus, {
        pending: 'Unsetting overrides…',
        success: 'Overrides unset — reboot the Pluto to apply',
        failure: 'Reset failed',
        onError: showError,
      }, async () => {
        for (const k of OVERRIDE_KEYS) await setEnv(serial, k, null);
        if (!resultsTable.hidden) await refresh();
      });
    });

    function renderResults(values) {
      resultsBody.innerHTML = '';
      for (const c of CHECKS) {
        const value = values[c.key];
        const ok = c.check(value);
        const tr = document.createElement('tr');
        tr.className = ok ? 'pt-row-ok' : 'pt-row-warn';

        tr.appendChild(td(c.key));
        const tdValue = td(value === null ? '(unset)' : value, 'pt-value');
        tr.appendChild(tdValue);
        const tdStatus = td(ok ? 'OK' : 'Needs fix');
        tr.appendChild(tdStatus);
        tr.appendChild(td(c.requirement));

        const tdAction = document.createElement('td');
        if (!ok) {
          const btn = document.createElement('button');
          btn.textContent = 'Apply recommended';
          btn.addEventListener('click', () => applyFix(c, tr, tdValue, tdStatus, btn));
          tdAction.appendChild(btn);
        }
        tr.appendChild(tdAction);
        resultsBody.appendChild(tr);
      }
      resultsTable.hidden = false;
    }

    async function applyFix(check, tr, tdValue, tdStatus, btn) {
      const ok = await askConfirm(tr, {
        message: `Set ${check.key} to:`,
        detail: check.recommended,
        confirmLabel: 'Apply',
        placement: 'tr',
        colspan: 5,
      });
      if (!ok) return;
      clearError();
      btn.disabled = true;
      try {
        await setEnv(serial, check.key, check.recommended);
        tdValue.textContent = check.recommended;
        tdStatus.textContent = 'OK (reboot required)';
        tr.className = 'pt-row-ok';
        btn.remove();
      } catch (e) {
        tdStatus.textContent = 'Apply failed: ' + e.message;
        btn.disabled = false;
        showError(e);
      }
    }
  }

  // --- Networking panel ---

  function setupNetworkingPanel(root, serial, setStatus, showError, clearError) {
    const readBtn = root.querySelector('#pt-net-read');
    const table = root.querySelector('#pt-net-table');
    const body = table.querySelector('tbody');
    const multiRow = root.querySelector('#pt-net-multi');
    const multiCheckbox = root.querySelector('#pt-net-multi-cb');
    const multiApply = root.querySelector('#pt-net-multi-apply');

    readBtn.addEventListener('click', () => runAction(readBtn, setStatus, {
      pending: 'Reading networking variables…',
      success: 'Networking variables read',
      failure: 'Read failed',
    }, async () => {
      const keys = [...NETWORKING_FIELDS.map(f => f.key), 'ipaddrmulti'];
      renderNet(await readEnv(serial, keys));
    }));

    function renderNet(values) {
      body.innerHTML = '';
      for (const f of NETWORKING_FIELDS) {
        const tr = document.createElement('tr');
        tr.appendChild(td(f.label));

        const tdInput = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = values[f.key] || '';
        input.placeholder = f.placeholder;
        input.size = 18;
        tdInput.appendChild(input);
        tr.appendChild(tdInput);

        // Blank is valid (means unset); otherwise run the per-field validator.
        // Mark aria-invalid + tooltip hint so the red border and screen
        // readers both reflect the state.
        const revalidate = () => {
          const v = input.value.trim();
          const bad = v !== '' && f.validate && !f.validate(v);
          input.setAttribute('aria-invalid', bad ? 'true' : 'false');
          input.title = bad ? `Expected: ${f.hint}` : '';
        };
        input.addEventListener('blur', revalidate);
        input.addEventListener('input', () => {
          // clear any previous error decoration as the user edits
          if (input.getAttribute('aria-invalid') === 'true') revalidate();
        });

        const tdAction = document.createElement('td');
        const btn = document.createElement('button');
        btn.textContent = 'Apply';
        btn.addEventListener('click', async () => {
          const newVal = input.value.trim();
          if (newVal !== '' && f.validate && !f.validate(newVal)) {
            input.setAttribute('aria-invalid', 'true');
            setStatus(`${f.key}: "${newVal}" invalid — expected ${f.hint}`);
            input.focus();
            return;
          }
          input.setAttribute('aria-invalid', 'false');
          clearError();
          await runAction(btn, setStatus, {
            pending: `Setting ${f.key}…`,
            success: `${f.key} updated — reboot required`,
            failure: `${f.key} failed`,
            onError: showError,
          }, () => setEnv(serial, f.key, newVal === '' ? null : newVal));
        });
        tdAction.appendChild(btn);
        tr.appendChild(tdAction);
        body.appendChild(tr);
      }
      table.hidden = false;
      multiCheckbox.checked = values.ipaddrmulti === '1';
      multiRow.hidden = false;
    }

    multiApply.addEventListener('click', () => {
      clearError();
      return runAction(multiApply, setStatus, {
        pending: 'Setting ipaddrmulti…',
        success: 'ipaddrmulti updated — reboot required',
        failure: 'ipaddrmulti failed',
        onError: showError,
      }, () => setEnv(serial, 'ipaddrmulti', multiCheckbox.checked ? '1' : null));
    });
  }

  // --- USB ethernet mode panel ---
  //
  // Set via u-boot env `usb_ethernet_mode` (values: rndis | ncm | ecm; blank = rndis default).
  // Per ADI Pluto customization wiki.

  function setupUsbModePanel(root, serial, setStatus, showError, clearError) {
    const readBtn = root.querySelector('#pt-usb-read');
    const applyBtn = root.querySelector('#pt-usb-apply');
    const matrix = root.querySelector('#pt-usb-matrix');
    const container = root.querySelector('#pt-usb-container');

    renderMatrix(null);

    readBtn.addEventListener('click', () => runAction(readBtn, setStatus, {
      pending: 'Reading usb_ethernet_mode…',
      success: ({ usb_ethernet_mode }) =>
        `usb_ethernet_mode = ${usb_ethernet_mode || '(unset → rndis default)'}`,
      failure: 'Read failed',
    }, async () => {
      const values = await readEnv(serial, ['usb_ethernet_mode']);
      renderMatrix((values.usb_ethernet_mode || '').toLowerCase() || 'rndis');
      container.hidden = false;
      return values;
    }));

    applyBtn.addEventListener('click', async () => {
      const picked = matrix.querySelector('input[name="pt-usb-mode"]:checked');
      if (!picked) { setStatus('Pick a mode first'); return; }
      const mode = picked.value;
      const ok = await askConfirm(applyBtn.closest('.pt-panel-actions'), {
        message: `Set usb_ethernet_mode to "${mode}". A reboot is required to apply.`,
        confirmLabel: 'Apply',
        danger: false,
      });
      if (!ok) return;
      clearError();
      await runAction(applyBtn, setStatus, {
        pending: `Setting usb_ethernet_mode=${mode}…`,
        success: `usb_ethernet_mode set to ${mode} — reboot required`,
        failure: 'Apply failed',
        onError: showError,
      }, () => setEnv(serial, 'usb_ethernet_mode', mode));
    });

    function renderMatrix(currentMode) {
      matrix.innerHTML = '';
      const thead = document.createElement('thead');
      const hrow = document.createElement('tr');
      hrow.appendChild(th(''));
      hrow.appendChild(th('Mode'));
      for (const os of USB_MODE_OSES) hrow.appendChild(th(os));
      thead.appendChild(hrow);
      matrix.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (const m of USB_MODES) {
        const tr = document.createElement('tr');
        const radioTd = document.createElement('td');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'pt-usb-mode';
        radio.value = m.value;
        radio.id = 'pt-usb-mode-' + m.value;
        if (currentMode === m.value) radio.checked = true;
        radioTd.appendChild(radio);
        tr.appendChild(radioTd);

        const labelTd = document.createElement('td');
        const label = document.createElement('label');
        label.setAttribute('for', radio.id);
        label.textContent = m.label;
        labelTd.appendChild(label);
        tr.appendChild(labelTd);

        for (const os of USB_MODE_OSES) {
          tr.appendChild(td(m.support[os] ? '✓' : '✗',
            m.support[os] ? 'pt-usb-yes' : 'pt-usb-no'));
        }
        tbody.appendChild(tr);
      }
      matrix.appendChild(tbody);
    }
  }

  // --- /opt/config.txt raw editor panel ---
  //
  // The matrix panel handles usb_ethernet_mode specifically via u-boot env.
  // This panel is an escape hatch for everything else that lives in
  // /opt/config.txt (hostname, ipaddr_eth, xo_correction, udc_handle_suspend,
  // etc.). Writes the whole file via chunked base64 upload.

  const CONFIG_TXT_PATH = '/opt/config.txt';

  function setupConfigTxtPanel(root, serial, setStatus, showError, clearError) {
    const readBtn = root.querySelector('#pt-cfg-read');
    const saveBtn = root.querySelector('#pt-cfg-save');
    const textarea = root.querySelector('#pt-cfg-textarea');
    const editorWrap = root.querySelector('#pt-cfg-editor');

    readBtn.addEventListener('click', () => runAction(readBtn, setStatus, {
      pending: `Reading ${CONFIG_TXT_PATH}…`,
      success: `${CONFIG_TXT_PATH} loaded — edit and save`,
      failure: 'Read failed',
    }, async () => {
      textarea.value = await readFile(serial, CONFIG_TXT_PATH);
      editorWrap.hidden = false;
    }));

    saveBtn.addEventListener('click', async () => {
      const ok = await askConfirm(saveBtn.closest('.pt-panel-actions'), {
        message: `Overwrite ${CONFIG_TXT_PATH} with the edited contents. A reboot is required to apply.`,
        confirmLabel: 'Save',
      });
      if (!ok) return;
      clearError();
      await runAction(saveBtn, setStatus, {
        pending: `Writing ${CONFIG_TXT_PATH}…`,
        success: `${CONFIG_TXT_PATH} saved — reboot required`,
        failure: 'Save failed',
        onError: showError,
      }, () => writeFile(serial, CONFIG_TXT_PATH, textarea.value));
    });
  }

  // --- Firmware info panel ---

  function setupFirmwarePanel(root, serial, setStatus) {
    const readBtn = root.querySelector('#pt-fw-read');
    const info = root.querySelector('#pt-fw-info');

    readBtn.addEventListener('click', () => runAction(readBtn, setStatus, {
      pending: 'Reading device info…',
      success: 'Device info read',
      failure: 'Info read failed',
    }, async () => {
      const lines = [
        await probe(serial, 'Model',
          `cat /sys/firmware/devicetree/base/model 2>/dev/null | tr -d '\\0'`),
        await probe(serial, 'Kernel', `uname -srmo`),
        await probe(serial, 'Hostname', `hostname`),
        await probe(serial, 'VERSIONS file',
          `cat /opt/VERSIONS 2>/dev/null || echo '(none)'`),
        await probe(serial, 'Uptime', `uptime`),
      ];
      info.textContent = lines.join('\n');
      info.hidden = false;
    }));
  }

  async function probe(serial, label, cmd) {
    try {
      const { stdout } = await serial.exec(cmd, 5000);
      return label.padEnd(14) + ': ' + (stdout.trim() || '(empty)');
    } catch (e) {
      return label.padEnd(14) + ': (error: ' + e.message + ')';
    }
  }

  // --- tiny DOM helpers ---

  function td(text, className) {
    const el = document.createElement('td');
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function th(text) {
    const el = document.createElement('th');
    el.textContent = text;
    return el;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
