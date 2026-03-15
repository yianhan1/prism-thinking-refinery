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

1. Initialize data files:
   ```bash
   node tools/prism-update.mjs --init
   ```
   This creates `data/profile.json` (default scores) and `data/config.json` (digest preferences).

2. Run the **Calibration Session** — see `references/calibration.md`

3. Ask the user for digest preferences and update `data/config.json`:
   - `pushTime`: preferred time for daily digest (default `"22:00"`)
   - `pushFrequency`: `"daily"` | `"weekly"` | `"off"` (default `"daily"`)
   - `timezone`: user's timezone (default from system)

4. **Create the cron job** for the digest:
   ```bash
   openclaw cron add \
     --name "prism-daily-digest" \
     --cron "0 <HOUR> * * *" \
     --tz "<USER_TIMEZONE>" \
     --message "Run Prism daily digest. Steps: (1) Run: node skills/prism-thinking-refinery/tools/prism-update.mjs --show to see current radar. (2) Read skills/prism-thinking-refinery/data/reading-list.md (last 7 days) to see what was already recommended — do not repeat those. (3) Pick 2-3 dimensions to focus on: prioritize weak ones but rotate — max 1 article per dimension, and vary the application domain each day. If a weak dimension has recently improved close to the next weakest, shift focus. (4) Web search for 2-3 deep articles targeting those dimensions, include 1 cross-domain piece. Avoid duplicating titles or URLs from step 2. (5) Generate a Daily Prism Prompt question — rotate across weak and mid-range dimensions, vary the context (business, personal, historical, technical). Use the user's language. (6) Deliver to the user. (7) Append to skills/prism-thinking-refinery/data/reading-list.md using the format in that file." \
     --session isolated \
     --announce \
     --to "<CHANNEL:CHAT_ID>" \
     --timeout-seconds 120 \
     --description "Prism Thinking Refinery - nightly digest with curated reading + thinking prompt"
   ```
   Replace `<HOUR>`, `<USER_TIMEZONE>`, and `<CHANNEL:CHAT_ID>` with user preferences.
   If weekly, use `--cron "0 <HOUR> * * 0"` (Sunday).
   If off, skip this step.

5. Explain the five modes, three passive training mechanisms, and how to trigger them.
   Use this welcome message as a template:

   ```
   🔺 Prism Thinking Refinery 已啟用！

   你可以隨時用這些指令：

   🔺 「prism analysis + 主題」 — 多角度分析
   🥊 「challenge my thinking + 觀點」 — 思辨對練
   📚 「what should I read」 — 推薦閱讀
   📓 「record my prediction + 預測」 — 記錄預測
   ✍️ 「refine my thinking + 想法」 — 寫作精煉
   📊 「show my radar」 — 查看思維雷達圖

   日常對話中如果你在分析問題，我會偶爾標註你用到的思維維度。
   每天 22:00 會推送一則思考題 + 精選文章。
   ```

   Adapt the language to the user's preference. Keep it short.

6. **Remind the user** to add the passive training snippet to their `AGENTS.md` — see
   the "Passive Training — Integration" section below.

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

Users may add custom dimensions at any time:
```bash
node tools/prism-update.mjs --add-dimension ethical_reasoning
```

## Profile Update Tool

**Always use the tool to update scores.** Do not edit `profile.json` by hand.

```bash
# Update a dimension score
node tools/prism-update.mjs --dimension inverse_thinking --delta +0.2 --reason "engaged with inversion probe in sparring"

# Show current radar
node tools/prism-update.mjs --show

# Initialize data files (first use)
node tools/prism-update.mjs --init

# Add a custom dimension
node tools/prism-update.mjs --add-dimension ethical_reasoning
```

The tool handles:
- Precise arithmetic (no floating-point drift)
- Clamping scores to 1.0–10.0 range
- Enforcing max ±0.5 per update
- Auto-incrementing sessionCount and lastUpdated
- Appending to history array
- Writing to journal/YYYY-MM-DD.md
- Creating .bak backup before each write

## Five Modes

### 1. 🔺 Prism Analysis

User provides a topic or question. Analyze it through 3–5 frameworks, prioritizing:

- **1–2 from weak dimensions** (lowest radar scores) — to stretch the user
- **1–2 from relevant dimensions** — that genuinely illuminate the topic, even if mid-range
- **Occasionally 1 from a strong dimension** — at advanced difficulty, to prevent plateau
- Vary the domain of application: if the user's weak spot is inverse_thinking, don't always
  apply it to the same type of problem. Rotate across business, personal, historical, technical contexts.

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

After the analysis, update radar using the tool:
```bash
node tools/prism-update.mjs --dimension <dim> --delta +0.2 --reason "active application in prism analysis on <topic>"
```

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

Update radar after each sparring session using the tool (±0.1 to ±0.5 per dimension).

### 3. 📚 Curated Feed

Search for and recommend 2–3 pieces of deep content (articles, papers, talks, books):

- **Max 1 piece per dimension** — even if the user has one clear weakest area, spread across
  different weak or mid-range dimensions
- Include 1 piece from an **unexpected domain** (cross-domain exercise)
- Vary the application domain: same dimension, different context each time
- When a weak dimension has improved to within 0.5 of the next weakest, shift focus to the new weakest
- For each recommendation: title, source, 2-sentence summary, and
  "Why this matters for you" tied to their radar profile

Append recommendations to `data/reading-list.md` using this format:

```markdown
## YYYY-MM-DD

### 1. <Title>
- **Source:** <URL or publication>
- **Summary:** <2 sentences>
- **Dimension:** <target dimension>
- **Why this matters:** <1 sentence tied to radar>
- **Status:** unread
```

### 4. 📓 Decision Journal

When the user wants to record a prediction or decision, append to `data/predictions.md`:

```markdown
## YYYY-MM-DD — <Short title>
- **Prediction:** <what the user predicts>
- **Reasoning:** <why>
- **Confidence:** <1–10>
- **Dimensions:** <relevant dimensions>
- **Review after:** YYYY-MM-DD (30 days later)
```

When the user wants to review (or on a monthly cadence):

1. Read `data/predictions.md`, find entries with review dates in the past
2. For each: assess outcome, identify reasoning patterns
3. Note which dimensions contributed to accurate vs inaccurate predictions
4. Append review to `data/predictions-review.md`
5. Update radar using the tool based on demonstrated judgment

### 5. ✍️ Clarity Writing

User shares a rough idea or draft. Refine it:

1. Identify the core argument
2. Ask 2–3 pointed questions to expose gaps
3. Suggest structure and framing
4. Help iterate until the user is satisfied

The goal is clear thinking, not polished prose. If the user wants to publish (LinkedIn, blog),
that is a secondary output.

## Radar Updates

Every interaction that exercises a thinking dimension should update via the tool:

- **Small delta** (±0.1): passive exposure (reading, listening, dimension tag)
- **Medium delta** (±0.2–0.3): active application (analysis, writing)
- **Large delta** (±0.4–0.5): demonstrated mastery or significant struggle in sparring

Scores are soft-capped at 10.0 and floored at 1.0. Moving above 8.0 should be rare and require
consistent advanced demonstration.

## Radar Visualization

When the user asks to see their radar (or after calibration):

```bash
node tools/prism-update.mjs --show
```

If image generation is available, offer to create an actual spider-web chart.

## Digest Trigger

- **Cron**: runs at the scheduled time, delivers curated feed + daily prism prompt
- **Manual**: user says "today's prism" or "what should I read" — run immediately
- **Config change**: user can update preferences anytime by saying
  "change my digest to weekly" etc. Update `data/config.json`.

## Passive Training — Always On

These three mechanisms run **outside** of explicit training sessions, woven into everyday
conversations. They are what turn Prism from a "tool you use" into a "coach that's always with you."

**Important:** For passive training to work, the agent must have the instructions in a file it
reads every session. See "Passive Training — Integration" below.

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

### 📰 Daily Prism Prompt

Include in the daily/weekly digest (alongside Curated Feed):

- One 30-second thinking question targeting a dimension that needs attention — rotate across
  weak and mid-range dimensions, don't always pick the single weakest
- Vary the context: if targeting inverse_thinking, use customer relationships one day,
  product strategy the next, personal decisions after that
- The question should be reflective, not requiring research
- Ideally connected to something the user did or discussed recently

Examples:
> "今天做的一個決定，如果用逆向思考來看，最大的風險是什麼？" (inverse_thinking)
> "這週你說服了誰？他們真正在意的是什麼？" (stakeholder_lens)
> "上次你類比過去的經驗來做判斷是什麼時候？那個類比有沒有漏洞？" (historical_analogy)

Rules:
- Rotate dimensions, biased toward weak ones but not exclusively — cover different dimensions across days
- Keep questions in the user's preferred language
- Don't expect or require a response — the value is in the thinking, not the answer
- If the user does respond, log it and update radar using the tool

### 🏷️ Dimension Tagging

When the user naturally demonstrates strong thinking in a specific dimension during any
conversation, tag it inline with a small annotation:

Format: `（🔗 cross_domain +0.1）` or `（🔄 inverse_thinking +0.2）`

**Immediately** update the score using the tool when you tag:
```bash
node tools/prism-update.mjs --dimension cross_domain --delta +0.1 --reason "naturally connected biology to cybersecurity in conversation"
```

Rules:
- Tag only when genuinely demonstrated, not every statement
- Maximum 2–3 tags per conversation
- Use the dimension emoji + name + delta
- Update immediately — do not wait until end of conversation
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

## Passive Training — Integration

For passive training (Reflection Nudge and Dimension Tagging) to work in everyday conversations,
the agent needs to see the instructions every session — not just when this skill is triggered.

**During setup, add this block to the user's `AGENTS.md`:**

```markdown
## Passive Cognitive Training (Prism)

Only activate when the user is clearly in analytical/decision-making mode — discussing strategy,
evaluating options, debating ideas, or making judgments. Do NOT activate during casual chat,
daily life topics, quick questions, or emotional conversations.

When active:
- Optionally tag strong thinking inline: （🔗 cross_domain +0.1）and run:
  `node skills/prism-thinking-refinery/tools/prism-update.mjs --dimension <dim> --delta <±val> --reason "<why>"`
- Optionally suggest one alternative dimension (max once per conversation)

Max 1-2 tags per conversation. When in doubt, don't tag.
```

## Uninstall

When the user wants to remove this skill, perform all three steps:

1. Remove the cron job:
   ```bash
   openclaw cron remove prism-daily-digest
   ```
2. Remove the "Passive Cognitive Training (Prism)" section from `AGENTS.md`
3. Delete the skill directory:
   ```bash
   rm -rf skills/prism-thinking-refinery/
   ```

All three steps are required. If step 2 is skipped, the agent will still try to tag dimensions
every conversation but fail to find the tool.

## Reference Files

- `references/dimensions.md` — definitions, examples, and resources for each cognitive dimension
- `references/calibration.md` — calibration session script with scenario questions
- `references/frameworks.md` — detailed framework library tagged by dimension
