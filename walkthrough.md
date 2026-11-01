# Walkthrough

## 2026-10-26 — RA 12009 checks under each schedule (branch `ra12009-fixes`)

- Each schedule card now lists the RA 12009 IRR periods it breaks, on screen only (hidden in print and the PDF): pre-bid at least 7 CD after posting and 12 CD before the deadline (51.2), clarification 10 CD / bulletin 7 CD (51.5.1), at most 45 CD from the last day of posting to the deadline (54.5; Infrastructure 50/65 CD noted), evaluation within 7 CD (61.2.5), post-qualification within 12 CD (63.8), award within 10 CD of the resolution (66.2) and 60 CD of the opening (67.1), signing within 10 CD of the Notice of Award (66.5). Below PhP 3M it notes that the pre-bid conference is optional (51.1). A period ending on a non-working day runs to the next working day (67.3). Checked against the GPPB copy of the IRR.
- The rules text said clarification is "9" days before the deadline; it is 10 since the 2026-10-25 fix. The sheet's header now says "RA 12009 and its IRR".
- Dates are unchanged (checked in Chrome before and after). These are the same checks as the Bidding Document Generator, which now has this scheduler built in; fixes made there are made here too.

## 2026-10-25 — Clarification deadline follows RA 12009 IRR 51.5.1

- "Last Day of Clarification from Bidders" moved from 9 to 10 calendar days before the bid deadline (then back to the previous working day). IRR 51.5.1 requires requests for clarification at least 10 CD before the deadline. With the 2026 holidays, the Internet Provider schedule had Nov 10 for a Nov 19 deadline (9 CD); it now gives Nov 9.
- Checked Infrastructure against RA 12009: posting (50.3.1), pre-bid (51.2), clarification/bulletin (51.5.1), evaluation (61.2.5, 61.7) and post-qualification (63.8) are the same as Goods. Only the maximum period from last posting day to bid submission differs (54.5: Goods 45 CD; Infrastructure 50 CD up to PhP 50M, 65 CD above), so this scheduler serves Goods, Services and Infrastructure.

## 2026-10-21 — One page per schedule in PDF and print
- Print: removed the 14mm bottom margin and `break-after: page` that pushed content onto blank sheets; replaced the named `@page a4/folio` rules with one `@page` injected from the paper-size select; schedules taller than the printable area are scaled with `zoom` so each stays on one sheet (`fitSchedulesToPage` in script.js).
- PDF: each schedule is rendered to its own canvas, padded to the page aspect ratio, and added as exactly one page, so html2pdf no longer slices a schedule across two pages.
- Verified headless (3 projects): PDF and print both produce 3 pages on A4 and Folio, no blank pages.
