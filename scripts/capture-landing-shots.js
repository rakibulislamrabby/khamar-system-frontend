const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../assets/images/landing');
const EMAIL = process.argv[2];
const PASSWORD = process.argv[3] || 'secure123';

fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=9333',
    '--user-data-dir=/tmp/khamar-shot-chrome',
    '--window-size=390,844',
    'http://localhost:8081/login',
  ],
  { stdio: 'ignore' }
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForDebug() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9333/json/list');
      const pages = await res.json();
      const page = pages.find((item) => String(item.url || '').includes('8081'));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // chrome still starting
    }
    await sleep(250);
  }
  throw new Error('Chrome debug port did not open');
}

async function main() {
  const wsUrl = await waitForDebug();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });

  function send(method, params = {}) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout ${method}`)), 20000);
      pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return result.result?.value;
  }

  async function waitFor(text, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const body = await evalJs('document.body ? document.body.innerText : ""');
      if (typeof body === 'string' && body.includes(text)) return body;
      await sleep(300);
    }
    const body = await evalJs('document.body ? document.body.innerText.slice(0,400) : ""');
    throw new Error(`Timed out waiting for "${text}". Body: ${body}`);
  }

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: 'http://localhost:8081/login' });
  await waitFor('পাসওয়ার্ড');

  await evalJs(`(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const inputs = [...document.querySelectorAll('input')];
    set.call(inputs[0], ${JSON.stringify(EMAIL)});
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    set.call(inputs[1], ${JSON.stringify(PASSWORD)});
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    const button = [...document.querySelectorAll('div,button')].find((el) => el.textContent.trim() === 'সাইন ইন' && el.children.length === 0);
    (button || document.querySelector('[role="button"]')).click();
    return inputs.length;
  })()`);

  await waitFor('Karim');

  async function shot(name) {
    const image = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(image.data, 'base64'));
    console.log('saved', name);
  }

  await shot('home.png');

  async function openTab(label) {
    await evalJs(`(() => {
      const el = [...document.querySelectorAll('div,span,a')].find((node) => node.textContent.trim() === ${JSON.stringify(label)} && node.children.length === 0);
      if (!el) throw new Error('tab missing');
      el.click();
      return true;
    })()`);
    await sleep(800);
  }

  await openTab('পশুপাখি');
  await waitFor('পশুপাখি');
  await shot('livestock.png');

  await openTab('বিক্রি');
  await waitFor('বিক্রি');
  await shot('sell.png');

  await openTab('হিসাব');
  await waitFor('হিসাব');
  await shot('hisab.png');

  ws.close();
  chrome.kill();
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
