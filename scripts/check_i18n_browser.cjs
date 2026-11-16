/* Integration check with real Chromium/WebGL. No npm dependencies.
 * CHROME_BIN=/path/to/chrome node scripts/check_i18n_browser.cjs
 * CDN dependencies are mirrored only in this test server's responses.
 * Default: real ES/EN MP3 playback, including all 13 English tracks without Web Speech.
 * --speech-fallback: simulate a missing EN manifest and verify fallback speech callbacks.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(path.join(root, '.i18n-browser-'));
const chromeBin = process.env.CHROME_BIN || '/home/jorge/.cache/puppeteer/chrome-headless-shell/linux-157.0.8103.50/chrome-headless-shell-linux64/chrome-headless-shell';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let chrome, server, socket;
const errors = [];
const checks = [];
const testSpeechFallback = process.argv.includes('--speech-fallback');
const vendors = {
  'three.module.js': 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'controls/OrbitControls.js': 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'gsap.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'ScrollTrigger.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
};
async function main() {
  for (const [name, url] of Object.entries(vendors)) {
    const target = path.join(scratch, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    execFileSync('curl', ['-fsSL', '--max-time', '30', url, '-o', target]);
  }
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (testSpeechFallback && pathname === '/data/voice_tracks_en.json') { response.writeHead(404); response.end(); return; }
    const file = pathname.startsWith('/__test_vendor/')
      ? path.join(scratch, pathname.slice('/__test_vendor/'.length))
      : path.join(root, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    let data = fs.readFileSync(file);
    if (pathname === '/') {
      let html = data.toString();
      html = html.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/', '/__test_vendor/');
      for (const [name, url] of Object.entries(vendors)) html = html.replaceAll(url, '/__test_vendor/' + name);
      data = Buffer.from(html);
    }
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Content-Length': data.length, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]); const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${data.length}` });
      response.end(data.subarray(start, end + 1));
    } else { response.writeHead(200, headers); response.end(data); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromeBin, ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir=' + path.join(scratch, 'profile'), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chrome startup timed out: ' + output)), 15000);
    chrome.stderr.on('data', (data) => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    chrome.on('error', reject);
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (entry) { clearTimeout(entry.timer); pending.delete(message.id); message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result); }
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  };
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => call(method, params, sessionId);
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const evaluate = async (expression) => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true, replMode: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, label, timeout = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) { if (await evaluate(`Boolean(${expression})`)) return; await delay(100); }
    throw new Error('Timed out: ' + label);
  };
  const check = async (expression, label) => { const ok = await evaluate(expression); if (!ok) console.log('CHECK STATE', await evaluate('({ lang: document.documentElement.lang, selected: document.querySelector("#globe")._scene.selectedId, stats: document.querySelector(".marker-stats b")?.textContent, camera: document.querySelector("#globe")._scene.camera.position.toArray(), priorCamera: window.__camera, hud: document.querySelector(".hud-top").getBoundingClientRect().toJSON(), actions: document.querySelector(".hud-top-actions").getBoundingClientRect().toJSON() })')); assert.ok(ok, label); checks.push(label); console.log('PASS ' + label); };
  const click = async (selector) => {
    assert.ok(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`), 'Missing element ' + selector);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await delay(120);
  };
  await cdp('Page.navigate', { url: origin });
  await until('window.ECHO_DATA?.length === 13 && document.getElementById("globe")._scene?.markerGroup', 'app boot');
  await delay(1400);
  await evaluate('window.__sentinel = 2099; document.querySelector("#globe")._scene.controls.autoRotate = false');
  await check('document.documentElement.lang === "es" && document.querySelector(".scrolly-title").textContent.includes("silencio")', 'Spanish default and actual WebGL scene');
  const nativeSpeech = await evaluate('({ supported: Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance), voices: window.speechSynthesis?.getVoices().map(v => v.lang) || [] })');
  console.log('Native Web Speech:', JSON.stringify(nativeSpeech));
  await click('#btn-lang');
  await until('window.ECHO_DATA[8].first_person_story.voice_text.startsWith("I am")', 'English catalog');
  await check('document.documentElement.lang === "en" && localStorage.echoes_lang === "en" && document.querySelector("#btn-lang .lang-code").textContent === "ES" && document.querySelector(".scrolly-title").textContent.includes("Silence") && document.querySelector("[data-body=moon]").textContent.includes("MOON") && document.querySelector(".audio-toggle").title.includes("Space") && document.querySelector(".badge-pill").title.includes("Quizzes") && document.querySelector(".footer-credits").textContent.startsWith("Student team")', 'Live English UI, tooltips, footer and persistence');
  await evaluate(`document.querySelector('#globe').dispatchEvent(new CustomEvent('echo:marker-selected', { detail: { id: 'spirit-mer-a' } }))`);
  await until('document.querySelector(".marker-photo img")?.complete && document.querySelector(".marker-photo img").naturalWidth > 0', 'NASA image');
  await delay(2200);
  await evaluate('window.__camera = document.querySelector("#globe")._scene.camera.position.toArray(); window.__markers = document.querySelector("#globe")._scene.markerGroup; void 0');
  await check('document.querySelector(".marker-stats b").textContent === "LANDING" && document.querySelector(".marker-photo").hidden === false && !document.querySelector(".marker-panel").textContent.includes("I am Spirit") && document.querySelector(".marker-hardware").textContent.includes("spectrometer")', 'English mission data, initial photo, story remains locked');
  await click('#marker-panel [data-action=language]');
  await check('document.querySelector(".marker-stats b").textContent === "ATERRIZAJE" && document.querySelector("#globe")._scene.selectedId === "spirit-mer-a" && window.__markers === document.querySelector("#globe")._scene.markerGroup && window.__camera.every((v, i) => Math.abs(v - document.querySelector("#globe")._scene.camera.position.toArray()[i]) < 0.001) && window.__sentinel === 2099 && performance.getEntriesByType("navigation").length === 1', 'Switch preserves selection, camera, marker objects and document');
  await click('.marker-close');
  await delay(500);
  await click('#btn-manual');
  await until('document.querySelectorAll(".manual-term").length === 8', 'Spanish manual');
  await evaluate('document.querySelector(".manual-content").scrollTop = 300');
  await click('#cadet-manual .hud-lang-btn');
  await until('document.querySelector(".manual-term h3")?.textContent === "Laser Ranging Retroreflector (LRRR)"', 'English manual');
  await check('document.querySelector("#cadet-manual").open && document.querySelector("#manual-title").textContent === "Cadet Field Manual" && document.querySelectorAll(".manual-term").length === 8 && document.querySelector(".manual-term h4").textContent === "In a nutshell" && document.querySelector(".manual-content").scrollTop === 300 && document.querySelector(".manual-simulated").textContent.includes("Not NASA telemetry")', 'Manual translates all eight terms live and retains scroll');
  await click('.manual-close');
  if (testSpeechFallback) {
  // Controlled Web Speech callbacks let CI verify en-US, boundary synchronization and cancellation.
  await evaluate(`window.__speechCalls = []; window.__speechCancels = 0;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ name: 'Test US', lang: 'en-US' }, { name: 'Test ES', lang: 'es-ES' }],
      cancel: () => { window.__speechCancels++; },
      speak: (utterance) => { window.__speechCalls.push(utterance); window.__speech = utterance; utterance.onstart?.(); }
    }}); void 0;`);
  } else {
    // Local English narration must work even when the browser has no speech API.
    await evaluate("Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }); void 0");
  }
  await evaluate(`document.querySelector('#globe').dispatchEvent(new CustomEvent('echo:marker-selected', { detail: { id: 'spirit-mer-a' } }))`);
  await click('[data-action=tuner]');
  await check('document.querySelector(".st-title").textContent === "Restore the Frequency" && getComputedStyle(document.querySelector(".st-card")).width === "1152px" && getComputedStyle(document.querySelector(".st-card")).maxHeight === "765px" && getComputedStyle(document.querySelector(".st-captions")).fontSize === "19.2px" && document.querySelector(".st-canvas").getAttribute("aria-hidden") === "true"', 'Michelle’s 90vw / 85vh tuner and 1.2rem captions preserved');
  await evaluate('document.querySelector(".st-dial").value = 200; document.querySelector(".st-dial").dispatchEvent(new Event("input"))');
  await delay(1200);
  await check('document.querySelector(".st-success").style.display !== "block" && document.querySelector(".st-captions").textContent === "" && !document.querySelector("[data-action=go-trivia]")', 'Wrong frequency keeps text, voice and quiz locked');
  await click('.st-overlay [data-action=language]');
  await check('document.querySelector(".st-dial").value === "200" && document.querySelector(".st-feedback").textContent.startsWith("Señal débil")', 'Unsynced language switch retains dial and translates feedback');
  await evaluate('document.querySelector(".st-dial").value = 354; document.querySelector(".st-dial").dispatchEvent(new Event("input"))');
  await until('document.querySelector(".st-narration").currentTime > 0.1 && !document.querySelector(".st-narration").paused', 'Real Spanish MP3 playback', 15000);
  await until('Boolean(document.querySelector(".st-word.is-speaking"))', 'Spanish timed captions');
  await check('document.querySelector(".st-dial").disabled && document.querySelector(".st-word").textContent === "Yo" && document.querySelector(".st-narration").currentSrc.includes("assets/audio/")', 'Spanish narration still uses local MP3 with live word highlights');
  await click('.st-overlay [data-action=language]');
  if (testSpeechFallback) {
  await until('window.__speech?.lang === "en-US"', 'English speech fallback');
  await evaluate('window.__speech.onboundary({ charIndex: 5, name: "word" })');
  await check('window.__speech.text.startsWith("I am Spirit") && window.__speech.voice.lang === "en-US" && document.querySelector(".st-word.is-speaking").textContent.startsWith("Spirit") && document.querySelector(".st-dial").value === "354" && document.querySelector(".st-dial").disabled && document.querySelector(".st-narration").hidden && document.querySelector(".st-narration").paused', 'Missing EN manifest uses en-US speech; boundary highlights and lock preserved');
  await evaluate('window.__speech.onend()');
  } else {
    await until('document.querySelector(".st-narration").currentTime > 0.1 && !document.querySelector(".st-narration").paused && document.querySelector(".st-narration").currentSrc.includes("/audio/en/")', 'Real English MP3 playback', 15000);
    await until('Boolean(document.querySelector(".st-word.is-speaking"))', 'English timed captions');
    await check('document.querySelector(".st-captions").textContent.startsWith("I am Spirit") && document.querySelector(".st-dial").value === "354" && document.querySelector(".st-dial").disabled && !document.querySelector(".st-narration").hidden && !window.speechSynthesis', 'Real English MP3 and timed captions work without browser voices');
    await evaluate('const player = document.querySelector(".st-narration"); player.playbackRate = 8; player.currentTime = player.duration - 0.4; void 0');
    await until('Boolean(document.querySelector("[data-action=go-trivia]"))', 'English audio ended event', 10000);
  }
  await check('document.querySelector(".st-caption-end").textContent.includes("end of transmission") && document.querySelector("[data-action=go-trivia]").textContent.includes("TAKE THE QUIZ")', 'English narration completion unlocks translated quiz');
  await click('.st-overlay [data-action=language]');
  await check('document.querySelector(".st-word").textContent === "Yo" && document.querySelector(".st-caption-end").textContent.includes("fin de transmisión") && document.querySelector("[data-action=go-trivia]")', 'Finished narration switches text without automatically replaying');
  await click('[data-action=go-trivia]');
  await click('.trivia-option:nth-child(2)');
  await check('document.querySelectorAll(".trivia-option:disabled").length === 1 && document.querySelector(".trivia-feedback").textContent.includes("incorrecta") && !localStorage.echoes_badges', 'Wrong answer allows retry without earning a badge');
  await click('.trivia-overlay [data-action=language]');
  await check('document.querySelector(".trivia-feedback").textContent.includes("Incorrect answer") && document.querySelector(".trivia-option:nth-child(2)").disabled && document.querySelector(".trivia-card h3").textContent.startsWith("What")', 'Trivia question, options and wrong feedback translate without resetting attempt');
  await click('.trivia-option:first-child');
  await check('document.querySelector(".trivia-feedback").textContent.includes("Correct answer") && document.querySelector(".trivia-funfact").textContent.includes("Fun fact:") && JSON.parse(localStorage.echoes_badges).join() === "spirit-mer-a" && document.querySelector(".badge-count").textContent === "1" && document.querySelector(".marker-panel [role=status]").textContent.includes("answered correctly") && document.querySelector("#globe")._scene.markerGroup.userData.completionChecks.some(c => c.visible && c.userData.artifactId === "spirit-mer-a")', 'Correct quiz awards exactly one badge and green globe check');
  await click('.trivia-overlay [data-action=language]');
  await check('document.querySelector(".trivia-feedback").textContent.includes("correcta") && document.querySelectorAll(".trivia-option:disabled").length === 3 && JSON.parse(localStorage.echoes_badges).length === 1 && document.querySelector(".toast").textContent.includes("Trivia completada")', 'Solved trivia, toast and badge survive switching');
  await click('.trivia-overlay [data-action=close]');
  await evaluate('const { openTrivia } = await import("/js/game/trivia.js"); openTrivia(window.ECHO_DATA.find(a => a.id === "spirit-mer-a"))');
  await click('.trivia-option:first-child');
  await check('document.querySelector("[data-action=restore]").disabled && JSON.parse(localStorage.echoes_badges).length === 1', 'Repeated correct answer never duplicates progress');
  await click('.trivia-overlay [data-action=close]');
  await click('.marker-close');
  await delay(500);
  if (testSpeechFallback) {
  // Exercise cancellation while English is still speaking, plus the no-speech fallback.
  await evaluate(`const { openSignalTuner } = await import('/js/game/signal-tuner.js');
    window.__speech = null;
    openSignalTuner(window.ECHO_DATA.find(a => a.id === 'spirit-mer-a'));`);
  await click('.st-overlay [data-action=language]');
  await evaluate('document.querySelector(".st-dial").value = 354; document.querySelector(".st-dial").dispatchEvent(new Event("input"))');
  await until('window.__speech?.lang === "en-US" && Boolean(window.__speech.onstart)', 'second English narration');
  await evaluate('window.__priorUtterance = window.__speech; window.__cancelsBefore = window.__speechCancels; void 0');
  await click('[data-action=play-voice]');
  await check('window.__speech !== window.__priorUtterance && window.__priorUtterance.onend === null && window.__speechCancels > window.__cancelsBefore', 'Replay cancels the previous English utterance and callbacks');
  await evaluate('window.__priorUtterance = window.__speech; window.__cancelsBefore = window.__speechCancels; void 0');
  await click('.st-overlay [data-action=language]');
  await check('window.__priorUtterance.onend === null && window.__speechCancels > window.__cancelsBefore && document.querySelector(".st-word").textContent === "Yo"', 'Changing language cancels active English speech before Spanish audio');
  await click('.st-overlay [data-action=language]');
  await until('window.__speech?.onend && window.__speech !== window.__priorUtterance', 'third English narration');
  await evaluate('window.__priorUtterance = window.__speech; window.__cancelsBefore = window.__speechCancels; void 0');
  await click('.st-overlay [data-action=close]');
  await check('!document.querySelector(".st-overlay") && window.__priorUtterance.onend === null && window.__speechCancels > window.__cancelsBefore', 'Closing the tuner cancels speech and removes stale callbacks');
  await evaluate(`Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    openSignalTuner(window.ECHO_DATA.find(a => a.id === 'spirit-mer-a')); void 0;`);
  await evaluate('document.querySelector(".st-dial").value = 354; document.querySelector(".st-dial").dispatchEvent(new Event("input"))');
  await until('Boolean(document.querySelector("[data-action=go-trivia]"))', 'speech unavailable fallback');
  await check('document.querySelector(".st-captions").textContent.startsWith("I am Spirit") && document.querySelector(".st-feedback").textContent.includes("Speech is unavailable")', 'Browsers without speech retain readable English story and quiz');
  await click('.st-overlay [data-action=close]');
  } else {
    await evaluate(`const { openSignalTuner } = await import('/js/game/signal-tuner.js');
      openSignalTuner(window.ECHO_DATA.find(a => a.id === 'spirit-mer-a'));`);
    await click('.st-overlay [data-action=language]');
    await evaluate('document.querySelector(".st-dial").value = 354; document.querySelector(".st-dial").dispatchEvent(new Event("input"))');
    await until('document.querySelector(".st-narration").currentTime > 0.2 && !document.querySelector(".st-narration").paused', 'English replay check');
    await click('[data-action=play-voice]');
    await check('document.querySelector(".st-narration").currentTime < 1 && !document.querySelector(".st-narration").paused && !document.querySelector("[data-action=go-trivia]")', 'Replay restarts real English audio and resets completion');
    await evaluate('window.__priorPlayer = document.querySelector(".st-narration"); void 0');
    await click('.st-overlay [data-action=close]');
    await check('!document.querySelector(".st-overlay") && window.__priorPlayer.paused && !window.__priorPlayer.getAttribute("src")', 'Closing the tuner stops and releases English audio');
    const englishIds = await evaluate('window.ECHO_DATA.map(a => a.id)');
    for (const id of englishIds) {
      await evaluate(`await (async () => {
        const { openSignalTuner } = await import('/js/game/signal-tuner.js');
        const { targetFrequency } = await import('/js/game/frequencies.js');
        const artifact = window.ECHO_DATA.find(a => a.id === ${JSON.stringify(id)});
        openSignalTuner(artifact);
        const dial = document.querySelector('.st-dial');
        dial.value = targetFrequency(artifact.id);
        dial.dispatchEvent(new Event('input'));
      })()`);
      await until('document.querySelector(".st-narration").currentTime > 0.1 && !document.querySelector(".st-narration").paused', 'English audio ' + id, 15000);
      await until('Boolean(document.querySelector(".st-word.is-speaking"))', 'English word highlight ' + id);
      await check(`document.querySelector('.st-narration').currentSrc.endsWith('/assets/audio/en/${id}.mp3') && [...document.querySelectorAll('.st-word')].map(e => e.textContent).join(' ') === window.ECHO_DATA.find(a => a.id === ${JSON.stringify(id)}).first_person_story.voice_text && !window.speechSynthesis`, 'English local playback and exact captions: ' + id);
      await click('.st-overlay [data-action=close]');
    }
  }
  // All 13 records and all UI dictionaries resolve in both languages.
  await check(`await (async () => {
    const { messages, setLang, getLang, loadCatalog, localizeArtifact } = await import('/js/i18n.js');
    if (JSON.stringify(Object.keys(messages.es).sort()) !== JSON.stringify(Object.keys(messages.en).sort())) return false;
    for (const lang of ['en', 'es']) {
      setLang(lang);
      const catalog = await loadCatalog(lang);
      for (const artifact of catalog) {
        document.querySelector('#marker-panel').open(artifact);
        if (document.querySelector('.marker-title').textContent !== artifact.name || !document.querySelector('.marker-monument').textContent.includes(artifact.monument_significance) || localizeArtifact(artifact).id !== artifact.id) return false;
      }
    }
    document.querySelector('#marker-panel').close();
    setLang('en');
    return getLang() === 'en';
  })()`, 'All 13 translated artifacts and matching UI dictionary keys');
  await delay(500);
  await check(`await (async () => {
    const { setLang } = await import('/js/i18n.js');
    for (let i = 0; i < 8; i++) { setLang('es'); setLang('en'); }
    await new Promise(resolve => setTimeout(resolve, 50));
    return document.documentElement.lang === 'en' && window.ECHO_DATA.find(a => a.id === 'spirit-mer-a').first_person_story.voice_text.startsWith('I am') && document.querySelector('.marker-stats b').textContent === 'LANDING';
  })()`, 'Rapid toggles never apply a stale-language catalog');
  // English HUD must fit a phone without losing any action.
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: false });
  await delay(200);
  await check('[...document.querySelectorAll(".hud-top-actions > *")].every(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })', 'English language selector, manual, badges and audio fit mobile');
  await click('#btn-manual');
  await check('document.querySelector(".manual-header").scrollWidth <= document.querySelector(".manual-header").clientWidth + 1', 'English manual header fits mobile');
  await click('.manual-close');
  if (process.env.I18N_SCREENSHOT) {
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(root, process.env.I18N_SCREENSHOT), Buffer.from(screenshot.data, 'base64'));
  }
  // Reload verifies persistence, distinct from all previous no-navigation switches.
  await cdp('Page.reload');
  await until('window.ECHO_DATA?.length === 13 && document.documentElement.lang === "en"', 'persisted English after reload');
  await check('document.querySelector(".badge-count").textContent === "1" && document.querySelector(".scrolly-title").textContent.includes("Silence")', 'Language and quiz progress persist after reload');
  assert.deepEqual(errors, [], 'Uncaught browser exceptions');
  console.log(`BROWSER OK: ${checks.length} checks; no uncaught exceptions. Native speech voices: ${nativeSpeech.voices.length}. Mode: ${testSpeechFallback ? 'controlled Web Speech fallback' : 'real local ES/EN audio; 13 English tracks checked without speech API'}.`);
}
main().catch((error) => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  chrome?.kill('SIGTERM');
  if (chrome) await new Promise((resolve) => { if (chrome.exitCode !== null) resolve(); else { chrome.once('exit', resolve); setTimeout(resolve, 3000).unref(); } });
  server?.close();
  fs.rmSync(scratch, { recursive: true, force: true });
});
