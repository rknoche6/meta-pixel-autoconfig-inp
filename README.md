# Meta Pixel autoConfig vs INP

With the default `autoConfig`, the Meta Pixel (fbevents.js) adds a document click listener. On every tap of a button or link it collects the element's text and the page's schema.org data (JSON-LD and microdata) and sends a `SubscribedButtonClick` event. That work runs synchronously inside the click, so it counts toward [INP](https://web.dev/articles/inp).

This repo contains two pages that are identical except for one line, plus a script that taps both and measures each tap.

```js
fbq('set', 'autoConfig', false, 'YOUR_PIXEL_ID'); // before init
fbq('init', 'YOUR_PIXEL_ID');
```

Live:

- autoConfig on: https://pixel-on.dontdielabs.com
- autoConfig off: https://pixel-off.dontdielabs.com

The bar at the bottom of each page shows per-tap duration (Event Timing API), page INP ([web-vitals](https://github.com/GoogleChrome/web-vitals)) the number of `SubscribedButtonClick` requests sent, and whether the pixel loaded. If it says "BLOCKED", an ad or tracking blocker stopped fbevents.js; allow `connect.facebook.net` and reload, otherwise both pages behave the same.

## Results

Headless Chrome, mobile emulation, 4× CPU throttling, median of 7 visits per page:

| tap | autoConfig on | autoConfig off |
|---|---|---|
| button ("Read more") | 120 ms | 40 ms |
| button ("Show details") | 104 ms | 40 ms |
| plain `<img>` | 32 ms | 32 ms |

`SubscribedButtonClick` requests per visit: 3–4 with autoConfig on, 0 with it off.

The cost scales with the page's structured data. With no JSON-LD or microdata, both pages measured 40 ms. With the default page (a product with 40 reviews and 12 offers in JSON-LD) you get the gap above. At `SCALE=5` the "on" page reached about 240 ms per tap.

Numbers depend on the machine. Compare on and off on the same machine rather than reading the absolute values.

## Run it

Requires Node 18+ and Google Chrome.

```sh
npm install
npm run build              # writes sites/on and sites/off
npm run measure            # measures the live sites, 5 visits each
RUNS=7 npm run measure
```

Options:

- `SCALE=n npm run build` multiplies reviews, offers and gallery images.
- `OUT=dir` writes the pages to another directory.
- `LOCAL=dir npm run measure` serves `dir/on` and `dir/off` at the live URLs through request interception, so you can test a local build without deploying.

To test with your own pixel, change `PIXELS` in `gen.mjs`. The pixel needs Automatic events enabled; a made-up ID doesn't load the click-tracking plugin, and both pages will measure the same.

`measure.mjs` hides `navigator.webdriver` and uses a phone user agent, because the pixel sends no events from automated or `HeadlessChrome` browsers.

## What turning it off costs

PageView, ViewContent and your own `fbq('track', …)` calls keep working. You lose `SubscribedButtonClick` and the automatic Microdata event, so check that no Meta audiences or custom conversions depend on them.
