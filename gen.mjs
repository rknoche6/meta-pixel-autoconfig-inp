// Generates two identical pages that differ only in fbq("set","autoConfig",false,id).
import { mkdirSync, writeFileSync } from "node:fs";

const SCALE = Number(process.env.SCALE || 1); // multiplies reviews/offers/images
const OUT = process.env.OUT || "sites";

const PIXELS = ["3977812402355412"]; // test pixel with Automatic events on, not linked to any ad account
const names = ["Alex P.", "Sam R.", "Jordan K.", "Taylor M.", "Chris D.", "Morgan L.", "Jamie B.", "Casey W."];
const words = "Comfortable from the first run and the grip holds up on wet rocks. Sizing runs a little small so order half a size up. The upper still looks new after three hundred kilometres and the laces stay tied. Would buy again.".split(" ");
const text = (i, n) => Array.from({ length: n }, (_, j) => words[(i * 7 + j) % words.length]).join(" ");
const img = (i) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220"><rect width="100%" height="100%" fill="hsl(${(i * 37) % 360},45%,55%)"/><text x="50%" y="55%" font-size="28" text-anchor="middle" fill="white" font-family="sans-serif">Photo ${i + 1}</text></svg>`)}`;

const reviews = Array.from({ length: 40 * SCALE }, (_, i) => `
  <article class="review" itemprop="review" itemscope itemtype="https://schema.org/Review">
    <header><strong class="reviewer" itemprop="author">${names[i % names.length]}</strong> <time itemprop="datePublished">2026-09-${String((i % 28) + 1).padStart(2, "0")}</time> <span class="score">${(4 + (i % 10) / 10).toFixed(1)}/5</span></header>
    <h3 itemprop="name">${text(i, 5)}</h3>
    <p class="clamp" itemprop="reviewBody">${text(i, 80)}</p>
    <button class="btn more" type="button">Read more</button>
  </article>`).join("");

const offers = Array.from({ length: 12 * SCALE }, (_, i) => `
  <div class="offer">
    <div><strong>${["Black", "Blue", "Grey", "Orange"][i % 4]} · size ${40 + (i % 6)}</strong><br><span>Ships in ${1 + (i % 4)} days</span></div>
    <div class="price">$${(129 + i * 4).toFixed(2)}</div>
    <button class="btn details" type="button">Show details</button>
    <div class="detail" hidden>${text(i + 3, 60)}</div>
  </div>`).join("");

const jsonld = JSON.stringify({
  "@context": "https://schema.org", "@type": "Product", name: "Ridgeline Trail Runner", brand: { "@type": "Brand", name: "Example Outdoor" }, sku: "RTR-4711",
  aggregateRating: { "@type": "AggregateRating", ratingValue: 4.4, bestRating: 5, reviewCount: 40 * SCALE },
  offers: Array.from({ length: 12 * SCALE }, (_, i) => ({ "@type": "Offer", sku: "RTR-4711-" + (i + 1), price: (129 + i * 4).toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock" })),
  review: Array.from({ length: 40 * SCALE }, (_, i) => ({ "@type": "Review", name: text(i, 5), author: { "@type": "Person", name: names[i % names.length] }, datePublished: "2026-09-" + String((i % 28) + 1).padStart(2, "0"), reviewBody: text(i, 80) })),
});
const breadcrumbs = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: ["Shoes", "Running", "Trail", "Ridgeline Trail Runner"].map((n, i) => ({ "@type": "ListItem", position: i + 1, name: n })) });

const gallery = Array.from({ length: 24 * SCALE }, (_, i) => `<img src="${img(i)}" alt="Product photo ${i + 1}" width="320" height="220">`).join("");

function page(autoConfigOff) {
  const label = autoConfigOff ? "autoConfig OFF" : "autoConfig ON (default)";
  const setLines = autoConfigOff ? PIXELS.map((id) => `fbq("set","autoConfig",false,"${id}");`).join("\n") : "";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pixel INP Test – ${autoConfigOff ? "OFF" : "ON"}</title>
<meta name="description" content="Test page: Ridgeline Trail Runner, reviews, variants and prices.">
<meta name="keywords" content="trail running, shoes, reviews">
<style>
:root{--bg:#f6f5f2;--fg:#1d1d1f;--card:#fff;--muted:#666;--accent:${autoConfigOff ? "#0a7d3b" : "#b3261e"};--line:#e2e0da}
@media (prefers-color-scheme:dark){:root{--bg:#161616;--fg:#eee;--card:#222;--muted:#aaa;--line:#333}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:16px 16px 180px}
.badge{display:inline-block;background:var(--accent);color:#fff;padding:4px 10px;border-radius:6px;font-weight:600}
nav.crumbs{color:var(--muted);font-size:14px;margin:8px 0}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.gallery img{width:100%;height:auto;border-radius:6px;cursor:pointer}
.offer,.review{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;margin:10px 0}
.offer{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.offer .btn,.offer .detail{grid-column:1/-1}
.price{font-weight:700;font-size:18px}.review h3{margin:6px 0;font-size:16px}
.clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0}.open .clamp{display:block}
.btn{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
#hud{position:fixed;left:0;right:0;bottom:0;background:#111;color:#eee;font:13px/1.4 ui-monospace,monospace;padding:10px 16px;max-height:170px;overflow:auto;z-index:9}
#hud b{color:#fff}#hud .bad{color:#ff8a80}#hud .ok{color:#9be29b}
</style>
<script>
// Count SubscribedButtonClick. Small events go out as GET image requests (seen via Resource Timing below);
// large ones, like these with the scraped JSON-LD, are POSTed by submitting a hidden form, which Resource Timing misses.
window.__sbc=0;
(function(submit){HTMLFormElement.prototype.submit=function(){var ev=this.querySelector("[name=ev]");
  if(String(this.action).indexOf("facebook.com/tr")>=0&&ev&&ev.value==="SubscribedButtonClick")window.__sbcHit();return submit.apply(this,arguments);};})(HTMLFormElement.prototype.submit);
window.__sbcHit=function(){__sbc++;var el=document.getElementById("sbc");if(el)el.textContent=__sbc;};
</script>
<!-- Meta Pixel. The ONLY difference between the two test sites is the autoConfig line. -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
${setLines}
${PIXELS.map((id) => `fbq("init","${id}");`).join("\n")}
fbq("track","PageView");
fbq("track","ViewContent",{content_type:"product",content_ids:["RTR-4711"]});
</script>
<script type="application/ld+json">${jsonld}</script>
<script type="application/ld+json">${breadcrumbs}</script>
</head><body><main itemscope itemtype="https://schema.org/Product">
<p><span class="badge">${label}</span> · compare: <a href="https://${autoConfigOff ? "pixel-on" : "pixel-off"}.dontdielabs.com/">${autoConfigOff ? "autoConfig ON" : "autoConfig OFF"}</a></p>
<nav class="crumbs"><a href="#">Shoes</a> › <a href="#">Running</a> › <a href="#">Trail</a> › Ridgeline Trail Runner</nav>
<h1>Ridgeline Trail Runner</h1>
<p>Tap buttons, links and images below. The black bar shows each interaction's duration (Event Timing API) and the page INP (web-vitals). For realistic numbers use a mid-range Android phone, or Chrome DevTools with 4× CPU throttling.</p>
<section class="gallery">${gallery}</section>
<h2>Variants</h2>${offers}
<h2>Reviews</h2>${reviews}
</main>
<div id="hud"><b>${label}</b> · INP: <b id="inp">–</b> · SubscribedButtonClick sent: <b id="sbc">0</b> · Pixel: <b id="px">loading…</b><div id="log"></div></div>
<script>
// Page's own handlers: deliberately cheap so the pixel's cost is what you measure.
document.addEventListener("click",function(e){
  var m=e.target.closest(".more"); if(m){var r=m.closest(".review");r.classList.toggle("open");m.textContent=r.classList.contains("open")?"Show less":"Read more";}
  var d=e.target.closest(".details"); if(d){var x=d.nextElementSibling;x.hidden=!x.hidden;}
});
// Per-interaction durations.
var log=document.getElementById("log");
function cls(ms){return ms>200?"bad":"ok";}
new PerformanceObserver(function(list){list.getEntries().forEach(function(en){
  if(!en.interactionId||en.name!=="pointerup"&&en.name!=="click")return;
  if(en.name!=="click")return;
  var t=en.target,lbl=t?(t.tagName.toLowerCase()+(t.className?"."+String(t.className).split(" ").join("."):"")+(t.textContent?' "'+t.textContent.trim().slice(0,20)+'"':"")):"?";
  var row=document.createElement("div");row.innerHTML='<span class="'+cls(en.duration)+'">'+Math.round(en.duration)+' ms</span> '+lbl.replace(/</g,"&lt;");
  log.prepend(row);
});}).observe({type:"event",durationThreshold:16,buffered:true});
// SubscribedButtonClick sent as GET requests.
new PerformanceObserver(function(l){l.getEntries().forEach(function(r){if(/facebook\\.com\\/tr/.test(r.name)&&/ev=SubscribedButtonClick/.test(r.name))__sbcHit();});}).observe({type:"resource",buffered:true});
</script>
<script>
// fbevents.js replaces the "2.0" stub version once it runs. If it never does, an ad/tracking blocker stopped it
// and this page behaves like the autoConfig-off page.
addEventListener("load",function(){setTimeout(function(){var px=document.getElementById("px");
  if(window.fbq&&fbq.version&&fbq.version!=="2.0"){px.textContent="loaded "+fbq.version;px.className="ok";}
  else{px.textContent="BLOCKED by your browser (ad/tracking blocker?) – allow connect.facebook.net and reload";px.className="bad";}
},3000);});
</script>
<script src="https://unpkg.com/web-vitals@4.2.4/dist/web-vitals.iife.js"></script>
<script>webVitals.onINP(function(m){var el=document.getElementById("inp");el.textContent=Math.round(m.value)+" ms";el.className=m.value>200?"bad":"ok";},{reportAllChanges:true});</script>
</body></html>`;
}

for (const [dir, off] of [["on", false], ["off", true]]) {
  mkdirSync(`${OUT}/${dir}`, { recursive: true });
  writeFileSync(`${OUT}/${dir}/index.html`, page(off));
}
