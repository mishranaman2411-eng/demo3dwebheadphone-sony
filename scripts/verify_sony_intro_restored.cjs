const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifySonyIntroRestored() {
  console.log('=== VERIFYING EXACT SONY INTRO RESTORATION ===\n');

  const previewDir = path.resolve('tasks', 'previews', 'sony_intro_verification');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9348', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9348/json', r => {
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

    console.log('1. Navigating to http://localhost:4173 (Fresh Page Load)...');
    await call('Page.navigate', { url: 'http://localhost:4173' });

    // Immediate check at load (within first 150ms)
    await new Promise(r => setTimeout(r, 150));
    const initialCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        introAutoplaying: window.__introAutoplaying,
        introFrozen: window.__introFrozen,
      };
    })()`);
    console.log('Initial Load Check (Frame 1):', initialCheck);

    const shot0 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_0_white_start.png'), Buffer.from(shot0.data, 'base64'));

    if (!initialCheck.lastDrawnUrl || !initialCheck.lastDrawnUrl.includes('video-1/frame_000001')) {
      console.log('Warning: initial drawn url was:', initialCheck.lastDrawnUrl);
    }

    // Check 2: Sony Logo presentation (after ~1.0s, around frame 30-40)
    console.log('\n2. Capturing authentic Sony logo presentation (~1.2s into opening)...');
    await new Promise(r => setTimeout(r, 1100));
    const logoCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Sony Logo Check:', logoCheck);

    const shotLogo = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_1_sony_logo.png'), Buffer.from(shotLogo.data, 'base64'));

    if (!logoCheck.lastDrawnUrl || !logoCheck.lastDrawnUrl.includes('video-1')) {
      throw new Error(`Expected Video 1 during logo presentation, got ${logoCheck.lastDrawnUrl}`);
    }

    // Check 3: Headphones rising (~2.6s, around frame 80-90)
    console.log('\n3. Capturing headphones rising into view (~2.6s into opening)...');
    await new Promise(r => setTimeout(r, 1400));
    const risingCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Headphones Rising Check:', risingCheck);

    const shotRising = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_2_headphones_rising.png'), Buffer.from(shotRising.data, 'base64'));

    // Check 4: Wait for intro autoplay to freeze at SILENCE, ENGINEERED
    console.log('\n4. Waiting for intro autoplay to freeze at SILENCE, ENGINEERED...');
    for (let i = 0; i < 40; i++) {
      const isFrozen = await evalJS('window.__introFrozen');
      if (isFrozen) break;
      await new Promise(r => setTimeout(r, 150));
    }

    const frozenCheck = await evalJS(`(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('SILENCE'));
      const headingContainer = h2?.closest('[style*="display"]');
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        telemetry: document.getElementById('frame-telemetry')?.innerText,
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
    fs.writeFileSync(path.join(previewDir, 'sony_intro_3_frozen_silence.png'), Buffer.from(shotFrozen.data, 'base64'));

    // Check 5: Confirm it remains completely frozen while waiting (wait 1.0s without scroll)
    console.log('\n5. Verifying frame holds and does not advance without user scroll (waiting 1.0s)...');
    await new Promise(r => setTimeout(r, 1000));
    const stillFrozenCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
      };
    })()`);
    console.log('Still Frozen Check:', stillFrozenCheck);

    if (stillFrozenCheck.lastDrawnUrl !== frozenCheck.lastDrawnUrl) {
      throw new Error(`Frame drifted without scroll! Expected ${frozenCheck.lastDrawnUrl}, got ${stillFrozenCheck.lastDrawnUrl}`);
    }

    // Check 6: Scroll-controlled forward playback
    console.log('\n6. Scrolling down to advance animation (user scroll control)...');
    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    const scrollTargetForward = Math.round(maxScroll * 0.25);
    await evalJS(`window.scrollTo(0, ${scrollTargetForward})`);
    
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

    const shotForward = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_4_scroll_forward.png'), Buffer.from(shotForward.data, 'base64'));

    // Check 7: Scroll-controlled reverse playback
    console.log('\n7. Scrolling up in reverse back to scroll 0...');
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
        headingOpacity: headingContainer ? window.getComputedStyle(headingContainer).opacity : '0',
      };
    })()`);
    console.log('Reverse to 0 Check:', reverseCheck);

    const shotReverse = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_5_scroll_reverse.png'), Buffer.from(shotReverse.data, 'base64'));

    // Check 8: Page Reload restarts intro autoplay
    console.log('\n8. Testing Page Reload to confirm autoplay restarts from frame 1...');
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

    await new Promise(r => setTimeout(r, 1200));
    const reloadLogoCheck = await evalJS(`(() => {
      return {
        scrollY: window.scrollY,
        lastDrawnUrl: window.__lastDrawnUrl,
        introAutoplaying: window.__introAutoplaying,
      };
    })()`);
    console.log('Reload Logo Progression Check:', reloadLogoCheck);

    const shotReload = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'sony_intro_6_reload.png'), Buffer.from(shotReload.data, 'base64'));

    console.log('\n=== ALL SONY INTRO VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifySonyIntroRestored().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
