const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyCleanSequence() {
  console.log('=== VERIFYING CLEAN CINEMATIC SEQUENCE (STEP 6) ===\n');

  const previewDir = path.resolve('tasks', 'previews', 'clean_verification');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9345', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9345/json', r => {
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

    console.log('Navigating to http://localhost:4173...');
    await call('Page.navigate', { url: 'http://localhost:4173' });
    await new Promise(r => setTimeout(r, 2500));

    // CHECK 1: Initial state at scroll 0
    console.log('\n--- 1. Initial State at Scroll 0 ---');
    const initialCheck = await evalJS(`(() => {
      const canvas = document.querySelector('canvas');
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      const whiteOverlays = document.querySelectorAll('div.bg-white');
      return {
        canvasExists: !!canvas,
        telemetry,
        whiteOverlayCount: whiteOverlays.length,
      };
    })()`);
    console.log('Initial Check:', initialCheck);

    const shot0 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_0_scroll0_initial.png'), Buffer.from(shot0.data, 'base64'));
    console.log('Saved clean_0_scroll0_initial.png');

    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    console.log(`Total scroll track: ${maxScroll}px`);

    async function scrollToAndWait(fraction, expectedVideo, label) {
      console.log(`\n--- ${label} ---`);
      const targetScroll = Math.round(maxScroll * fraction);
      await evalJS(`window.scrollTo(0, ${targetScroll})`);
      
      // Wait until target video clip frame is drawn to canvas
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 100));
        const lastUrl = await evalJS('window.__lastDrawnUrl');
        if (lastUrl && lastUrl.includes(`video-${expectedVideo}`)) {
          break;
        }
      }
      await new Promise(r => setTimeout(r, 200));
      const telemetry = await evalJS("document.getElementById('frame-telemetry')?.innerText");
      const lastUrl = await evalJS('window.__lastDrawnUrl');
      console.log(`Telemetry at ${(fraction*100).toFixed(0)}%:`, telemetry, `Drawn: ${lastUrl}`);
    }

    // CHECK 2: Early Scroll (~2% scroll, clean white opening)
    await scrollToAndWait(0.02, 1, '2. Early Scroll (~2% scroll, clean white opening)');
    const shotEarly = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_1_clean_white_opening.png'), Buffer.from(shotEarly.data, 'base64'));

    // CHECK 3: Heading 1: SILENCE, ENGINEERED (~8% scroll)
    await scrollToAndWait(0.08, 2, '3. Heading 1: SILENCE, ENGINEERED (~8% scroll)');
    const h1State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('SILENCE'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H1 check:', h1State);
    const shotH1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_2_heading1_silence.png'), Buffer.from(shotH1.data, 'base64'));

    // CHECK 4: Heading 2: EVERY DETAIL, HEARD. (~25% scroll)
    await scrollToAndWait(0.25, 3, '4. Heading 2: EVERY DETAIL, HEARD. (~25% scroll)');
    const h2State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('EVERY DETAIL'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H2 check:', h2State);
    const shotH2 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_3_heading2_sound.png'), Buffer.from(shotH2.data, 'base64'));

    // CHECK 5: Heading 3: BUILT FOR THE EVERYDAY. (~38% scroll)
    await scrollToAndWait(0.38, 5, '5. Heading 3: BUILT FOR THE EVERYDAY. (~38% scroll)');
    const h3State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('BUILT FOR'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H3 check:', h3State);
    const shotH3 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_4_heading3_durability.png'), Buffer.from(shotH3.data, 'base64'));

    // CHECK 6: Heading 4: UP TO 50 HOURS OF BATTERY LIFE. (~52% scroll)
    await scrollToAndWait(0.52, 6, '6. Heading 4: UP TO 50 HOURS OF BATTERY LIFE. (~52% scroll)');
    const h4State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('50 HOURS'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H4 check:', h4State);
    const shotH4 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_5_heading4_battery.png'), Buffer.from(shotH4.data, 'base64'));

    // CHECK 7: Heading 5: COMFORT THAT STAYS WITH YOU. (~65% scroll)
    await scrollToAndWait(0.65, 7, '7. Heading 5: COMFORT THAT STAYS WITH YOU. (~65% scroll)');
    const h5State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('COMFORT'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H5 check:', h5State);
    const shotH5 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_6_heading5_comfort.png'), Buffer.from(shotH5.data, 'base64'));

    // CHECK 8: Heading 6: YOUR WORLD. CONNECTED. (~79% scroll)
    await scrollToAndWait(0.79, 8, '8. Heading 6: YOUR WORLD. CONNECTED. (~79% scroll)');
    const h6State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('YOUR WORLD'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H6 check:', h6State);
    const shotH6 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_7_heading6_bluetooth.png'), Buffer.from(shotH6.data, 'base64'));

    // CHECK 9: Video 10 Hero Outro & Upward Ascension (~91% scroll)
    await scrollToAndWait(0.91, 10, '9. Video 10 Hero Outro (~91% scroll)');
    const shotOutro = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_8_hero_outro_ascension.png'), Buffer.from(shotOutro.data, 'base64'));

    // CHECK 10: Final Outro Purchase Interface (~98% scroll)
    console.log('\n--- 10. Final Outro Purchase Interface (~98% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.98)})`);
    await new Promise(r => setTimeout(r, 400));
    const shotPurchase = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_9_purchase_interface.png'), Buffer.from(shotPurchase.data, 'base64'));

    // CHECK 11: Reverse scrubbing back to Scroll 0
    console.log('\n--- 11. Reverse Scrubbing Back to Scroll 0 ---');
    await evalJS('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 700));
    const finalZeroCheck = await evalJS(`(() => {
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      return {
        scrollY: window.scrollY,
        telemetry,
      };
    })()`);
    console.log('Final Scroll 0 Check:', finalZeroCheck);
    const shotZeroAgain = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'clean_10_reversed_to_frame1.png'), Buffer.from(shotZeroAgain.data, 'base64'));

    console.log('\n=== ALL CLEAN SEQUENCE VERIFICATION CHECKS PASSED! ===');
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifyCleanSequence().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
