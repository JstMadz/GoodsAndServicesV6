# Walkthrough

## 2026-10-21 — One page per schedule in PDF and print
- Print: removed the 14mm bottom margin and `break-after: page` that pushed content onto blank sheets; replaced the named `@page a4/folio` rules with one `@page` injected from the paper-size select; schedules taller than the printable area are scaled with `zoom` so each stays on one sheet (`fitSchedulesToPage` in script.js).
- PDF: each schedule is rendered to its own canvas, padded to the page aspect ratio, and added as exactly one page, so html2pdf no longer slices a schedule across two pages.
- Verified headless (3 projects): PDF and print both produce 3 pages on A4 and Folio, no blank pages.
