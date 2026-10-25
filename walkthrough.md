# Walkthrough

## 2026-10-25 — Clarification deadline follows RA 12009 IRR 51.5.1

- "Last Day of Clarification from Bidders" moved from 9 to 10 calendar days before the bid deadline (then back to the previous working day). IRR 51.5.1 requires requests for clarification at least 10 CD before the deadline. With the 2026 holidays, the Internet Provider schedule had Nov 10 for a Nov 19 deadline (9 CD); it now gives Nov 9.
- Checked Infrastructure against RA 12009: posting (50.3.1), pre-bid (51.2), clarification/bulletin (51.5.1), evaluation (61.2.5, 61.7) and post-qualification (63.8) are the same as Goods. Only the maximum period from last posting day to bid submission differs (54.5: Goods 45 CD; Infrastructure 50 CD up to PhP 50M, 65 CD above), so this scheduler serves Goods, Services and Infrastructure.

## 2026-10-21 — One page per schedule in PDF and print
- Print: removed the 14mm bottom margin and `break-after: page` that pushed content onto blank sheets; replaced the named `@page a4/folio` rules with one `@page` injected from the paper-size select; schedules taller than the printable area are scaled with `zoom` so each stays on one sheet (`fitSchedulesToPage` in script.js).
- PDF: each schedule is rendered to its own canvas, padded to the page aspect ratio, and added as exactly one page, so html2pdf no longer slices a schedule across two pages.
- Verified headless (3 projects): PDF and print both produce 3 pages on A4 and Folio, no blank pages.
