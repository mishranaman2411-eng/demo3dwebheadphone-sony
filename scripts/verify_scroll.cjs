const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function run() {
  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=9335', '--disable-gpu', '--no-sandbox', 'about:blank']
  );

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9335/json', r => {
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
    // Wait for initial frame to load and draw
    await new Promise(r => setTimeout(r, 2500));

    const hasCanvas = await evalJS('document.querySelector("canvas") !== null');
    console.log('Canvas element exists:', hasCanvas);

    const canvasSize = await evalJS('(() => { const c = document.querySelector("canvas"); return c ? c.width + "x" + c.height : "none"; })()');
    console.log('Canvas size:', canvasSize);

    // Check center pixel at initial load
    const initialPixel = await evalJS(`(() => {
      const c = document.querySelector("canvas");
      if (!c) return "no canvas";
      const ctx = c.getContext("2d");
      const px = ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1).data;
      return "RGBA(" + px[0] + "," + px[1] + "," + px[2] + "," + px[3] + ")";
    })()`);
    console.log('Initial center pixel at scroll 0 (after image load):', initialPixel);

    const maxScroll = await evalJS('document.body.scrollHeight - window.innerHeight');
    console.log('Total scrollable:', maxScroll, 'px');

    // Scroll through 10 positions (one for each chapter range)
    const positions = [0.02, 0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.95];
    const results = [];

    for (const pct of positions) {
      const y = Math.round(maxScroll * pct);
      await evalJS('window.scrollTo(0, ' + y + ')');
      await new Promise(r => setTimeout(r, 600));

      const info = await evalJS(`(() => {
        const c = document.querySelector("canvas");
        if (!c) return "no canvas";
        const ctx = c.getContext("2d");
        const cx = Math.floor(c.width / 2);
        const cy = Math.floor(c.height / 2);
        const px = ctx.getImageData(cx, cy, 1, 1).data;
        const badge = document.getElementById('frame-telemetry')?.innerText || '';
        const navText = document.querySelector('header span.truncate')?.innerText || '';
        return {
          scrollPct: Math.round(${pct} * 100),
          scrollY: ${y},
          badge,
          navChapter: navText,
          pixelCenter: [px[0], px[1], px[2], px[3]]
        };
      })()`);
      results.push(info);
      console.log('Scroll ' + Math.round(pct * 100) + '% -> ' + JSON.stringify(info));
    }

    // Test reverse scroll
    console.log('\n--- Testing reverse scroll back to top ---');
    await evalJS('window.scrollTo(0, 0)');
    await new Promise(r => setTimeout(r, 600));
    const reverseTopInfo = await evalJS(`(() => {
      const c = document.querySelector("canvas");
      const ctx = c.getContext("2d");
      const px = ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1).data;
      const badge = document.getElementById('frame-telemetry')?.innerText || '';
      return { badge, pixelCenter: [px[0], px[1], px[2], px[3]] };
    })()`);
    console.log('Reverse top info:', JSON.stringify(reverseTopInfo));

    // Save screenshots
    const shotTop = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tasks/previews/verify_scroll_top.png', Buffer.from(shotTop.data, 'base64'));

    await evalJS('window.scrollTo(0, ' + Math.round(maxScroll * 0.5) + ')');
    await new Promise(r => setTimeout(r, 600));
    const shotMid = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tasks/previews/verify_scroll_mid.png', Buffer.from(shotMid.data, 'base64'));

    await evalJS('window.scrollTo(0, ' + Math.round(maxScroll * 0.95) + ')');
    await new Promise(r => setTimeout(r, 600));
    const shotEnd = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tasks/previews/verify_scroll_end.png', Buffer.from(shotEnd.data, 'base64'));

    console.log('\nSaved verification screenshots to tasks/previews/');
    console.log('All verification checks finished.');
  } finally {
    chrome.kill();
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
