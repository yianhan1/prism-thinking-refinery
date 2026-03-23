#!/usr/bin/env node
/**
 * prism-update.mjs — Reliable profile.json updater for Prism Thinking Refinery
 *
 * Usage:
 *   node tools/prism-update.mjs --dimension <name> --delta <±number> --reason "text"
 *   node tools/prism-update.mjs --init                    # Create default profile + config
 *   node tools/prism-update.mjs --show                    # Print radar visualization
 *   node tools/prism-update.mjs --add-dimension <name>    # Add custom dimension
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, '..');
const DATA_DIR = join(SKILL_DIR, 'data');
const PROFILE_PATH = join(DATA_DIR, 'profile.json');
const CONFIG_PATH = join(DATA_DIR, 'config.json');
const JOURNAL_DIR = join(DATA_DIR, 'journal');

const EMOJIS = {
  first_principles: '🧱', inverse_thinking: '🔄', stakeholder_lens: '👥',
  systems_thinking: '🕸️', game_theory: '♟️', historical_analogy: '📜',
  second_order_effects: '🌊', cross_domain: '🔗'
};

const DEFAULT_PROFILE = {
  radar: {
    first_principles: 5.0, inverse_thinking: 5.0, stakeholder_lens: 5.0,
    systems_thinking: 5.0, game_theory: 5.0, historical_analogy: 5.0,
    second_order_effects: 5.0, cross_domain: 5.0
  },
  customDimensions: {},
  calibratedAt: null,
  lastUpdated: null,
  sessionCount: 0,
  history: []
};

const DEFAULT_CONFIG = {
  pushTime: "22:00",
  pushFrequency: "daily",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  language: "en"
};

function clamp(val, min = 1.0, max = 10.0) {
  return Math.round(Math.max(min, Math.min(max, val)) * 10) / 10;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDirs() {
  for (const d of [DATA_DIR, JOURNAL_DIR]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

function readProfile() {
  if (!existsSync(PROFILE_PATH)) return null;
  return JSON.parse(readFileSync(PROFILE_PATH, 'utf8'));
}

function writeProfile(profile) {
  if (existsSync(PROFILE_PATH)) {
    writeFileSync(PROFILE_PATH + '.bak', readFileSync(PROFILE_PATH));
  }
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2) + '\n');
}

function appendJournal(dimension, delta, reason) {
  const file = join(JOURNAL_DIR, `${today()}.md`);
  const sign = delta >= 0 ? '+' : '';
  const emoji = EMOJIS[dimension] || '📌';
  const line = `- ${emoji} **${dimension}** ${sign}${delta} — ${reason}\n`;
  if (!existsSync(file)) {
    writeFileSync(file, `# ${today()} — Session Log\n\n${line}`);
  } else {
    writeFileSync(file, readFileSync(file, 'utf8') + line);
  }
}

function showRadar(profile) {
  const all = { ...profile.radar, ...profile.customDimensions };
  const maxLen = Math.max(...Object.keys(all).map(k => k.length));
  console.log(`\n🔺 Thinking Radar\n`);
  for (const [dim, score] of Object.entries(all)) {
    const filled = Math.round(score);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    const emoji = EMOJIS[dim] || '📌';
    console.log(`${emoji} ${dim.padEnd(maxLen)}  ${bar}  ${score.toFixed(1)}`);
  }
  console.log();
}

// --- Main ---
const args = process.argv.slice(2);

if (args.includes('--init')) {
  ensureDirs();
  if (!existsSync(PROFILE_PATH)) {
    writeProfile(DEFAULT_PROFILE);
    console.log('Created data/profile.json');
  } else {
    console.log('data/profile.json already exists');
  }
  if (!existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n');
    console.log('Created data/config.json');
  } else {
    console.log('data/config.json already exists');
  }
  process.exit(0);
}

if (args.includes('--show')) {
  const profile = readProfile();
  if (!profile) { console.error('No profile.json found. Run with --init first.'); process.exit(1); }
  showRadar(profile);
  process.exit(0);
}

if (args.includes('--add-dimension')) {
  const name = args[args.indexOf('--add-dimension') + 1];
  if (!name) { console.error('Usage: --add-dimension <name>'); process.exit(1); }
  const profile = readProfile();
  if (!profile) { console.error('No profile.json found.'); process.exit(1); }
  if (profile.radar[name] || profile.customDimensions[name]) {
    console.error(`Dimension "${name}" already exists.`);
    process.exit(1);
  }
  profile.customDimensions[name] = 5.0;
  profile.lastUpdated = today();
  writeProfile(profile);
  console.log(`Added custom dimension: ${name} = 5.0`);
  process.exit(0);
}

// Default: update a dimension
const dimIdx = args.indexOf('--dimension');
const deltaIdx = args.indexOf('--delta');
const reasonIdx = args.indexOf('--reason');

if (dimIdx === -1 || deltaIdx === -1 || reasonIdx === -1) {
  console.error('Usage: node prism-update.mjs --dimension <name> --delta <±number> --reason "text"');
  console.error('       node prism-update.mjs --init');
  console.error('       node prism-update.mjs --show');
  console.error('       node prism-update.mjs --add-dimension <name>');
  process.exit(1);
}

const dimension = args[dimIdx + 1];
const delta = parseFloat(args[deltaIdx + 1]);
const reason = args.slice(reasonIdx + 1).join(' ');

if (!dimension || isNaN(delta) || !reason) {
  console.error('Invalid arguments. All of --dimension, --delta, --reason are required.');
  process.exit(1);
}

if (Math.abs(delta) > 0.5) {
  console.error(`Delta ${delta} exceeds max ±0.5. Use a smaller value.`);
  process.exit(1);
}

ensureDirs();
const profile = readProfile();
if (!profile) { console.error('No profile.json found. Run with --init first.'); process.exit(1); }

const isBuiltin = dimension in profile.radar;
const isCustom = dimension in profile.customDimensions;
if (!isBuiltin && !isCustom) {
  console.error(`Unknown dimension: "${dimension}". Add it first with --add-dimension.`);
  process.exit(1);
}

const bucket = isBuiltin ? 'radar' : 'customDimensions';
const oldScore = profile[bucket][dimension];
const newScore = clamp(oldScore + delta);
profile[bucket][dimension] = newScore;
profile.lastUpdated = today();
profile.sessionCount += 1;
profile.history.push({ date: today(), dimension, delta, reason });

writeProfile(profile);
appendJournal(dimension, delta, reason);

const sign = delta >= 0 ? '+' : '';
console.log(`${EMOJIS[dimension] || '📌'} ${dimension}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${sign}${delta})`);
console.log(`Reason: ${reason}`);
