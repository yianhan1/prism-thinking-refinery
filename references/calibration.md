# Calibration Session

Script for the initial calibration conversation that establishes a user's Thinking Radar baseline.

## Purpose

Assess the user's natural thinking tendencies across all dimensions without feeling like a test.
The calibration is a conversation, not an exam.

## Instructions for the Agent

1. Explain briefly: "I'll give you one scenario to understand how you naturally think. No right answers — I'm mapping your thinking style, not testing knowledge."
2. Present 1 scenario (choose from the pool below based on the user's domain/interests)
3. Let the user respond freely, then ask 1–2 follow-up probes
4. Score each dimension based on observed patterns
5. Show the initial radar, explain it, and ask if it feels accurate
6. Save to `data/profile.json`

## Scoring Guide

When scoring, look for:

- **Which dimensions does the user naturally reach for?** (score higher)
- **Which dimensions are absent from their analysis?** (score lower)
- **How deep do they go?** (surface mention = 4–5, nuanced application = 6–7)
- **Do they connect ideas across domains?** (cross_domain signal)
- **Do they think about others' perspectives?** (stakeholder_lens signal)
- **Do they consider what could go wrong?** (inverse_thinking signal)
- **Do they trace consequences forward?** (second_order_effects signal)

Default starting score is 5.0 for unobserved dimensions. Only adjust dimensions you have
clear signal on. It's better to start at 5.0 and refine over time than to guess.

## Scenario Pool

Pick 3 that are relevant to the user's background. Adapt phrasing to their domain.

### Scenario A — Strategy / Business

> "Your biggest competitor just announced they're offering their core product for free.
> You have 48 hours before the press picks it up. Walk me through how you'd think about this."

**Probes:**
- "What do you think they're actually trying to achieve?" (game_theory, stakeholder_lens)
- "Has something like this happened in another industry?" (historical_analogy)
- "What happens six months from now if you match them?" (second_order_effects)

### Scenario B — Technology / Product

> "Your team built a feature that users love, but it's causing unexpected load on your
> infrastructure and costs are 3x what you budgeted. The CEO wants it shipped yesterday.
> How do you approach this?"

**Probes:**
- "What are you optimizing for here, and what are you willing to sacrifice?" (first_principles)
- "Who else is affected by this decision besides your team?" (stakeholder_lens)
- "What's the worst version of how this plays out?" (inverse_thinking)

### Scenario C — Society / Policy

> "A city wants to reduce traffic congestion. They're considering: (a) congestion pricing,
> (b) more public transit, (c) work-from-home mandates. You're advising the mayor.
> What's your thinking?"

**Probes:**
- "Who wins and who loses under each option?" (stakeholder_lens, game_theory)
- "What happens after the first year?" (second_order_effects, systems_thinking)
- "Is there a solution from a completely different domain?" (cross_domain)

### Scenario D — Personal / Career

> "You receive two job offers. One is a senior role at a stable company with great pay.
> The other is a leadership role at an early-stage startup with lower pay but significant
> equity. How do you decide?"

**Probes:**
- "What assumptions are baked into the startup's equity value?" (first_principles)
- "What would you tell a friend in the same situation?" (inverse perspective)
- "Five years from now, which choice has more paths forward?" (second_order_effects, systems_thinking)

### Scenario E — Crisis / Ambiguity

> "You're leading a project and discover that a key data source your team has been using
> for months contains significant errors. The project is 80% complete. What do you do?"

**Probes:**
- "What's the real problem here — the data, the process, or something else?" (first_principles, systems_thinking)
- "How would you explain this to the stakeholders?" (stakeholder_lens)
- "What would have prevented this?" (inverse_thinking)

### Scenario F — Innovation / Future

> "Imagine AI agents can handle 80% of white-collar knowledge work within 5 years.
> What does this mean for education, careers, and society?"

**Probes:**
- "What happened last time a technology displaced a large workforce?" (historical_analogy)
- "Who benefits and who gets hurt in this transition?" (stakeholder_lens, second_order_effects)
- "What's the non-obvious opportunity here?" (cross_domain, first_principles)

## After Calibration

1. Present the radar with brief commentary on each dimension
2. Highlight 2–3 strengths and 2–3 growth areas
3. Suggest which mode to try first based on the profile
4. Save everything to `data/profile.json` and `data/journal/YYYY-MM-DD.md`
