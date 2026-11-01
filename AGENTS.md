# AGENTS.md: GoodsAndServicesV6 (TUP Goods and Services Procurement Scheduler)

> Instructions for any AI agent (Claude Code, Codex, Gemini, Copilot, OpenCode…) working in this repo.
> Owner: Madz Amador. House rules: `~/.claude/skills/dev-playbook/SKILL.md`; global agent rules: `~/Documents/KnowledgeGraph/AGENTS.md`. This file overrides them where they differ.

## 1. What this is
A browser-only scheduler for the TUP BAC: from the Pre-Procurement Conference date it computes every activity of a **Goods, Services or Infrastructure** procurement under **RA 12009** and its IRR, skipping weekends and user-set non-working dates, and exports the schedule (print, PDF, CSV, JSON). Live at https://goodsscheduler.netlify.app/. Features: [README.md](README.md).

## 2. Stack & commands
- Stack A: one `index.html`, `script.js`, `style.css`; html2pdf.js from cdnjs. No build, no tests.
- Run: open `index.html`, or `npx serve .`
- Verify: create two or three projects, mark a holiday, regenerate; compare every date before and after your change in Chrome; print and Download PDF on **A4 and Folio (8.5 × 13 in)**.
- Deploy: Netlify (static repo root).

## 3. Project memory
- `walkthrough.md`: dated log. **Add an entry at the top after every change.**
- Working branch: **`ra12009-fixes`** (not `main`).

## 4. Domain rules (non-negotiable)
1. **Same fix, three apps:** this scheduler, ConsultingV6 and the scheduler built into bidDocsGenerator (`src/lib/schedule/`) follow the same RA 12009 rules. A rule fix here is made there too.
2. Periods follow the GPPB copy of the RA 12009 IRR (e.g. clarification 10 CD and bulletin 7 CD before the deadline, 51.5.1; pre-bid ≥ 7 CD after posting and ≥ 12 CD before the deadline, 51.2; ≤ 45 CD from last posting to the deadline, 54.5). Cite the IRR section in the commit.
3. A period ending on a non-working day runs to the next working day (67.3); count-back dates move to the previous working day.
4. The IRR-break list under each schedule is **screen only**: hidden in print and the PDF.
5. Any change to dates, projects or non-working dates marks output stale; stale schedules can't be exported.

## 5. Key files
- `script.js`: activity table, date math, IRR checks, storage (`localStorage`), print (`fitSchedulesToPage`) and PDF (one canvas per schedule).
- `style.css`: screen and print styles; `@page` is injected from the paper-size select.

## 6. Gotchas specific to this repo
- **Saved projects store activity indexes** (`startActivity`, `adjustments`) in `localStorage`. Add new rows as derived rows (no "Additional days" input) so existing indexes stay valid.
- Print: each schedule must fit one sheet; taller ones are scaled with `zoom`, and the PDF adds each schedule as exactly one page. Don't reintroduce `break-after: page` or fixed bottom margins (they produced blank sheets).
- Re-render the table after an input's blur, not during it (replacing the table inside blur throws `NotFoundError`).

## 7. Before you finish
- [ ] Dates checked before/after in Chrome; print and PDF on A4 and Folio give one page per schedule
- [ ] Same rule change made in ConsultingV6 (if it applies) and bidDocsGenerator
- [ ] `walkthrough.md` updated; commit on `ra12009-fixes` citing the IRR section
