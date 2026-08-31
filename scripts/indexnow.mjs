#!/usr/bin/env node
// IndexNow submission — generic version.
// Finds the key file in public/ (32-hex .txt), reads the sitemap (live, fallback local),
// POSTs the full URL list to https://api.indexnow.org/indexnow.
//
// Setup:  openssl rand -hex 16   -> create public/<key>.txt containing exactly the key
//         deploy the site so the key file is LIVE before submitting
// Usage:  node scripts/indexnow.mjs            (submit all sitemap URLs)
//         node scripts/indexnow.mjs <url...>   (submit specific URLs)
//
// Gotcha: HTTP 403 SiteVerificationNotCompleted right after deploy = propagation lag.
//         Wait 60s and retry once.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const HOST = process.env.INDEXNOW_HOST ?? new URL(readFileSync(resolve('public/sitemap.xml'), 'utf8').match(/<loc>(https?:\/\/[^/<]+)/)[1]).host;

// --- locate key + key file ---
const keyFile = readdirSync(resolve('public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('No IndexNow key file found in public/ (expected a 32-hex .txt). Run: openssl rand -hex 16 > public/<key>.txt');
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, '');
const keyLocation = `https://${HOST}/${keyFile}`;

// --- collect URLs ---
let urls = process.argv.slice(2);
if (urls.length === 0) {
  let xml;
  try {
    const res = await fetch(`https://${HOST}/sitemap.xml`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch {
    console.warn('Live sitemap fetch failed; falling back to local public/sitemap.xml');
    xml = readFileSync(resolve('public/sitemap.xml'), 'utf8');
  }
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
if (urls.length === 0) {
  console.error('No URLs to submit.');
  process.exit(1);
}

// --- sanity: key file must serve before submitting ---
const keyCheck = await fetch(keyLocation);
const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : '';
if (keyBody !== key) {
  console.error(`Key file check failed: ${keyLocation} -> HTTP ${keyCheck.status}, body != key. Deploy first / wait for propagation.`);
  process.exit(1);
}

// --- submit ---
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation, urlList: urls }),
});
const text = await res.text();
console.log(`IndexNow: HTTP ${res.status} ${text}`.trim());
console.log(`Submitted ${urls.length} URLs for ${HOST} (key ${key.slice(0, 8)}…)`);
// 200 = accepted; 202 = accepted pending key validation; 403 = retry after ~60s
process.exit(res.ok || res.status === 202 ? 0 : 1);
