#!/usr/bin/env node
/**
 * generate-digest.mjs — Pre-generate context for Prism Daily Digest
 *
 * Handles the deterministic/heavy parts so the cron agent only needs to:
 *   1. Read the output JSON
 *   2. Web search for articles (the creative part)
 *   3. Compose and deliver the digest
 *
 * Output: prints JSON to stdout with all context needed
 *
 * Usage:
 *   node tools/generate-digest.mjs
 *   node tools/generate-digest.mjs --days 7    # look back N days for dedup
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, '..');
const DATA_DIR = join(SKILL_DIR, 'data');
const PROFILE_PATH = join(DATA_DIR, 'profile.json');
const CONFIG_PATH = join(DATA_DIR, 'config.json');
const READING_LIST_PATH = join(DATA_DIR, 'reading-list.md');
const JOURNAL_DIR = join(DATA_DIR, 'journal');

const EMOJIS = {
  first_principles: '🧱', inverse_thinking: '🔄', stakeholder_lens: '👥',
  systems_thinking: '🕸️', game_theory: '♟️', historical_analogy: '📜',
  second_order_effects: '🌊', cross_domain: '🔗'
};

const DIMENSION_LABELS_ZH = {
  first_principles: '第一性原理', inverse_thinking: '逆向思考',
  stakeholder_lens: '利害關係人視角', systems_thinking: '系統思維',
  game_theory: '賽局理論', historical_analogy: '歷史類比',
  second_order_effects: '二階效應', cross_domain: '跨領域連結'
};

const DIMENSION_LABELS_EN = {
  first_principles: 'First Principles', inverse_thinking: 'Inverse Thinking',
  stakeholder_lens: 'Stakeholder Lens', systems_thinking: 'Systems Thinking',
  game_theory: 'Game Theory', historical_analogy: 'Historical Analogy',
  second_order_effects: 'Second-Order Effects', cross_domain: 'Cross-Domain'
};

const WEEKDAYS = {
  'zh-TW': ['日', '一', '二', '三', '四', '五', '六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

const TEMPLATES = {
  'zh-TW': {
    radarHeader: '📊 Thinking Radar 現況',
    readingHeader: '📚 今日推薦閱讀',
    promptHeader: '💭 Daily Prism Prompt'
  },
  en: {
    radarHeader: '📊 Thinking Radar',
    readingHeader: '📚 Curated Reading',
    promptHeader: '💭 Daily Prism Prompt'
  }
};

// --- Load config ---
let config = { timezone: 'UTC', language: 'en' };
if (existsSync(CONFIG_PATH)) {
  try { config = { ...config, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) }; } catch {}
}
const tz = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const lang = config.language || 'en';
const dimLabels = lang === 'zh-TW' ? DIMENSION_LABELS_ZH : DIMENSION_LABELS_EN;
const weekdays = WEEKDAYS[lang] || WEEKDAYS.en;
const tpl = TEMPLATES[lang] || TEMPLATES.en;

// --- Args ---
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const lookbackDays = daysIdx !== -1 ? parseInt(args[daysIdx + 1]) || 7 : 7;

// --- Load profile ---
if (!existsSync(PROFILE_PATH)) {
  console.error(JSON.stringify({ error: 'No profile.json found. Run prism-update.mjs --init first.' }));
  process.exit(1);
}
const profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8'));
const allDimensions = { ...profile.radar, ...(profile.customDimensions || {}) };

// --- Radar visualization ---
const maxLen = Math.max(...Object.keys(allDimensions).map(k => k.length));
const radarLines = [];
for (const [dim, score] of Object.entries(allDimensions)) {
  const filled = Math.round(score);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const emoji = EMOJIS[dim] || '📌';
  radarLines.push(`${emoji} ${dim.padEnd(maxLen)}  ${bar}  ${score.toFixed(1)}`);
}

// --- Dimension analysis ---
const sorted = Object.entries(allDimensions).sort((a, b) => a[1] - b[1]);
const weakest = sorted.slice(0, 3).map(([d, s]) => ({ dimension: d, score: s }));
const strongest = sorted.slice(-2).map(([d, s]) => ({ dimension: d, score: s }));

// --- Recent history (last N days) ---
const now = new Date();
const cutoff = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
const recentHistory = (profile.history || []).filter(h => new Date(h.date) >= cutoff);

// --- Count recent dimension coverage from reading list ---
const recentDimensionCoverage = {};
const recentUrls = new Set();
const recentTitles = new Set();

if (existsSync(READING_LIST_PATH)) {
  const content = readFileSync(READING_LIST_PATH, 'utf8');
  const lines = content.split('\n');

  let currentDate = null;
  let inRecentSection = false;

  for (const line of lines) {
    // Match date headers like "## 2026-03-23" or "## 2026-03-23 (manual)"
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentDate = new Date(dateMatch[1]);
      inRecentSection = currentDate >= cutoff;
      continue;
    }

    if (!inRecentSection) continue;

    // Extract URLs
    const urlMatch = line.match(/^\- \*\*Source:\*\* (.+)$/);
    if (urlMatch) {
      recentUrls.add(urlMatch[1].trim());
    }

    // Extract titles
    const titleMatch = line.match(/^### \d+\. (.+)$/);
    if (titleMatch) {
      recentTitles.add(titleMatch[1].trim());
    }

    // Extract dimensions
    const dimMatch = line.match(/^\- \*\*Dimension:\*\* (.+)$/);
    if (dimMatch) {
      const dims = dimMatch[1].split(/[×,]/).map(d => d.trim().replace(/^[^\w]*/, ''));
      for (const d of dims) {
        const clean = d.replace(/\s*\(.*\)/, '').trim();
        if (clean in allDimensions || clean === 'cross_domain') {
          recentDimensionCoverage[clean] = (recentDimensionCoverage[clean] || 0) + 1;
        }
      }
    }
  }
}

// --- Pick focus dimensions (2-3) ---
// Prioritize: weak + under-covered recently, but rotate
const dimensionPriority = Object.entries(allDimensions)
  .map(([dim, score]) => ({
    dimension: dim,
    score,
    recentCoverage: recentDimensionCoverage[dim] || 0,
    // Lower score + lower coverage = higher priority
    priority: (10 - score) * 2 + Math.max(0, 3 - (recentDimensionCoverage[dim] || 0))
  }))
  .sort((a, b) => b.priority - a.priority);

// Pick top 2-3, ensuring variety
const focusDimensions = [];
const usedScoreBands = new Set();
for (const dp of dimensionPriority) {
  if (focusDimensions.length >= 3) break;
  const band = Math.floor(dp.score); // group by integer score
  // Allow max 2 from same score band
  const bandCount = focusDimensions.filter(f => Math.floor(f.score) === band).length;
  if (bandCount < 2) {
    focusDimensions.push(dp);
    usedScoreBands.add(band);
  }
}

// --- Format today's date ---
const localNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
const dateStr = `${localNow.getFullYear()}/${String(localNow.getMonth() + 1).padStart(2, '0')}/${String(localNow.getDate()).padStart(2, '0')}`;
const dayOfWeek = weekdays[localNow.getDay()];

// --- Build output ---
const output = {
  date: dateStr,
  dayOfWeek,
  isoDate: now.toISOString().slice(0, 10),

  radar: {
    text: radarLines.join('\n'),
    dimensions: allDimensions
  },

  focus: {
    dimensions: focusDimensions.map(f => ({
      dimension: f.dimension,
      emoji: EMOJIS[f.dimension] || '📌',
      label: dimLabels[f.dimension] || f.dimension,
      score: f.score,
      recentCoverage: f.recentCoverage,
      priority: f.priority
    })),
    reasoning: `Weakest: ${weakest.map(w => `${w.dimension}(${w.score})`).join(', ')}. ` +
      `Recent coverage: ${Object.entries(recentDimensionCoverage).map(([k, v]) => `${k}:${v}`).join(', ') || 'none'}. ` +
      `Focus picks balance low score + low recent coverage.`
  },

  dedup: {
    recentUrls: [...recentUrls],
    recentTitles: [...recentTitles],
    note: `Do NOT recommend any URL or title from this list. Search for fresh articles.`
  },

  recentHistory: recentHistory.slice(-10).map(h => `${h.date} ${h.dimension} ${h.delta > 0 ? '+' : ''}${h.delta}: ${h.reason}`),

  searchSuggestions: focusDimensions.map(f => {
    const dim = f.dimension;
    const domains = ['business strategy', 'technology', 'healthcare', 'education', 'finance', 'urban planning', 'military', 'sports', 'psychology'];
    // Pick a semi-random domain based on date + dimension to rotate
    const seed = (localNow.getDate() + dim.length) % domains.length;
    const domain = domains[seed];
    return {
      dimension: dim,
      suggestedQuery: `${dimLabels[dim] || dim} ${domain} deep analysis 2025`,
      domain,
      note: `Search for a deep article on ${dim} applied to ${domain}. Include 1 cross-domain piece.`
    };
  }),

  promptGuidance: {
    targetDimensions: focusDimensions.slice(0, 2).map(f => f.dimension),
    avoid: 'Do not repeat themes from recent prompts. Vary context: business/personal/historical/technical.',
    language: lang === 'zh-TW' ? 'Traditional Chinese' : 'English',
    recentPromptTopics: recentHistory.slice(-5).map(h => h.reason).join('; ')
  },

  outputTemplate: `🪶 Prism Daily Digest — {date} ({dayOfWeek})

───

${tpl.radarHeader}

{radar}

{focusReasoning}

───

${tpl.readingHeader}

{articles}

───

${tpl.promptHeader}

{prompt}`,

  appendFormat: `## {isoDate}

### {n}. {title}
- **Source:** {url}
- **Summary:** {summary}
- **Dimension:** {dimension}
- **Why this matters:** {whyMatters}
- **Status:** unread`
};

console.log(JSON.stringify(output, null, 2));
