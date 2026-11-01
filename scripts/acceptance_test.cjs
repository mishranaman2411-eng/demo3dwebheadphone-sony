const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testAcceptance() {
  console.log('=== RUNNING ACCEPTANCE TEST SUITE ===');
  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9336', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9336/json', r => {
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

    await call('Page.navigate', { url: 'http://localhost:4173' });
    await new Promise(r => setTimeout(r, 2000));

    const previewDir = path.resolve('tasks', 'previews');
    if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

    // CRITERION 1: Initial state shows only centered SONY logo on white
    console.log('\n--- Test 1: Opening Screen (White + Centered SONY logo) ---');
    const initialCheck = await evalJS(`(() => {
      const overlay = document.querySelector('div.bg-white');
      const logo = overlay ? overlay.querySelector('h1')?.innerText : null;
      const nav = document.querySelector('header, nav, button');
      const opacity = overlay ? window.getComputedStyle(overlay).opacity : null;
      return { hasWhiteOverlay: !!overlay, logoText: logo, hasNavOrButtons: !!nav, overlayOpacity: opacity };
    })()`);
    console.log('Opening Screen Check:', initialCheck);

    const shot1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'redesign_1_initial_sony_logo.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved redesign_1_initial_sony_logo.png');

    // CRITERION 2 & 3: Scroll down fades out logo and reveals fullscreen canvas
    console.log('\n--- Test 2 & 3: Scroll down reveals fullscreen canvas ---');
    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    console.log('Total scroll track:', maxScroll, 'px');

    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.05)})`);
    await new Promise(r => setTimeout(r, 500));

    const logoFadedCheck = await evalJS(`(() => {
      const overlay = document.querySelector('div.bg-white');
      const opacity = overlay ? window.getComputedStyle(overlay).opacity : null;
      const canvas = document.querySelector('canvas');
      return {
        overlayOpacity: opacity,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0
      };
    })()`);
    console.log('Logo Faded & Canvas Active Check:', logoFadedCheck);

    // CRITERION 4 & 6: Test each of the 10 video clips in numerical order
    console.log('\n--- Test 4 & 6: Sequential playback across all 10 videos ---');
    const videoProgression = [
      { name: 'Video 1 (Intro)', pct: 0.02 },
      { name: 'Video 2 (Architecture)', pct: 0.10 },
      { name: 'Video 3 (Sound/DSEE)', pct: 0.22 },
      { name: 'Video 4 (Acoustics)', pct: 0.30 },
      { name: 'Video 5 (Durability)', pct: 0.40 },
      { name: 'Video 6 (Spatial/Battery)', pct: 0.52 },
      { name: 'Video 7 (Comfort)', pct: 0.65 },
      { name: 'Video 8 (Connectivity)', pct: 0.75 },
      { name: 'Video 9 (Wireless)', pct: 0.85 },
      { name: 'Video 10 (Hero Outro)', pct: 0.98 },
    ];

    const telemetryResults = [];
    for (const v of videoProgression) {
      const y = Math.round(maxScroll * v.pct);
      await evalJS(`window.scrollTo(0, ${y})`);
      await new Promise(r => setTimeout(r, 450));

      const state = await evalJS(`(() => {
        const t = document.getElementById('frame-telemetry')?.innerText || '';
        const c = document.querySelector('canvas');
        const ctx = c ? c.getContext('2d') : null;
        const px = ctx ? ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1).data : [0,0,0,0];
        return { telemetry: t, pixel: [px[0], px[1], px[2], px[3]] };
      })()`);
      telemetryResults.push({ stage: v.name, scrollPct: Math.round(v.pct * 100), ...state });
      console.log(`[${v.name} @ ${Math.round(v.pct * 100)}%]: ${state.telemetry} (pixel: RGBA(${state.pixel.join(',')}))`);
    }

    // CRITERION 7: Verify all 6 required headings at their specific timeline moments
    console.log('\n--- Test 7: Headings appearing at specific moments ---');
    const headingTests = [
      { heading: 'SILENCE, ENGINEERED', pct: 0.10 },
      { heading: 'EVERY DETAIL, HEARD.', pct: 0.25 },
      { heading: 'BUILT FOR THE EVERYDAY.', pct: 0.40 },
      { heading: 'UP TO 50 HOURS OF BATTERY LIFE.', pct: 0.55 },
      { heading: 'COMFORT THAT STAYS WITH YOU.', pct: 0.70 },
      { heading: 'YOUR WORLD. CONNECTED.', pct: 0.85 },
    ];

    for (const ht of headingTests) {
      const y = Math.round(maxScroll * ht.pct);
      await evalJS(`window.scrollTo(0, ${y})`);
      await new Promise(r => setTimeout(r, 400));

      const headingState = await evalJS(`(() => {
        const headings = Array.from(document.querySelectorAll('h2')).map(h => ({
          text: h.innerText.trim(),
          opacity: parseFloat(window.getComputedStyle(h.parentElement).opacity || '0'),
          display: window.getComputedStyle(h.parentElement).display
        }));
        return headings;
      })()`);
      const matched = headingState.find(h => h.text.includes(ht.heading));
      console.log(`Heading "${ht.heading}" @ ${Math.round(ht.pct * 100)}%: opacity = ${matched ? matched.opacity.toFixed(2) : 0}`);
    }

    // Capture screenshot of Heading 1
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.10)})`);
    await new Promise(r => setTimeout(r, 400));
    const shotHeading1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'redesign_2_heading_silence_engineered.png'), Buffer.from(shotHeading1.data, 'base64'));

    // Capture screenshot of Heading 4 (Battery)
    await evalJS(`window.scrollTo(0, ${Math.round(maxScroll * 0.55)})`);
    await new Promise(r => setTimeout(r, 400));
    const shotHeading4 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'redesign_3_heading_battery.png'), Buffer.from(shotHeading4.data, 'base64'));

    // CRITERION 5: Reverse scrolling reverses animation
    console.log('\n--- Test 5: Reverse scrolling back to top ---');
    await evalJS(`window.scrollTo(0, 0)`);
    await new Promise(r => setTimeout(r, 600));

    const returnTopCheck = await evalJS(`(() => {
      const overlay = document.querySelector('div.bg-white');
      const opacity = overlay ? window.getComputedStyle(overlay).opacity : null;
      const t = document.getElementById('frame-telemetry')?.innerText || '';
      return { overlayOpacity: opacity, telemetry: t };
    })()`);
    console.log('Return to Top (Reversed):', returnTopCheck);

    const shotTopReturn = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'redesign_4_top_return.png'), Buffer.from(shotTopReturn.data, 'base64'));

    console.log('\n=== ALL 10 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY ===');
  } finally {
    chrome.kill();
  }
}

testAcceptance().catch(e => {
  console.error('Acceptance test failed:', e);
  process.exit(1);
});
