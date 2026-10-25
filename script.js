"use strict";

const activities = [
  ["Pre-Procurement Conference", 0, "anchor"],
  ["Advertisement / Posting of Invitation to Bid", 3, "after-preproc"],
  ["Pre-Bid Conference", 7, "after-advertisement"],
  // RA 12009 IRR 51.5.1: clarifications at least 10 CD, bid bulletins at least 7 CD, before the deadline.
  ["Last Day of Clarification from Bidders", 10, "before-deadline"],
  ["Posting of Supplemental Bid Bulletin", 7, "before-deadline"],
  [
    "Deadline of Submission and Receipt of Bids / Bid Opening",
    12,
    "after-prebid",
  ],
  ["Bid Evaluation", 3, "working"],
  ["Post-Qualification", 5, "working"],
  ["Approval of Resolution / Issuance of Notice of Award", 3, "working"],
  ["Contract Preparation and Signing", 5, "working"],
  ["Approval of Contract by Higher Authority", 3, "working"],
  ["Issuance of Notice to Proceed", 2, "working"],
];
const $ = (id) => document.getElementById(id);
const els = Object.fromEntries(
  [
    "preprocDate",
    "holidayList",
    "projectForm",
    "projectTitle",
    "abcInput",
    "startTime",
    "endTime",
    "projectCount",
    "schedulesContainer",
    "resetBtn",
    "exportCsvBtn",
    "exportJsonBtn",
    "downloadPdfBtn",
    "printBtn",
    "loadHolidaysFile",
    "appStatus",
    "addProjectBtn",
    "cancelEditBtn",
    "paperSize",
    "holidayCalendarMonth",
    "holidayCalendarDays",
  ].map((id) => [id, $(id)]),
);
let holidays = [],
  projects = [],
  lastSchedules = [],
  editingProjectId = null,
  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12);

function localDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
function isoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function shift(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function isWorking(date) {
  return ![0, 6].includes(date.getDay()) && !holidays.includes(isoDate(date));
}
function nextWorking(date) {
  let d = new Date(date);
  while (!isWorking(d)) d = shift(d, 1);
  return d;
}
function previousWorking(date) {
  let d = new Date(date);
  while (!isWorking(d)) d = shift(d, -1);
  return d;
}
function addWorking(date, days) {
  let d = new Date(date),
    count = 0;
  while (count < days) {
    d = shift(d, 1);
    if (isWorking(d)) count++;
  }
  return d;
}
function readable(date) {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
function timestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
function time12(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function money(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}
function escapeHtml(value) {
  const d = document.createElement("div");
  d.textContent = value;
  return d.innerHTML;
}
function notify(message, error = false) {
  els.appStatus.textContent = message;
  els.appStatus.hidden = false;
  els.appStatus.classList.toggle("error", error);
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    els.appStatus.hidden = true;
  }, 6000);
}
function storage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    notify("Your browser could not save this change locally.", true);
  }
}
function safeLoad(key) {
  try {
    const val = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}
function setError(id, message) {
  const error = $(id);
  const field = error.closest(".field");
  error.textContent = message;
  field?.classList.toggle("invalid", Boolean(message));
}
function clearFormErrors() {
  ["titleError", "abcError", "startError", "endError", "preprocError"].forEach(
    (id) => setError(id, ""),
  );
}

function renderHolidays() {
  els.holidayList.innerHTML = holidays.length
    ? `<p class="holiday-summary">${holidays.length} non-working date${holidays.length === 1 ? "" : "s"} selected</p><ul>${holidays
        .map(
          (date) =>
            `<li>${readable(localDate(date))}<button class="remove-holiday" type="button" data-date="${date}" aria-label="Remove ${readable(localDate(date))}">×</button></li>`,
        )
        .join("")}</ul>`
    : '<p class="holiday-empty">No dates selected. Weekends are always excluded.</p>';
  $("clearHolidaysBtn").disabled = holidays.length === 0;
  els.holidayList.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      holidays = holidays.filter((d) => d !== b.dataset.date);
      storage("tup_gs_holidays", holidays);
      renderHolidays();
      renderSchedules();
      notify("Non-working date removed.");
    }),
  );
  renderHolidayCalendar();
}
function renderHolidayCalendar() {
  els.holidayCalendarMonth.textContent = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(calendarMonth);
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstWeekday = new Date(year, month, 1, 12).getDay();
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-empty" aria-hidden="true"></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const value = isoDate(new Date(year, month, day, 12));
    const selected = holidays.includes(value);
    const label = `${readable(localDate(value))}${selected ? ", selected" : ""}`;
    cells.push(`<button class="calendar-day${selected ? " is-selected" : ""}" type="button" data-date="${value}" aria-pressed="${selected}" aria-label="${label}">${day}</button>`);
  }
  els.holidayCalendarDays.innerHTML = cells.join("");
}
function renderSchedules() {
  lastSchedules = projects
    .filter((project) => validDate(project.preprocDate))
    .map((project) => ({
      project,
      rows: computeSchedule(project.preprocDate, project.adjustments || {}),
      createdAt: project.createdAt || timestamp(),
    }));
  els.schedulesContainer.innerHTML = projects.length
    ? projects
        .map((project) => {
          const schedule = lastSchedules.find((item) => item.project.id === project.id);
          return schedule
            ? renderScheduleCard(schedule)
            : `<article class="project-schedule legacy-project" data-id="${project.id}"><div class="schedule-title-row"><h3>${escapeHtml(project.title)}</h3><div class="project-actions"><button class="button button-outline edit-project" type="button" data-id="${project.id}">Complete setup</button><button class="button button-danger remove-project" type="button" data-id="${project.id}">Remove project</button></div></div><p>This saved project needs a pre-procurement conference date. Edit its setup to generate a schedule.</p></article>`;
        })
        .join("")
    : '<div class="empty-state"><h3>No schedules yet</h3><p>Complete Steps 1 and 2, then generate a project schedule.</p></div>';
  $("results").hidden = projects.length === 0;
  els.projectCount.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}${lastSchedules.length === projects.length ? " ready to print or save as PDF" : " · some need setup"}`;
  setExportState(lastSchedules.length > 0);

  els.schedulesContainer.querySelectorAll(".remove-project").forEach((button) =>
    button.addEventListener("click", () => {
      if (editingProjectId === button.dataset.id) resetProjectForm();
      projects = projects.filter((project) => project.id !== button.dataset.id);
      storage("tup_gs_projects", projects);
      renderSchedules();
      notify("Project schedule removed.");
    }),
  );
  els.schedulesContainer.querySelectorAll(".edit-project").forEach((button) =>
    button.addEventListener("click", () => beginProjectEdit(button.dataset.id)),
  );
  els.schedulesContainer.querySelectorAll(".adjust-input").forEach((input) =>
    input.addEventListener("change", () => {
      const value = Number(input.value);
      const error = input.nextElementSibling;
      if (!Number.isInteger(value) || value < 0 || value > 3650) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = "Use a whole number from 0 to 3,650.";
        return;
      }
      const project = projects.find((item) => item.id === input.dataset.id);
      if (!project) return;
      project.adjustments ||= {};
      project.adjustments[input.dataset.index] = value;
      storage("tup_gs_projects", projects);
      notify("Additional days updated; the schedule dates have been recalculated.");
      window.setTimeout(renderSchedules, 0);
    }),
  );
}
function renderScheduleCard({ project, rows, createdAt }) {
  const start = localDate(project.preprocDate);
  const totalMin = rows.reduce((sum, row) => sum + row.minDays, 0);
  const totalMax = rows.reduce((sum, row) => sum + row.maxDays, 0);
  const totalAdditional = rows.reduce((sum, row) => sum + row.extra, 0);
  const last = rows.at(-1);
  return `<article class="project-schedule" data-id="${project.id}">
    <header class="schedule-brand"><img src="tup_logo.png" alt=""><div><p class="university-name">Technological University of the Philippines – Manila</p><p class="document-name">Goods &amp; Services Procurement Schedule</p></div></header>
    <div class="schedule-head">
      <div class="schedule-title-row"><h3>${escapeHtml(project.title)}</h3><div class="project-actions"><button type="button" class="button button-outline edit-project" data-id="${project.id}">Edit project</button><button type="button" class="button button-danger remove-project" data-id="${project.id}">Remove project</button></div></div>
      <div class="metadata"><span><strong>ABC:</strong> ${money(project.abc)}</span><span><strong>Schedule time:</strong> ${time12(project.startTime)}–${time12(project.endTime)}</span><span><strong>Anchor date:</strong> ${readable(start)}</span></div>
    </div>
    <div class="table-container table-wrap" role="region" tabindex="0" aria-label="Schedule details. Scroll horizontally to view all columns.">
      <table class="schedule-table"><thead><tr><th scope="col">Procurement activity</th><th scope="col">Minimum days</th><th scope="col">Maximum days</th><th scope="col">Additional days</th><th scope="col">Scheduled date</th><th scope="col">Elapsed calendar days</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.activity)}</td><td>${row.minDays}</td><td>${row.maxDays}</td><td><input class="adjust-input" type="number" min="0" max="3650" step="1" value="${row.extra}" data-id="${project.id}" data-index="${row.index}" aria-label="Additional days for ${escapeHtml(row.activity)}" ${row.index === 0 ? 'disabled title="The pre-procurement date is the schedule anchor."' : ""}><span class="row-error"></span></td><td>${row.date}</td><td>${between(start, row.dateValue)}</td></tr>`).join("")}</tbody>
      <tfoot><tr class="total-days-row"><th scope="row">TOTAL COUNTED DAYS</th><td>${totalMin.toLocaleString("en-PH")}</td><td>${totalMax.toLocaleString("en-PH")}</td><td>${totalAdditional.toLocaleString("en-PH")}</td><td></td><td>${between(start, last.dateValue).toLocaleString("en-PH")}</td></tr></tfoot></table>
    </div>
    <footer class="schedule-footer"><div class="signatory"><p>Prepared by:</p><div class="signature-line"></div><strong>Signature over printed name</strong><span>Procurement Office</span></div><div class="document-timestamps"><p><strong>Created:</strong> ${createdAt}</p><p><strong>Printed:</strong> <time class="output-printed-at">Not printed yet</time></p></div></footer>
  </article>`;
}
function between(start, end) {
  return Math.round((end - start) / 86400000);
}
function setExportState(enabled) {
  [els.exportCsvBtn, els.exportJsonBtn, els.downloadPdfBtn, els.printBtn].forEach(
    (button) => (button.disabled = !enabled),
  );
}
function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isoDate(localDate(value)) === value;
}
function validProject() {
  clearFormErrors();
  let ok = true;
  const title = els.projectTitle.value.trim(),
    raw = els.abcInput.value.trim().replace(/,/g, "");
  const abc = Number(raw),
    start = els.startTime.value,
    end = els.endTime.value,
    preprocDate = els.preprocDate.value;
  if (!title) {
    setError("titleError", "Enter a project title.");
    ok = false;
  } else if (title.length < 3) {
    setError(
      "titleError",
      "Use at least 3 characters so the project is identifiable.",
    );
    ok = false;
  } else if (
    projects.some(
      (p) => p.id !== editingProjectId && p.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase(),
    )
  ) {
    setError("titleError", "A project with this title already exists.");
    ok = false;
  }
  if (!validDate(preprocDate)) {
    setError("preprocError", "Choose a valid pre-procurement conference date.");
    ok = false;
  } else if (!isWorking(localDate(preprocDate))) {
    setError("preprocError", "Choose a working day that is not listed as a non-working date.");
    ok = false;
  }
  if (!raw) {
    setError("abcError", "Enter the approved budget.");
    ok = false;
  } else if (
    !/^\d+(\.\d{1,2})?$/.test(raw) ||
    !Number.isFinite(abc) ||
    abc <= 0
  ) {
    setError(
      "abcError",
      "Enter a positive amount with no more than 2 decimal places.",
    );
    ok = false;
  }
  if (!start) {
    setError("startError", "Enter a start time.");
    ok = false;
  }
  if (!end) {
    setError("endError", "Enter an end time.");
    ok = false;
  } else if (start && end <= start) {
    setError("endError", "End time must be after the start time.");
    ok = false;
  }
  return ok ? { title, abc, start, end, preprocDate } : null;
}
function resetProjectForm() {
  editingProjectId = null;
  els.projectForm.reset();
  els.addProjectBtn.textContent = "Generate project schedule";
  els.cancelEditBtn.hidden = true;
  clearFormErrors();
}
function beginProjectEdit(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  editingProjectId = id;
  els.projectTitle.value = project.title;
  els.abcInput.value = Number(project.abc).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  els.preprocDate.value = project.preprocDate || "";
  els.startTime.value = project.startTime;
  els.endTime.value = project.endTime;
  els.addProjectBtn.textContent = "Save changes";
  els.cancelEditBtn.hidden = false;
  clearFormErrors();
  els.projectTitle.focus();
  els.projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
function computeSchedule(anchorISO, adjustments = {}) {
  const extraDays = (index) => Math.max(0, Number(adjustments[index] || 0));
  const preproc = localDate(anchorISO),
    advertisement = nextWorking(shift(preproc, 3 + extraDays(1))),
    prebid = nextWorking(shift(advertisement, 7 + extraDays(2))),
    deadline = nextWorking(shift(prebid, 12 + extraDays(5)));
  let current = preproc;
  return activities.map(([activity, days, type], index) => {
    let date;
    const extra = extraDays(index);
    if (type === "anchor") date = preproc;
    else if (type === "after-preproc") date = advertisement;
    else if (type === "after-advertisement") date = prebid;
    else if (type === "after-prebid") date = deadline;
    else if (type === "before-deadline")
      date = previousWorking(shift(deadline, -(days + extra)));
    else date = addWorking(current, days + extra);
    current = date;
    return {
      activity,
      date: readable(date),
      dateValue: date,
      minDays: days,
      maxDays: days + 2,
      extra,
      index,
    };
  });
}
function download(filename, type, contents) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([contents], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}
function exportCsv() {
  if (!lastSchedules.length) return;
  const rows = [
    [
      "Project Title",
      "ABC",
      "Pre-procurement Conference Date",
      "Start Time",
      "End Time",
      "Activity",
      "Scheduled Date",
      "Minimum Days",
      "Maximum Days",
      "Additional Days",
    ],
  ];
  lastSchedules.forEach(({ project, rows: scheduleRows }) => {
    scheduleRows.forEach((r) =>
      rows.push([
        project.title,
        project.abc,
        project.preprocDate,
        project.startTime,
        project.endTime,
        r.activity,
        r.date,
        r.minDays,
        r.maxDays,
        r.extra,
      ]),
    );
    rows.push([
      project.title,
      project.abc,
      project.preprocDate,
      project.startTime,
      project.endTime,
      "Total counted days",
      "",
      scheduleRows.reduce((sum, item) => sum + item.minDays, 0),
      scheduleRows.reduce((sum, item) => sum + item.maxDays, 0),
      scheduleRows.reduce((sum, item) => sum + item.extra, 0),
    ]);
  });
  download(
    "tup-procurement-schedules.csv",
    "text/csv;charset=utf-8",
    rows
      .map((row) =>
        row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n"),
  );
}
function exportJson() {
  if (lastSchedules.length)
    download(
      "tup-procurement-schedules.json",
      "application/json",
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          conferenceDates: projects.map(({ title, preprocDate }) => ({ title, preprocDate })),
          holidays,
          schedules: lastSchedules,
        },
        null,
        2,
      ),
    );
}
function stampOutputTime() {
  const printedAt = timestamp();
  document
    .querySelectorAll(".output-printed-at")
    .forEach((item) => (item.textContent = printedAt));
}
// Paper sizes in mm; each schedule must fit inside one sheet minus margins.
const PAPER = {
  a4: { width: 210, height: 297, format: "a4" },
  folio: { width: 215.9, height: 330.2, format: [215.9, 330.2] },
};
const PRINT_MARGIN_MM = 5;
const PDF_MARGIN_MM = 4;
const MM_TO_PX = 96 / 25.4;
function selectedPaper() {
  return PAPER[els.paperSize.value] || PAPER.a4;
}
// Fit each schedule to one printable page while using extra Folio height too.
function fitScheduleToPage(schedule, paper, margin) {
  const width = (paper.width - margin * 2) * MM_TO_PX;
  const height = (paper.height - margin * 2 - 2) * MM_TO_PX;
  const maxScale = 1.8;
  schedule.style.zoom = "";
  schedule.style.width = `${width}px`;

  const naturalHeight = schedule.scrollHeight;
  let low = naturalHeight > height ? 0.5 : 1;
  let high = naturalHeight > height ? 1 : maxScale;
  for (let i = 0; i < 12; i++) {
    const scale = (low + high) / 2;
    schedule.style.zoom = String(scale);
    schedule.style.width = `${width / scale}px`;
    const fittedHeight = schedule.scrollHeight * scale;
    if (fittedHeight <= height) low = scale;
    else high = scale;
  }

  if (Math.abs(low - 1) < 0.005) {
    schedule.style.zoom = "";
    schedule.style.width = `${width}px`;
    return;
  }
  schedule.style.zoom = String(low);
  schedule.style.width = `${width / low}px`;
}
// Size PDF typography and row spacing before rasterizing. CSS zoom looks fine
// in the print dialog but can distort word spacing in html2canvas output.
function fitPdfScheduleToPage(schedule, paper, margin) {
  const width = (paper.width - margin * 2) * MM_TO_PX;
  const height = (paper.height - margin * 2 - 2) * MM_TO_PX;
  schedule.style.zoom = "";
  schedule.style.width = `${width}px`;
  schedule.classList.add("pdf-document");

  const naturalHeight = schedule.scrollHeight;
  let low = naturalHeight > height ? 0.45 : 1;
  let high = naturalHeight > height ? 1 : 1.55;
  for (let i = 0; i < 14; i++) {
    const scale = (low + high) / 2;
    schedule.style.setProperty("--pdf-layout-scale", String(scale));
    if (schedule.scrollHeight <= height) low = scale;
    else high = scale;
  }
  schedule.style.setProperty("--pdf-layout-scale", String(low));
}
function fitSchedulesToPage(paper, margin) {
  els.schedulesContainer
    .querySelectorAll(".project-schedule:not(.legacy-project)")
    .forEach((schedule) => fitScheduleToPage(schedule, paper, margin));
}
function resetScheduleFit() {
  els.schedulesContainer
    .querySelectorAll(".project-schedule:not(.legacy-project)")
    .forEach((schedule) => {
      schedule.style.zoom = "";
      schedule.style.width = "";
    });
}
function printSchedules() {
  if (!lastSchedules.length) return;
  const paper = selectedPaper();
  stampOutputTime();
  els.schedulesContainer.classList.add("compact-output");
  const pageStyle = document.createElement("style");
  pageStyle.textContent = `@page { size: ${paper.width}mm ${paper.height}mm; margin: ${PRINT_MARGIN_MM}mm; }`;
  document.head.appendChild(pageStyle);
  fitSchedulesToPage(paper, PRINT_MARGIN_MM);
  window.addEventListener(
    "afterprint",
    () => {
      els.schedulesContainer.classList.remove("compact-output");
      resetScheduleFit();
      pageStyle.remove();
    },
    { once: true },
  );
  window.print();
}
// Pads a canvas sideways so its aspect ratio fits one page; html2pdf then
// never slices it across a second sheet.
function fitCanvasToPage(canvas, ratio) {
  const width = Math.max(canvas.width, Math.ceil(canvas.height / ratio) + 1);
  if (width === canvas.width) return canvas;
  const fitted = document.createElement("canvas");
  fitted.width = width;
  fitted.height = canvas.height;
  const context = fitted.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, canvas.height);
  context.drawImage(canvas, Math.floor((width - canvas.width) / 2), 0);
  return fitted;
}
async function pdfSchedules() {
  if (!lastSchedules.length) return;
  if (typeof window.html2pdf !== "function") {
    notify(
      "PDF export is unavailable. Check your internet connection and try again.",
      true,
    );
    return;
  }
  const paper = selectedPaper();
  const options = {
    margin: PDF_MARGIN_MM,
    filename: "tup-procurement-schedules.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      onclone: (clonedDocument) => {
        clonedDocument
          .querySelectorAll(".html2pdf__overlay")
          .forEach((overlay) => (overlay.style.opacity = "1"));
      },
    },
    jsPDF: { unit: "mm", format: paper.format, orientation: "portrait" },
  };
  const ratio =
    (paper.height - PDF_MARGIN_MM * 2) / (paper.width - PDF_MARGIN_MM * 2);
  try {
    stampOutputTime();
    // Render each schedule to its own canvas so every project is one page.
    const canvases = [];
    for (const schedule of els.schedulesContainer.querySelectorAll(
      ".project-schedule:not(.legacy-project)",
    )) {
      const page = document.createElement("div");
      page.className = "schedule-container schedule-list compact-output pdf-export-source";
      const scheduleCopy = schedule.cloneNode(true);
      page.appendChild(scheduleCopy);
      document.body.appendChild(page);
      page.style.width = `${(paper.width - PDF_MARGIN_MM * 2) * MM_TO_PX}px`;
      page.style.margin = "0";
      page.style.padding = "0";
      page.style.overflow = "visible";
      fitPdfScheduleToPage(scheduleCopy, paper, PDF_MARGIN_MM);
      try {
        const canvas = await window
          .html2pdf()
          .set(options)
          .from(page)
          .toCanvas()
          .get("canvas");
        canvases.push(fitCanvasToPage(canvas, ratio));
      } finally {
        page.remove();
      }
    }
    let worker = window
      .html2pdf()
      .set(options)
      .from(canvases[0], "canvas")
      .toPdf();
    canvases.slice(1).forEach((canvas) => {
      worker = worker
        .get("pdf")
        .then((pdf) => pdf.addPage())
        .from(canvas, "canvas")
        .toPdf();
    });
    await worker.save();
  } catch {
    notify("PDF export could not be completed. Please try again.", true);
  }
}

$("holidayPrevMonth").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1, 12);
  renderHolidayCalendar();
});
$("holidayNextMonth").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1, 12);
  renderHolidayCalendar();
});
els.holidayCalendarDays.addEventListener("click", (event) => {
  const dayButton = event.target.closest("button[data-date]");
  if (!dayButton) return;
  const date = dayButton.dataset.date;
  holidays = holidays.includes(date)
    ? holidays.filter((item) => item !== date)
    : [...holidays, date].sort();
  storage("tup_gs_holidays", holidays);
  renderHolidays();
  renderSchedules();
  notify(holidays.includes(date) ? "Non-working date added." : "Non-working date removed.");
});
$("clearHolidaysBtn").addEventListener("click", () => {
  if (!holidays.length) return;
  holidays = [];
  storage("tup_gs_holidays", holidays);
  renderHolidays();
  renderSchedules();
  notify("Non-working dates cleared.");
});
$("saveHolidaysBtn").addEventListener("click", () =>
  download(
    "tup-non-working-dates.json",
    "application/json",
    JSON.stringify({ holidays }, null, 2),
  ),
);
$("loadHolidaysBtn").addEventListener("click", () =>
  els.loadHolidaysFile.click(),
);
els.loadHolidaysFile.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 1024 * 1024)
    return notify(
      "The selected file is too large. Use a JSON file under 1 MB.",
      true,
    );
  const reader = new FileReader();
  reader.onerror = () => notify("The selected file could not be read.", true);
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const importedHolidays = Array.isArray(data) ? data : data.holidays;
      if (
        !Array.isArray(importedHolidays) ||
        importedHolidays.some(
          (d) =>
            typeof d !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
            isoDate(localDate(d)) !== d,
        )
      )
        throw new Error();
      holidays = [...new Set(importedHolidays)].sort();
      storage("tup_gs_holidays", holidays);
      renderHolidays();
      renderSchedules();
      notify("Non-working dates imported.");
    } catch {
      notify(
        "Invalid file. Expected a JSON object with a holidays date list.",
        true,
      );
    }
  };
  reader.readAsText(file);
});
els.projectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = validProject();
  if (!p) return;
  const updatedProject = {
    id: editingProjectId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    title: p.title,
    abc: p.abc,
    preprocDate: p.preprocDate,
    startTime: p.start,
    endTime: p.end,
    adjustments: projects.find((project) => project.id === editingProjectId)?.adjustments || {},
    createdAt: projects.find((project) => project.id === editingProjectId)?.createdAt || timestamp(),
  };
  if (editingProjectId) {
    projects = projects.map((project) => project.id === editingProjectId ? updatedProject : project);
  } else projects.push(updatedProject);
  const wasEditing = Boolean(editingProjectId);
  storage("tup_gs_projects", projects);
  resetProjectForm();
  renderSchedules();
  notify(wasEditing ? "Project schedule updated." : "Project schedule generated and added.");
  els.projectTitle.focus();
});
els.cancelEditBtn.addEventListener("click", resetProjectForm);
function formatBudgetInput(value, keepTrailingDecimal = false) {
  const raw = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const [whole = "", ...decimalParts] = raw.split(".");
  const decimals = decimalParts.join("").slice(0, 2);
  const grouped = whole
    ? Number(whole).toLocaleString("en-PH", { maximumFractionDigits: 0 })
    : "";
  if (raw.includes(".")) return `${grouped || "0"}.${decimals}`;
  return keepTrailingDecimal ? `${grouped}.` : grouped;
}
els.abcInput.addEventListener("input", () => {
  const caretAtEnd = els.abcInput.selectionStart === els.abcInput.value.length;
  const hadDecimal = els.abcInput.value.endsWith(".");
  els.abcInput.value = formatBudgetInput(els.abcInput.value, hadDecimal);
  if (caretAtEnd)
    els.abcInput.setSelectionRange(
      els.abcInput.value.length,
      els.abcInput.value.length,
    );
});
els.abcInput.addEventListener("blur", () => {
  const raw = els.abcInput.value.trim().replace(/,/g, "");
  if (/^\d+(\.\d{1,2})?$/.test(raw) && Number(raw) > 0)
    els.abcInput.value = Number(raw).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
});
els.preprocDate.addEventListener("change", () => setError("preprocError", ""));
$("resetBtn").addEventListener("click", () => {
  if (
    !window.confirm(
      "Reset all projects, dates, and generated schedules? Your saved non-working dates will be kept.",
    )
  )
    return;
  projects = [];
  resetProjectForm();
  storage("tup_gs_projects", projects);
  renderSchedules();
  notify("Workspace reset. Non-working dates were kept.");
});
els.exportCsvBtn.addEventListener("click", exportCsv);
els.exportJsonBtn.addEventListener("click", exportJson);
els.printBtn.addEventListener("click", printSchedules);
els.downloadPdfBtn.addEventListener("click", pdfSchedules);
holidays = safeLoad("tup_gs_holidays").filter(
  (d) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    isoDate(localDate(d)) === d,
);
projects = safeLoad("tup_gs_projects").filter(
  (p) =>
    p &&
    typeof p.title === "string" &&
    Number.isFinite(Number(p.abc)) &&
    /^\d\d:\d\d$/.test(p.startTime) &&
    /^\d\d:\d\d$/.test(p.endTime),
).map((p) => ({ ...p, adjustments: p.adjustments || {}, createdAt: p.createdAt || timestamp() }));
renderHolidays();
renderSchedules();
