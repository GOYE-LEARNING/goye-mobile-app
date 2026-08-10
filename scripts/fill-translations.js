#!/usr/bin/env node
// scripts/fill-translations.js
//
// Run after adding new keys to locales/en.json:
//   node scripts/fill-translations.js
//
// Walks en.json and, for every key missing (or identical-to-English, which
// usually means "never translated") in fr/ha/yo/ig/sw, machine-translates it
// via the same unauthenticated Google Translate endpoint the web app's
// app/api/translate/route.ts already uses, and writes the result back into
// that locale file — preserving key order and any manually-authored entries
// that already differ from English.
//
// This does NOT overwrite an existing translation that differs from the
// English source, so re-running it after a human edits a locale file by hand
// is always safe.
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const TARGETS = { fr: 'fr', ha: 'ha', yo: 'yo', ig: 'ig', sw: 'sw' };

// i18next interpolation placeholders ({{name}}) must survive translation
// byte-for-byte — Google Translate happily translates the WORD inside the
// braces too ({{name}} -> {{orukọ}} in Yoruba, {{jina}} in Swahili), which
// silently breaks interpolation forever: i18next looks for the literal key
// "name", finds "orukọ" instead, and the placeholder never gets replaced —
// the raw "{{orukọ}}" reaches the screen verbatim. Swap each placeholder for
// a token translate won't touch, then restore it after.
function protectPlaceholders(text) {
  const placeholders = [];
  const protectedText = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match) => {
    placeholders.push(match);
    return `⟦${placeholders.length - 1}⟧`;
  });
  return { protectedText, placeholders };
}

function restorePlaceholders(text, placeholders) {
  return text.replace(/⟦\s*(\d+)\s*⟧/g, (_, i) => placeholders[Number(i)] ?? '');
}

async function translate(text, target) {
  const { protectedText, placeholders } = protectPlaceholders(text);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
    target,
  )}&dt=t&q=${encodeURIComponent(protectedText)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate upstream ${res.status} for "${text}" -> ${target}`);
  const data = await res.json();
  let out = protectedText;
  if (Array.isArray(data) && Array.isArray(data[0])) {
    out = data[0].map((seg) => (Array.isArray(seg) ? seg[0] : '')).join('') || protectedText;
  }

  const restored = restorePlaceholders(out, placeholders);
  // Fail closed on this one check specifically: if a placeholder didn't
  // survive (translate mangled the token itself, rare but possible), fall
  // back to the English source rather than ship a broken interpolation.
  for (const p of placeholders) {
    if (!restored.includes(p)) return text;
  }
  return restored;
}

// Flatten {a: {b: "x"}} -> {"a.b": "x"}, and back.
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

// The set of {{placeholder}} names a string references, order-independent.
function placeholderNames(text) {
  const names = new Set();
  for (const m of String(text).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) names.add(m[1]);
  return names;
}

function samePlaceholders(a, b) {
  const setA = placeholderNames(a);
  const setB = placeholderNames(b);
  if (setA.size !== setB.size) return false;
  for (const n of setA) if (!setB.has(n)) return false;
  return true;
}

function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

async function main() {
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const enFlat = flatten(en);

  for (const [code, googleCode] of Object.entries(TARGETS)) {
    const filePath = path.join(LOCALES_DIR, `${code}.json`);
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
    const existingFlat = flatten(existing);

    let translatedCount = 0;
    let repairedCount = 0;
    for (const [key, enValue] of Object.entries(enFlat)) {
      const current = existingFlat[key];
      const hasPlaceholders = placeholderNames(enValue).size > 0;
      // Missing, still equal to the English source, or (for interpolated
      // strings) references different placeholder names than the English
      // source — that last case is exactly the "{{name}} -> {{orukọ}}" bug:
      // translate() protects placeholders going forward, but this catches
      // anything already broken in the file from before that fix existed.
      const needsTranslation = current === undefined || current === enValue;
      const isBroken = hasPlaceholders && current !== undefined && !samePlaceholders(current, enValue);

      if (needsTranslation || isBroken) {
        try {
          existingFlat[key] = await translate(enValue, googleCode);
          if (isBroken) repairedCount++;
          else translatedCount++;
        } catch (err) {
          console.error(`  ! failed: ${key}`, err.message);
          existingFlat[key] = enValue; // fail open — never leave a key missing
        }
      }
    }

    // Drop keys that no longer exist in en.json (renamed/removed upstream).
    for (const key of Object.keys(existingFlat)) {
      if (!(key in enFlat)) delete existingFlat[key];
    }

    fs.writeFileSync(filePath, JSON.stringify(unflatten(existingFlat), null, 2) + '\n');
    console.log(
      `${code}.json: translated ${translatedCount} key(s)` +
        (repairedCount ? `, repaired ${repairedCount} broken placeholder(s)` : ''),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
