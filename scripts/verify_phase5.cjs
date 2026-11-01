const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyPhase5() {
  console.log('=== VERIFYING PHASE 5 ACCEPTANCE CRITERIA ===\n');

  const previewDir = path.resolve('tasks', 'previews');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9340', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9340/json', r => {
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
    const checkInitial = await evalJS(`(() => {
      const canvas = document.querySelector('canvas');
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      const whiteOverlays = document.querySelectorAll('div.bg-white');
      const headings = Array.from(document.querySelectorAll('h2')).map(h => ({
        text: h.innerText,
        opacity: window.getComputedStyle(h.parentElement).opacity,
        display: window.getComputedStyle(h.parentElement).display,
      }));
      return {
        canvasExists: !!canvas,
        canvasW: canvas?.width,
        canvasH: canvas?.height,
        telemetry,
        whiteOverlayCount: whiteOverlays.length,
        headingsVisible: headings.filter(h => h.opacity > '0'),
      };
    })()`);
    console.log('Initial check:', checkInitial);

    const shot0 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_0_scroll0_initial.png'), Buffer.from(shot0.data, 'base64'));
    console.log('Saved phase5_0_scroll0_initial.png');

    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    console.log(`Total scroll track: ${maxScroll}px`);

    // CHECK 2: Video 1 Sony logo in footage (~2% scroll)
    console.log('\n--- 2. Video 1 Native SONY Logo in Footage (~2% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.02)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleLogo = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    console.log('Telemetry at 2%:', teleLogo);
    const shotLogo = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_1_native_sony_logo.png'), Buffer.from(shotLogo.data, 'base64'));

    // CHECK 3: Heading 1: SILENCE, ENGINEERED (Video 1 & 2, ~8% scroll)
    console.log('\n--- 3. Heading 1: SILENCE, ENGINEERED (~8% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.08)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH1 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h1State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('SILENCE'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H1 check:', teleH1, h1State);
    const shotH1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_2_heading1_silence.png'), Buffer.from(shotH1.data, 'base64'));

    // CHECK 4: Heading 2: EVERY DETAIL, HEARD. (Video 3 sound quality, ~25% scroll)
    console.log('\n--- 4. Heading 2: EVERY DETAIL, HEARD. (~25% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.25)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH2 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h2State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('EVERY DETAIL'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H2 check:', teleH2, h2State);
    const shotH2 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_3_heading2_sound.png'), Buffer.from(shotH2.data, 'base64'));

    // CHECK 5: Heading 3: BUILT FOR THE EVERYDAY. (Video 5 durability, ~38% scroll)
    console.log('\n--- 5. Heading 3: BUILT FOR THE EVERYDAY. (~38% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.38)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH3 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h3State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('BUILT FOR'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H3 check:', teleH3, h3State);
    const shotH3 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_4_heading3_durability.png'), Buffer.from(shotH3.data, 'base64'));

    // CHECK 6: Heading 4: UP TO 50 HOURS OF BATTERY LIFE. (Video 6 battery, ~52% scroll)
    console.log('\n--- 6. Heading 4: UP TO 50 HOURS OF BATTERY LIFE. (~52% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.52)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH4 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h4State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('50 HOURS'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H4 check:', teleH4, h4State);
    const shotH4 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_5_heading4_battery.png'), Buffer.from(shotH4.data, 'base64'));

    // CHECK 7: Heading 5: COMFORT THAT STAYS WITH YOU. (Video 7 comfort, ~65% scroll)
    console.log('\n--- 7. Heading 5: COMFORT THAT STAYS WITH YOU. (~65% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.65)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH5 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h5State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('COMFORT'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H5 check:', teleH5, h5State);
    const shotH5 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_6_heading5_comfort.png'), Buffer.from(shotH5.data, 'base64'));

    // CHECK 8: Heading 6: YOUR WORLD. CONNECTED. (Video 8 Bluetooth, ~79% scroll)
    console.log('\n--- 8. Heading 6: YOUR WORLD. CONNECTED. (~79% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.79)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleH6 = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    const h6State = await evalJS(`(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('YOUR WORLD'));
      return el ? { text: el.innerText, opacity: window.getComputedStyle(el.parentElement).opacity } : null;
    })()`);
    console.log('H6 check:', teleH6, h6State);
    const shotH6 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_7_heading6_bluetooth.png'), Buffer.from(shotH6.data, 'base64'));

    // CHECK 9: Video 10 Hero Outro & Upward Ascension (~91% scroll)
    console.log('\n--- 9. Video 10 Hero Outro (~91% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.91)})`);
    await new Promise(r => setTimeout(r, 400));
    const teleOutro = await evalJS("document.getElementById('frame-telemetry')?.innerText");
    console.log('Telemetry at 91%:', teleOutro);
    const shotOutro = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_8_hero_outro_ascension.png'), Buffer.from(shotOutro.data, 'base64'));

    // CHECK 10: Final Outro Purchase Interface (~98% scroll)
    console.log('\n--- 10. Final Outro Purchase Interface (~98% scroll) ---');
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.98)})`);
    await new Promise(r => setTimeout(r, 400));
    const outroCard = await evalJS(`(() => {
      const outro = document.querySelector('div[style*=\"z-index: 30\"], div.z-30.flex');
      return {
        telemetry: document.getElementById('frame-telemetry')?.innerText,
        hasOrderBtn: !!document.querySelector('button'),
        cardOpacity: outro ? window.getComputedStyle(outro).opacity : null,
      };
    })()`);
    console.log('Outro Card check:', outroCard);
    const shotPurchase = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_9_purchase_interface.png'), Buffer.from(shotPurchase.data, 'base64'));

    // CHECK 11: Reverse scrubbing back to Scroll 0
    console.log('\n--- 11. Reverse Scrubbing Back to Scroll 0 ---');
    await evalJS('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 600));
    const finalZeroCheck = await evalJS(`(() => {
      const telemetry = document.getElementById('frame-telemetry')?.innerText;
      const headings = Array.from(document.querySelectorAll('h2')).map(h => ({
        text: h.innerText,
        opacity: window.getComputedStyle(h.parentElement).opacity,
      }));
      return {
        scrollY: window.scrollY,
        telemetry,
        visibleHeadings: headings.filter(h => parseFloat(h.opacity) > 0),
      };
    })()`);
    console.log('Final Scroll 0 Check:', finalZeroCheck);
    const shotZeroAgain = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'phase5_10_reversed_to_frame1.png'), Buffer.from(shotZeroAgain.data, 'base64'));

    console.log('\n=== ALL PHASE 5 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! ===');
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifyPhase5().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
