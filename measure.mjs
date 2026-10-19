// Taps the same elements on both sites under Pixel 7 emulation + 4x CPU throttling and
// reports per-tap event durations (Event Timing API) and SubscribedButtonClick requests.
import puppeteer, { KnownDevices } from "puppeteer-core";

const SITES = { on: "https://pixel-on.dontdielabs.com/", off: "https://pixel-off.dontdielabs.com/" };
const TAPS = [
  ["Read more", ".review:nth-of-type(1) .more"],
  ["gallery image", ".gallery img:nth-child(3)"],
  ["Show details", ".offer:nth-of-type(2) .details"],
  ["Read more #2", ".review:nth-of-type(5) .more"],
];
const RUNS = Number(process.env.RUNS || 5);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  // fbevents.js skips navigator.webdriver browsers, so hide automation like a real visitor.
  args: ["--host-resolver-rules=MAP pixel-on.dontdielabs.com 76.76.21.21, MAP pixel-off.dontdielabs.com 76.76.21.21", "--disable-blink-features=AutomationControlled"],
  ignoreDefaultArgs: ["--enable-automation"],
});

async function visit(url) {
  const page = await browser.newPage();
  await page.emulate(KnownDevices["Pixel 5"]);
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  // The default event buffer only keeps entries >= 104 ms; observe from page start at 16 ms.
  await page.evaluateOnNewDocument(() => {
    window.__ev = [];
    new PerformanceObserver((l) => window.__ev.push(...l.getEntries().filter((e) => e.interactionId).map((e) => e.duration)))
      .observe({ type: "event", durationThreshold: 16, buffered: true });
  });
  // LOCAL=dir serves that dir's on/off index.html at the real URL, to iterate without deploying.
  if (process.env.LOCAL) {
    const { readFileSync } = await import("node:fs");
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      const m = r.url().match(/^https:\/\/pixel-(on|off)\.dontdielabs\.com\/$/);
      if (m) r.respond({ status: 200, contentType: "text/html", body: readFileSync(`${process.env.LOCAL}/${m[1]}/index.html`) });
      else r.continue();
    });
  }
  let sbc = 0;
  page.on("request", (r) => { if (/facebook\.com\/tr/.test(r.url()) && /SubscribedButtonClick/.test(r.url() + (r.postData() || ""))) sbc++; });
  await page.goto(url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const out = {};
  for (const [name, sel] of TAPS) {
    const el = await page.$(sel);
    await el.scrollIntoView();
    await new Promise((r) => setTimeout(r, 300));
    const before = await page.evaluate(() => window.__ev.length);
    await page.tap(sel);
    await new Promise((r) => setTimeout(r, 800));
    out[name] = await page.evaluate((n) => Math.max(0, ...window.__ev.slice(n)), before);
  }
  await page.close();
  return { out, sbc };
}

const res = { on: [], off: [] };
for (let i = 0; i < RUNS; i++) for (const k of ["on", "off"]) res[k].push(await visit(SITES[k]));
await browser.close();

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
console.log(`median of ${RUNS} visits, ms (Event Timing duration, 8 ms granularity)`);
console.log("tap".padEnd(18), "ON".padStart(6), "OFF".padStart(6));
for (const [name] of TAPS) console.log(name.padEnd(18), String(median(res.on.map((r) => r.out[name]))).padStart(6), String(median(res.off.map((r) => r.out[name]))).padStart(6));
console.log("SubscribedButtonClick requests per visit:", "ON", res.on.map((r) => r.sbc).join(","), "| OFF", res.off.map((r) => r.sbc).join(","));
