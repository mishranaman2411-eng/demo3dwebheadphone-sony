const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyTypography() {
  console.log('=== VERIFYING CENTERED CINEMATIC TYPOGRAPHY ===\n');

  const previewDir = path.resolve('tasks', 'previews', 'typography_verification');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9346', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9346/json', r => {
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

    // Desktop Test (1440x900)
    console.log('--- TESTING DESKTOP (1440x900) ---');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });

    await call('Page.navigate', { url: 'http://localhost:4173' });
    await new Promise(r => setTimeout(r, 2500));

    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    console.log(`Desktop maxScroll: ${maxScroll}px`);

    const checkpoints = [
      { fraction: 0.11, heading: 'SILENCE, ENGINEERED', label: '1_silence_desktop' },
      { fraction: 0.25, heading: 'EVERY DETAIL, HEARD.', label: '2_sound_desktop' },
      { fraction: 0.38, heading: 'BUILT FOR THE EVERYDAY.', label: '3_durability_desktop' },
      { fraction: 0.52, heading: 'UP TO 50 HOURS OF BATTERY LIFE.', label: '4_battery_desktop' },
      { fraction: 0.65, heading: 'COMFORT THAT STAYS WITH YOU.', label: '5_comfort_desktop' },
      { fraction: 0.79, heading: 'YOUR WORLD. CONNECTED.', label: '6_bluetooth_desktop' },
    ];

    for (const cp of checkpoints) {
      console.log(`\nVerifying ${cp.heading}...`);
      await evalJS(`window.scrollTo(0, Math.round(${maxScroll} * ${cp.fraction}))`);
      await new Promise(r => setTimeout(r, 400));

      const metrics = await evalJS(`(() => {
        const h2List = Array.from(document.querySelectorAll('h2'));
        const h2 = h2List.find(el => el.innerText.includes('${cp.heading.slice(0, 10)}'));
        if (!h2) return { found: false };
        const h2Rect = h2.getBoundingClientRect();
        const p = h2.nextElementSibling;
        const pRect = p ? p.getBoundingClientRect() : null;
        const container = h2.closest('.fixed');
        const style = window.getComputedStyle(h2);
        const pStyle = p ? window.getComputedStyle(p) : null;
        const viewportCenter = window.innerWidth / 2;
        const h2Center = h2Rect.left + h2Rect.width / 2;
        const pCenter = pRect ? (pRect.left + pRect.width / 2) : 0;
        return {
          found: true,
          text: h2.innerText,
          textAlign: style.textAlign,
          pTextAlign: pStyle ? pStyle.textAlign : null,
          viewportCenter,
          h2Center,
          pCenter,
          h2CenterDelta: Math.abs(h2Center - viewportCenter),
          pCenterDelta: pRect ? Math.abs(pCenter - viewportCenter) : 0,
          h2Width: h2Rect.width,
          pWidth: pRect ? pRect.width : 0,
          opacity: window.getComputedStyle(h2.closest('[style*="display"]')).opacity,
        };
      })()`);

      console.log('Metrics:', metrics);
      if (!metrics.found) {
        throw new Error(`Heading ${cp.heading} not found!`);
      }
      if (metrics.h2CenterDelta > 15) {
        throw new Error(`Heading ${cp.heading} is NOT centered horizontally! Delta: ${metrics.h2CenterDelta}`);
      }
      if (metrics.textAlign !== 'center') {
        throw new Error(`Heading ${cp.heading} text-align is not center! Was: ${metrics.textAlign}`);
      }

      const shot = await call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(previewDir, `${cp.label}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${cp.label}.png`);
    }

    // Mobile Test (390x844 - iPhone 14 / modern smartphone)
    console.log('\n--- TESTING MOBILE (390x844) ---');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    for (const cp of [checkpoints[0], checkpoints[3]]) {
      console.log(`\nVerifying Mobile ${cp.heading}...`);
      await evalJS(`window.scrollTo(0, Math.round(${maxScroll} * ${cp.fraction}))`);
      await new Promise(r => setTimeout(r, 400));

      const mobileMetrics = await evalJS(`(() => {
        const h2List = Array.from(document.querySelectorAll('h2'));
        const h2 = h2List.find(el => el.innerText.includes('${cp.heading.slice(0, 10)}'));
        if (!h2) return { found: false };
        const h2Rect = h2.getBoundingClientRect();
        const viewportCenter = window.innerWidth / 2;
        const h2Center = h2Rect.left + h2Rect.width / 2;
        return {
          found: true,
          viewportWidth: window.innerWidth,
          h2CenterDelta: Math.abs(h2Center - viewportCenter),
          h2Width: h2Rect.width,
          overflow: h2Rect.right > window.innerWidth,
        };
      })()`);

      console.log('Mobile Metrics:', mobileMetrics);
      if (mobileMetrics.h2CenterDelta > 10) {
        throw new Error(`Mobile heading not centered: delta ${mobileMetrics.h2CenterDelta}`);
      }
      if (mobileMetrics.overflow) {
        throw new Error('Mobile heading horizontally overflowing screen!');
      }

      const shot = await call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(previewDir, `${cp.label.replace('desktop', 'mobile')}.png`), Buffer.from(shot.data, 'base64'));
    }

    console.log('\n=== ALL TYPOGRAPHY CENTERING VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } finally {
    ws.close();
    chrome.kill();
  }
}

verifyTypography().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
