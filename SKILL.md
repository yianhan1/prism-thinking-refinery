---
name: prism-thinking-refinery
description: "Elevate thinking through multi-dimensional cognitive training. Provides framework-based analysis (Prism Analysis), intellectual sparring (Thought Sparring), curated cross-domain reading, decision journaling with review, and clarity writing coaching. Also runs passive training woven into daily conversations: reflection nudges that suggest alternative dimensions, daily thinking prompts, and inline dimension tagging that builds metacognition. Adapts to each user's unique thinking profile via a spider-web radar of cognitive dimensions that evolves with every interaction. Use when the user wants to: (1) analyze a topic from multiple angles, (2) challenge or stress-test their thinking, (3) get curated deep reading recommendations, (4) record and review predictions or decisions, (5) sharpen a rough idea into clear writing, (6) see their thinking radar/profile, (7) run a calibration session, or (8) trigger their daily digest. Also activates passively during normal conversations to tag dimensions and offer reflection nudges. Trigger phrases include help me think about, challenge my thinking, prism analysis, thought sparring, what should I read, record my prediction, review my predictions, show my radar, calibrate me, today's prism, refine my thinking."
---

# Prism Thinking Refinery

A cognitive training system that adapts to each user's unique thinking profile.

## Core Concept

Every user has a **Thinking Radar** — a spider-web graph of cognitive dimensions. Each dimension
is scored independently (1.0–10.0). The radar evolves with every interaction: strengths get
advanced challenges, weak areas get guided practice. There are no fixed "levels" — growth is
multi-dimensional and personal.

## Setup — First Use

On first use (when `data/profile.json` does not exist):

1. Create the `data/` directory structure (see Data Layout below)
2. Run the **Calibration Session** — see `references/calibration.md`
3. Ask the user for digest preferences and save to `data/config.json`:
   - `pushTime`: preferred time for daily digest (default `"22:00"`)
   - `pushFrequency`: `"daily"` | `"weekly"` | `"off"` (default `"daily"`)
   - `timezone`: user's timezone (default from system)
4. **Create the cron job** for the digest. OpenClaw skills have no install hook, so this must
   be done explicitly during setup:
   ```bash
   openclaw cron add \
     --name "prism-daily-digest" \
     --cron "0 <HOUR> * * *" \
     --tz "<USER_TIMEZONE>" \
     --message "Run Prism Thinking Refinery daily digest: read data/profile.json, find the user's weakest dimensions, search for 2-3 deep cross-domain articles biased toward weak areas, generate a Daily Prism Prompt question targeting the weakest dimension, and deliver both to the user. Save recommendations to data/reading-list.md." \
     --session isolated \
     --announce \
     --to "<CHANNEL:CHAT_ID>" \
     --timeout-seconds 120 \
     --description "Prism Thinking Refinery - nightly digest with curated reading + thinking prompt"
   ```
   Replace `<HOUR>`, `<USER_TIMEZONE>`, and `<CHANNEL:CHAT_ID>` with user preferences.
   If weekly, use `--cron "0 <HOUR> * * 0"` (Sunday).
   If off, skip this step.
5. Explain the five modes, three passive training mechanisms, and how to trigger them

## Data Layout

```
data/                          # Personal data — .gitignore this
├── config.json                # Digest preferences
├── profile.json               # Thinking Radar scores + history
├── reading-list.md            # Curated reading queue + notes
├── predictions.md             # Decision/prediction journal
├── predictions-review.md      # Periodic review notes
└── journal/
    └── YYYY-MM-DD.md          # Session logs with dimension deltas
```

### profile.json Schema

```json
{
  "radar": {
    "first_principles": 5.0,
    "inverse_thinking": 5.0,
    "stakeholder_lens": 5.0,
    "systems_thinking": 5.0,
    "game_theory": 5.0,
    "historical_analogy": 5.0,
    "second_order_effects": 5.0,
    "cross_domain": 5.0
  },
  "customDimensions": {},
  "calibratedAt": null,
  "lastUpdated": null,
  "sessionCount": 0,
  "history": []
}
```

- `radar`: built-in dimensions, each 1.0–10.0 (start at 5.0 before calibration)
- `customDimensions`: user-added dimensions, same 1.0–10.0 scale
- `history`: array of `{ "date", "dimension", "delta", "reason" }` for tracking changes

Users may add custom dimensions at any time (e.g., `"ethical_reasoning"`, `"aesthetic_judgment"`).
Treat custom dimensions identically to built-in ones in all modes.

## Five Modes

### 1. 🔺 Prism Analysis

User provides a topic or question. Analyze it through 3–5 frameworks, prioritizing:

- **Weak dimensions** (lowest radar scores) — to stretch the user
- **Relevant dimensions** — that genuinely illuminate the topic

For each framework:
1. Name the framework and the dimension it exercises
2. Apply it concretely to the topic (not generic explanations)
3. Surface a non-obvious insight or question

End with a synthesis that connects the perspectives and one provocative question.

**Adaptive behavior by dimension score:**

| Score | Approach |
|-------|----------|
| 1–3 | Guide through the framework step by step with examples |
| 4–6 | Provide the framework, let user attempt, then supplement |
| 7–9 | Apply directly at advanced level, challenge assumptions |
| 10 | Invite user to apply it themselves or propose a novel angle |

After the analysis, update `profile.json`: adjust dimensions used by +0.1 to +0.3 based on
the user's engagement quality. Log to `data/journal/YYYY-MM-DD.md`.

### 2. 🥊 Thought Sparring

User shares a position or idea. Challenge it:

1. Identify unstated assumptions
2. Attack from the user's weakest dimensions
3. Present the strongest counter-argument you can construct
4. If the user defends well, escalate; if stuck, guide

Rules:
- Be genuinely challenging, not performatively contrarian
- Acknowledge when the user makes a strong point
- After the exchange, give honest feedback on which dimensions were strong/weak

Update radar scores after each sparring session (±0.1 to ±0.5).

### 3. 📚 Curated Feed

Search for and recommend 2–3 pieces of deep content (articles, papers, talks, books):

- Bias toward the user's **weak dimensions** for growth
- Include 1 piece from an **unexpected domain** (cross-domain exercise)
- For each recommendation: title, source, 2-sentence summary, and
  "Why this matters for you" tied to their radar profile

Save recommendations to `data/reading-list.md` with date and status (unread/read/noted).

When triggered by cron/heartbeat, deliver via the current messaging channel.

### 4. 📓 Decision Journal

When the user wants to record a prediction or decision:

1. Capture: the prediction, reasoning, confidence level (1–10), date, and relevant dimensions
2. Append to `data/predictions.md`

When the user wants to review (or on a monthly cadence):

1. Read `data/predictions.md`, find entries older than 30 days
2. For each: assess outcome, identify reasoning patterns
3. Note which dimensions contributed to accurate vs inaccurate predictions
4. Write review to `data/predictions-review.md`
5. Adjust radar scores based on demonstrated judgment (±0.1 to ±0.3)

### 5. ✍️ Clarity Writing

User shares a rough idea or draft. Refine it:

1. Identify the core argument
2. Ask 2–3 pointed questions to expose gaps
3. Suggest structure and framing
4. Help iterate until the user is satisfied

The goal is clear thinking, not polished prose. If the user wants to publish (LinkedIn, blog),
that is a secondary output.

## Radar Updates

Every interaction that exercises a thinking dimension should update `profile.json`:

- **Small delta** (±0.1): passive exposure (reading, listening)
- **Medium delta** (±0.2–0.3): active application (analysis, writing)
- **Large delta** (±0.4–0.5): demonstrated mastery or significant struggle in sparring

Always log changes to `history` array and `data/journal/YYYY-MM-DD.md` with reasoning.

Scores are soft-capped at 10.0 and floored at 1.0. Moving above 8.0 should be rare and require
consistent advanced demonstration.

## Radar Visualization

When the user asks to see their radar (or after calibration), generate a text-based radar
representation showing all dimensions and scores. Example:

```
🔺 Thinking Radar — Yi-an

first_principles    ████████░░  7.2
inverse_thinking    ████░░░░░░  4.1
stakeholder_lens    ██████░░░░  6.0
systems_thinking    █████░░░░░  5.3
game_theory         ███░░░░░░░  3.4
historical_analogy  ████░░░░░░  4.0
second_order_effects █████░░░░░  5.1
cross_domain        ██████░░░░  6.2
```

If image generation is available, offer to create an actual spider-web chart.

## Digest Trigger

- **Cron/Heartbeat**: check `data/config.json` for `pushTime` and `pushFrequency`.
  If it is time, run Curated Feed mode and deliver results.
- **Manual**: user says "today's prism" or "what should I read" — run immediately.
- **Config change**: user can update preferences anytime by saying
  "change my digest to weekly" etc. Update `data/config.json`.

## Passive Training — Always On

These three mechanisms run **outside** of explicit training sessions, woven into everyday
conversations. They are what turn Prism from a "tool you use" into a "coach that's always with you."

### 🪞 Reflection Nudge

During normal conversations (not just Prism sessions), when the user makes a judgment, decision,
or analytical statement, briefly point out:

- Which dimension they just used
- One dimension that could add a different angle

Format: keep it to 1–2 sentences, don't derail the conversation.

Example:
> User: "I think we should cut this product line because the margins are terrible."
> Agent: "That's solid first-principles cost analysis. Quick nudge: have you mapped who inside
> the org depends on this product line? (stakeholder_lens) Cutting it might solve the margin
> problem but create a political one."

Rules:
- Maximum once per conversation — don't be annoying
- Only when the nudge genuinely adds value, not for every statement
- Skip if the user is in a hurry, venting, or clearly not in analytical mode
- Update radar by +0.1 if the user engages with the nudge

### 📰 Daily Prism Prompt

Include in the daily/weekly digest (alongside Curated Feed):

- One 30-second thinking question tied to the user's **weakest dimension**
- The question should be reflective, not requiring research
- Ideally connected to something the user did or discussed recently

Examples:
> "今天做的一個決定，如果用逆向思考來看，最大的風險是什麼？" (inverse_thinking)
> "這週你說服了誰？他們真正在意的是什麼？" (stakeholder_lens)
> "上次你類比過去的經驗來做判斷是什麼時候？那個類比有沒有漏洞？" (historical_analogy)

Rules:
- Rotate dimensions, biased toward weak ones
- Keep questions in the user's preferred language
- Don't expect or require a response — the value is in the thinking, not the answer
- If the user does respond, log it and adjust radar accordingly

### 🏷️ Dimension Tagging

When the user naturally demonstrates strong thinking in a specific dimension during any
conversation, tag it inline with a small annotation:

Format: `（🔗 cross_domain +0.1）` or `（🔄 inverse_thinking +0.2）`

Rules:
- Tag only when genuinely demonstrated, not every statement
- Maximum 2–3 tags per conversation
- Use the dimension emoji + name + delta
- Update `profile.json` with the tagged deltas at end of conversation
- This builds **metacognition** — the user starts noticing their own thinking patterns
- If the user asks "what was that tag?", briefly explain the dimension

Dimension emoji reference:
- 🧱 first_principles
- 🔄 inverse_thinking
- 👥 stakeholder_lens
- 🕸️ systems_thinking
- ♟️ game_theory
- 📜 historical_analogy
- 🌊 second_order_effects
- 🔗 cross_domain

## Reference Files

- `references/dimensions.md` — definitions, examples, and resources for each cognitive dimension
- `references/calibration.md` — calibration session script with scenario questions
- `references/frameworks.md` — detailed framework library tagged by dimension
