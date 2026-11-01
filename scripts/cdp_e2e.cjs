const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
    this.consoleErrors = [];
    this.pageErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(JSON.stringify(msg.error)));
          else cb.resolve(msg.result);
        } else if (msg.method) {
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            this.consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
          } else if (msg.method === 'Runtime.exceptionThrown') {
            this.pageErrors.push(msg.params.exceptionDetails.text);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result.value;
  }
}

async function run() {
  console.log('--- Starting Native Chrome CDP E2E Automation ---');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json', (res) => {
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => resolve(JSON.parse(buf)));
      }).on('error', reject);
    });

    const pageTarget = list.find(t => t.type === 'page');
    console.log('Connected to target page:', pageTarget.title);

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    const previewDir = path.resolve('tasks', 'previews');
    if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

    // Test 1: Desktop Viewport 1440x900
    console.log('\n========================================');
    console.log('Testing Desktop 1440x900 Viewport...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await client.send('Page.navigate', { url: 'http://localhost:4173' });
    await new Promise(r => setTimeout(r, 2000));

    const pageTitle = await client.eval('document.title');
    console.log('Page Title:', pageTitle);

    const canvasInfo = await client.eval(`(() => {
      const c = document.querySelector('canvas');
      return c ? { width: c.width, height: c.height, clientW: c.clientWidth, clientH: c.clientHeight } : null;
    })()`);
    console.log('Initial Canvas Info:', canvasInfo);

    // Verify side indicator dots for all 10 chapters
    const dotCount = await client.eval(`document.querySelectorAll('.hidden.lg\\\\:flex button').length`);
    console.log(`Side chapter scrub indicators detected: ${dotCount} (Expected: 10)`);

    // Forward scroll simulation across all chapters
    console.log('Simulating forward scroll across all 10 chapters...');
    const maxScroll = await client.eval(`document.body.scrollHeight - window.innerHeight`);
    console.log(`Total scrollable height: ${maxScroll}px`);

    const scrollSteps = 20;
    const scrollLog = [];

    for (let step = 1; step <= scrollSteps; step++) {
      const scrollY = Math.round((step / scrollSteps) * maxScroll);
      await client.eval(`window.scrollTo(0, ${scrollY})`);
      await new Promise(r => setTimeout(r, 150));

      if (step % 5 === 0 || step === scrollSteps) {
        const state = await client.eval(`(() => {
          const navText = document.querySelector('header span.truncate')?.innerText || '';
          const frameBadge = document.querySelector('.font-mono.tracking-wider.text-white\\\\/50')?.innerText || '';
          const activeIndex = document.querySelector('header .text-black.font-semibold, header .text-\\\\[\\\\#A9C8FF\\\\].font-semibold')?.innerText || '';
          return { scrollY: window.scrollY, activeIndex, navText, frameBadge };
        })()`);
        scrollLog.push(state);
      }
    }
    console.log('Forward scroll checkpoints:', scrollLog);

    // Capture screenshot at end of scroll (Hero Outro / Purchase Transition)
    const shotData1 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'desktop_scrolled_end.png'), Buffer.from(shotData1.data, 'base64'));
    console.log('Saved desktop_scrolled_end.png');

    // Reverse scroll simulation back to chapter 1
    console.log('\nSimulating reverse scroll back up to Chapter 1...');
    for (let step = scrollSteps; step >= 0; step -= 2) {
      const scrollY = Math.round((step / scrollSteps) * maxScroll);
      await client.eval(`window.scrollTo(0, ${scrollY})`);
      await new Promise(r => setTimeout(r, 100));
    }

    const startState = await client.eval(`(() => {
      const navText = document.querySelector('header span.truncate')?.innerText || '';
      const activeIndex = document.querySelector('header .text-black.font-semibold, header .text-\\\\[\\\\#A9C8FF\\\\].font-semibold')?.innerText || '';
      return { scrollY: window.scrollY, activeIndex, navText };
    })()`);
    console.log('Reverse scroll returned state:', startState);

    const shotData2 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'desktop_canvas_intro.png'), Buffer.from(shotData2.data, 'base64'));
    console.log('Saved desktop_canvas_intro.png');

    // Test 2: Mobile Viewport 390x844
    console.log('\n========================================');
    console.log('Testing Mobile 390x844 Viewport...');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const mobileCanvasInfo = await client.eval(`(() => {
      const c = document.querySelector('canvas');
      return c ? { width: c.width, height: c.height, clientW: c.clientWidth, clientH: c.clientHeight } : null;
    })()`);
    console.log('Mobile Canvas Info:', mobileCanvasInfo);

    // Check for horizontal overflow on mobile
    const overflowCheck = await client.eval(`(() => {
      return {
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()`);
    console.log('Mobile Horizontal Overflow Check:', overflowCheck);

    const shotData3 = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(previewDir, 'mobile_canvas_intro.png'), Buffer.from(shotData3.data, 'base64'));
    console.log('Saved mobile_canvas_intro.png');

    // Error summary
    console.log('\n========================================');
    console.log(`Console Errors: ${client.consoleErrors.length}`);
    if (client.consoleErrors.length > 0) console.log(client.consoleErrors);
    console.log(`Page Exceptions: ${client.pageErrors.length}`);
    if (client.pageErrors.length > 0) console.log(client.pageErrors);

    if (client.consoleErrors.length === 0 && client.pageErrors.length === 0 && !overflowCheck.hasOverflow) {
      console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
    } else {
      console.error('⚠️ Verification warnings or issues encountered.');
    }

  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Fatal error during CDP test:', err);
  process.exit(1);
});
