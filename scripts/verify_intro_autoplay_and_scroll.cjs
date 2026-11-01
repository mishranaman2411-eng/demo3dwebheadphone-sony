const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyIntroAutoplayAndScroll() {
  console.log('=== VERIFYING INTRO AUTOPLAY & SCROLL TIMELINE ===\n');

  const previewDir = path.resolve('tasks', 'previews', 'autoplay_verification');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9347', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9347/json', r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => res(JSON.parse(b)));
    }).on('error', rej);
  });

  const t = targets.find(x => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let msgId = 1;
  function call(method, params) {
    return new Promise((res, rej) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) rej(new Error(JSON.stringify(msg.error)));
          else res(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }

  async function evalJS(expr) {
    const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result.value;
  }

  try {
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });

    console.log('1. Navigating to http://localhost:4173 (Initial Page Load)...');
    await call('Page.navigate', { url: 'http://localhost:4173' });

    // Immediate check at load (within first 200ms)
    await new Promise(r => setTimeout(r, 200));
    const initialCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        introAutoplaying: window.__introAutoplaying,
        introFrozen: window.__introFrozen,
      };
    })()`);
    console.log('Initial Load Check:', initialCheck);

    const shot0 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_0_start_load.png'), Buffer.from(shot0.data, 'base64'));

    // Check 2: Mid-autoplay (after ~1.8s)
    console.log('\n2. Checking mid-autoplay progression (after 1.8s)...');
    await new Promise(r => setTimeout(r, 1800));
    const midCheck = await evalJS(`(() => {
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Mid-autoplay Check:', midCheck);

    const shotMid = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_1_mid_autoplay.png'), Buffer.from(shotMid.data, 'base64'));

    if (!midCheck.lastDrawnUrl || midCheck.lastDrawnUrl.includes('frame_000001')) {
      throw new Error('Animation did not automatically advance during intro!');
    }

    // Check 3: Wait for intro autoplay to reach SILENCE, ENGINEERED and freeze (~2.5s more, total ~4.5s)
    console.log('\n3. Waiting for intro autoplay to complete and freeze at SILENCE, ENGINEERED...');
    for (let i = 0; i < 40; i++) {
      const isFrozen = await evalJS('window.__introFrozen');
      if (isFrozen) break;
      await new Promise(r => setTimeout(r, 150));
    }

    const frozenCheck = await evalJS(`(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('SILENCE'));
      const headingContainer = h2?.closest('[style*="display"]');
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry,
        introAutoplaying: window.__introAutoplaying,
        introFrozen: window.__introFrozen,
        headingText: h2?.innerText,
        headingOpacity: headingContainer ? window.getComputedStyle(headingContainer).opacity : null,
      };
    })()`);
    console.log('Frozen Check:', frozenCheck);

    if (!frozenCheck.introFrozen) {
      throw new Error('Intro did not freeze at stopping point!');
    }
    if (frozenCheck.headingOpacity !== '1') {
      throw new Error(`SILENCE, ENGINEERED heading is not fully visible! Opacity: ${frozenCheck.headingOpacity}`);
    }

    const shotFrozen = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_2_frozen_silence.png'), Buffer.from(shotFrozen.data, 'base64'));

    // Check 4: Confirm it remains completely frozen while waiting (wait 1.2s without scroll)
    console.log('\n4. Verifying frame holds and does not advance without user scroll (waiting 1.2s)...');
    await new Promise(r => setTimeout(r, 1200));
    const stillFrozenCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
      };
    })()`);
    console.log('Still Frozen Check:', stillFrozenCheck);

    if (stillFrozenCheck.lastDrawnUrl !== frozenCheck.lastDrawnUrl) {
      throw new Error(`Frame drifted without scroll! Expected ${frozenCheck.lastDrawnUrl}, got ${stillFrozenCheck.lastDrawnUrl}`);
    }

    const shotStillFrozen = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_3_frozen_still_holding.png'), Buffer.from(shotStillFrozen.data, 'base64'));

    // Check 5: Scroll-controlled forward playback
    console.log('\n5. Scrolling down to advance animation (user scroll control)...');
    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    const scrollTargetForward = Math.round(maxScroll * 0.25); // ~25% scroll (Video 3 sound demo)
    await evalJS(`window.scrollTo(0, ${scrollTargetForward})`);
    
    // Wait for frame to load and draw
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      const lastUrl = await evalJS('window.__lastDrawnUrl');
      if (lastUrl && lastUrl.includes('video-3')) break;
    }

    const forwardCheck = await evalJS(`(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('EVERY DETAIL'));
      const headingContainer = h2?.closest('[style*="display"]');
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        h2Text: h2?.innerText,
        h2Opacity: headingContainer ? window.getComputedStyle(headingContainer).opacity : null,
      };
    })()`);
    console.log('Forward Scroll Check (Video 3):', forwardCheck);

    if (!forwardCheck.lastDrawnUrl.includes('video-3')) {
      throw new Error(`Forward scroll did not advance to Video 3! Drawn: ${forwardCheck.lastDrawnUrl}`);
    }

    const shotForward = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_4_scrolled_forward.png'), Buffer.from(shotForward.data, 'base64'));

    // Check 6: Scroll-controlled reverse playback
    console.log('\n6. Scrolling up in reverse back to scroll 0...');
    await evalJS('window.scrollTo(0, 0)');
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      const lastUrl = await evalJS('window.__lastDrawnUrl');
      if (lastUrl && lastUrl.includes('video-2')) break;
    }

    const reverseCheck = await evalJS(`(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('SILENCE'));
      const headingContainer = h2?.closest('[style*="display"]');
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        headingOpacity: headingContainer ? window.getComputedStyle(headingContainer).opacity : '0',
      };
    })()`);
    console.log('Reverse to 0 Check:', reverseCheck);

    if (!reverseCheck.lastDrawnUrl.includes('video-2') || reverseCheck.headingOpacity !== '1') {
      throw new Error(`Reverse scroll to 0 did not return to SILENCE, ENGINEERED! Drawn: ${reverseCheck.lastDrawnUrl}, Opacity: ${reverseCheck.headingOpacity}`);
    }

    const shotReverse = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_5_scrolled_backward.png'), Buffer.from(shotReverse.data, 'base64'));

    // Check 7: Page Reload restarts intro autoplay
    console.log('\n7. Testing Page Reload to confirm autoplay restarts from frame 1...');
    await call('Page.reload');
    await new Promise(r => setTimeout(r, 200));

    const reloadCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Reload Check:', reloadCheck);

    await new Promise(r => setTimeout(r, 1500));
    const reloadMidCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Reload Mid-progression Check:', reloadMidCheck);

    if (!reloadMidCheck.lastDrawnUrl || reloadMidCheck.lastDrawnUrl.includes('frame_000001')) {
      throw new Error('Reload did not restart autoplay!');
    }

    const shotReload = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'intro_6_reloaded_autoplay_restart.png'), Buffer.from(shotReload.data, 'base64'));

    console.log('\n=== ALL INTRO AUTOPLAY & SCROLL VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifyIntroAutoplayAndScroll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
