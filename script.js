"use strict";

const activities = [
  ["Pre-Procurement Conference", 0, "anchor"],
  ["Advertisement / Posting of Invitation to Bid", 3, "after-preproc"],
  ["Pre-Bid Conference", 7, "after-advertisement"],
  ["Last Day of Clarification from Bidders", 9, "before-deadline"],
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
    "projectsList",
    "projectCount",
    "schedulesContainer",
    "generateBtn",
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
    ? holidays
        .map(
          (date) =>
            `<span class="tag">${readable(localDate(date))}<button type="button" data-date="${date}" aria-label="Remove ${date}">×</button></span>`,
        )
        .join("")
    : '<span class="empty-list">No non-working dates added</span>';
  els.holidayList.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      holidays = holidays.filter((d) => d !== b.dataset.date);
      storage("tup_gs_holidays", holidays);
      renderHolidays();
      invalidateResults();
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
    const isListed = holidays.includes(value);
    const classes = ["calendar-day", isListed ? "is-listed" : ""].filter(Boolean).join(" ");
    const label = `${readable(localDate(value))}${isListed ? ", already added as a non-working date" : ", add as a non-working date"}`;
    cells.push(`<button class="${classes}" type="button" data-date="${value}" ${isListed ? "disabled" : ""} aria-label="${label}">${day}</button>`);
  }
  els.holidayCalendarDays.innerHTML = cells.join("");
}
function renderProjects() {
  els.projectCount.textContent = projects.length;
  els.projectsList.innerHTML = projects.length
    ? projects
        .map(
          (p) =>
            `<article class="project-card"><div><h3>${escapeHtml(p.title)}</h3><p><strong>${money(p.abc)}</strong> · ${time12(p.startTime)}–${time12(p.endTime)}</p></div><div class="project-actions"><button class="icon-button edit-project" type="button" data-id="${p.id}" aria-label="Edit ${escapeHtml(p.title)}">Edit</button><button class="icon-button remove-project" type="button" data-id="${p.id}" aria-label="Remove ${escapeHtml(p.title)}">Remove</button></div></article>`,
        )
        .join("")
    : '<div class="empty-state"><h3>No projects added</h3><p>Add a project to begin building schedules.</p></div>';
  els.projectsList.querySelectorAll(".remove-project").forEach((b) =>
    b.addEventListener("click", () => {
      if (editingProjectId === b.dataset.id) resetProjectForm();
      projects = projects.filter((p) => p.id !== b.dataset.id);
      storage("tup_gs_projects", projects);
      renderProjects();
      invalidateResults();
      notify("Project removed.");
    }),
  );
  els.projectsList.querySelectorAll(".edit-project").forEach((b) =>
    b.addEventListener("click", () => beginProjectEdit(b.dataset.id)),
  );
}
function setExportState(enabled) {
  [
    els.exportCsvBtn,
    els.exportJsonBtn,
    els.downloadPdfBtn,
    els.printBtn,
  ].forEach((button) => (button.disabled = !enabled));
}
function invalidateResults() {
  const hadResults = lastSchedules.length > 0;
  lastSchedules = [];
  setExportState(false);
  if (hadResults)
    els.schedulesContainer.innerHTML =
      '<div class="empty-state"><h3>Schedules need updating</h3><p>A schedule setting changed. Generate schedules again to refresh the dates.</p></div>';
}
function validProject() {
  clearFormErrors();
  let ok = true;
  const title = els.projectTitle.value.trim(),
    raw = els.abcInput.value.trim().replace(/,/g, "");
  const abc = Number(raw),
    start = els.startTime.value,
    end = els.endTime.value;
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
  return ok ? { title, abc, start, end } : null;
}
function resetProjectForm() {
  editingProjectId = null;
  els.projectForm.reset();
  els.addProjectBtn.textContent = "Add project";
  els.cancelEditBtn.hidden = true;
  $("projectFormHeading").textContent = "Add a project";
  clearFormErrors();
}
function beginProjectEdit(id) {
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  editingProjectId = id;
  els.projectTitle.value = project.title;
  els.abcInput.value = Number(project.abc).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  els.startTime.value = project.startTime;
  els.endTime.value = project.endTime;
  els.addProjectBtn.textContent = "Save changes";
  els.cancelEditBtn.hidden = false;
  $("projectFormHeading").textContent = "Edit project";
  clearFormErrors();
  els.projectTitle.focus();
  $("projectFormHeading").scrollIntoView({ behavior: "smooth", block: "center" });
}
function computeSchedule(anchorISO) {
  const preproc = localDate(anchorISO),
    advertisement = nextWorking(shift(preproc, 3)),
    prebid = nextWorking(shift(advertisement, 7)),
    deadline = nextWorking(shift(prebid, 12));
  let current = preproc;
  return activities.map(([activity, days, type]) => {
    let date;
    if (type === "anchor") date = preproc;
    else if (type === "after-preproc") date = advertisement;
    else if (type === "after-advertisement") date = prebid;
    else if (type === "after-prebid") date = deadline;
    else if (type === "before-deadline")
      date = previousWorking(shift(deadline, -days));
    else date = addWorking(current, days);
    current = date;
    return { activity, date: readable(date), minDays: days, maxDays: days + 2 };
  });
}
function renderSchedules() {
  clearFormErrors();
  if (!els.preprocDate.value) {
    setError(
      "preprocError",
      "Select the pre-procurement conference date before generating.",
    );
    els.preprocDate.focus();
    return;
  }
  if (!isWorking(localDate(els.preprocDate.value))) {
    setError(
      "preprocError",
      "Choose a working day that is not listed as a non-working date.",
    );
    els.preprocDate.focus();
    return;
  }
  if (!projects.length) {
    notify("Add at least one project before generating schedules.", true);
    els.projectTitle.focus();
    return;
  }
  const createdAt = timestamp();
  lastSchedules = projects.map((project) => ({
    project,
    rows: computeSchedule(els.preprocDate.value),
    createdAt,
  }));
  els.schedulesContainer.innerHTML = lastSchedules
    .map(
      ({ project, rows, createdAt }) =>
        `<article class="project-schedule"><header class="schedule-head"><div class="schedule-brand"><img src="tup_logo.png" alt="Technological University of the Philippines logo" onerror="this.hidden=true"><div><p class="university-name">Technological University of the Philippines</p><p class="document-name">Goods &amp; Services Procurement Schedule</p></div></div><h3>${escapeHtml(project.title)}</h3><div class="metadata"><span><strong>ABC:</strong> ${money(project.abc)}</span><span><strong>Schedule time:</strong> ${time12(project.startTime)}–${time12(project.endTime)}</span><span><strong>Anchor date:</strong> ${readable(localDate(els.preprocDate.value))}</span></div></header><div class="table-wrap"><table class="schedule-table"><thead><tr><th scope="col">Procurement activity</th><th scope="col">Scheduled date</th><th scope="col">Minimum days</th><th scope="col">Maximum days</th></tr></thead><tbody>${rows.map((r) => `<tr><td data-label="Activity">${r.activity}</td><td data-label="Scheduled date">${r.date}</td><td data-label="Minimum days">${r.minDays}</td><td data-label="Maximum days">${r.maxDays}</td></tr>`).join("")}<tr class="total-days-row"><th scope="row" colspan="2">Total counted days</th><td data-label="Total minimum days">${rows.reduce((sum, r) => sum + r.minDays, 0)}</td><td data-label="Total maximum days">${rows.reduce((sum, r) => sum + r.maxDays, 0)}</td></tr></tbody></table></div><footer class="schedule-footer"><div class="signatory"><p>Prepared by:</p><div class="signature-line"></div><strong>Signature over printed name</strong><span>Procurement Office</span></div><div class="document-timestamps"><p><strong>Created:</strong> ${createdAt}</p><p><strong>Printed:</strong> <time class="output-printed-at">Not printed yet</time></p></div></footer></article>`,
    )
    .join("");
  setExportState(true);
  notify(
    `${lastSchedules.length} schedule${lastSchedules.length === 1 ? "" : "s"} generated.`,
  );
  $("results").focus({ preventScroll: true });
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
      "Start Time",
      "End Time",
      "Activity",
      "Scheduled Date",
      "Minimum Days",
      "Maximum Days",
    ],
  ];
  lastSchedules.forEach(({ project, rows: scheduleRows }) => {
    scheduleRows.forEach((r) =>
      rows.push([
        project.title,
        project.abc,
        project.startTime,
        project.endTime,
        r.activity,
        r.date,
        r.minDays,
        r.maxDays,
      ]),
    );
    rows.push([
      project.title,
      project.abc,
      project.startTime,
      project.endTime,
      "Total counted days",
      "",
      scheduleRows.reduce((sum, item) => sum + item.minDays, 0),
      scheduleRows.reduce((sum, item) => sum + item.maxDays, 0),
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
          conferenceDate: els.preprocDate.value,
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
  const maxScale = 1.18;
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
function fitSchedulesToPage(paper, margin) {
  els.schedulesContainer
    .querySelectorAll(".project-schedule")
    .forEach((schedule) => fitScheduleToPage(schedule, paper, margin));
}
function resetScheduleFit() {
  els.schedulesContainer
    .querySelectorAll(".project-schedule")
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
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: paper.format, orientation: "portrait" },
  };
  const ratio =
    (paper.height - PDF_MARGIN_MM * 2) / (paper.width - PDF_MARGIN_MM * 2);
  try {
    stampOutputTime();
    // Render each schedule to its own canvas so every project is one page.
    const canvases = [];
    for (const schedule of els.schedulesContainer.querySelectorAll(
      ".project-schedule",
    )) {
      const page = document.createElement("div");
      page.className = "schedule-container compact-output";
      const scheduleCopy = schedule.cloneNode(true);
      page.appendChild(scheduleCopy);
      document.body.appendChild(page);
      page.style.position = "absolute";
      page.style.left = "-10000px";
      fitScheduleToPage(scheduleCopy, paper, PDF_MARGIN_MM);
      page.remove();
      page.style.position = "";
      page.style.left = "";
      const canvas = await window
        .html2pdf()
        .set(options)
        .from(page)
        .toCanvas()
        .get("canvas");
      canvases.push(fitCanvasToPage(canvas, ratio));
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
  if (!dayButton || dayButton.disabled) return;
  const date = dayButton.dataset.date;
  if (holidays.includes(date)) return;
  holidays = [...holidays, date].sort();
  storage("tup_gs_holidays", holidays);
  renderHolidays();
  invalidateResults();
  notify("Non-working date added.");
});
$("clearHolidaysBtn").addEventListener("click", () => {
  if (!holidays.length) return;
  if (window.confirm("Clear all listed non-working dates?")) {
    holidays = [];
    storage("tup_gs_holidays", holidays);
    renderHolidays();
    invalidateResults();
    notify("All non-working dates cleared.");
  }
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
      if (
        !Array.isArray(data.holidays) ||
        data.holidays.some(
          (d) =>
            typeof d !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
            isoDate(localDate(d)) !== d,
        )
      )
        throw new Error();
      holidays = [...new Set(data.holidays)].sort();
      storage("tup_gs_holidays", holidays);
      renderHolidays();
      invalidateResults();
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
    startTime: p.start,
    endTime: p.end,
  };
  if (editingProjectId) {
    projects = projects.map((project) => project.id === editingProjectId ? updatedProject : project);
  } else projects.push(updatedProject);
  const wasEditing = Boolean(editingProjectId);
  storage("tup_gs_projects", projects);
  resetProjectForm();
  renderProjects();
  invalidateResults();
  notify(wasEditing ? "Project changes saved." : "Project added.");
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
els.preprocDate.addEventListener("change", () => {
  setError("preprocError", "");
  invalidateResults();
});
$("generateBtn").addEventListener("click", renderSchedules);
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
  els.preprocDate.value = "";
  els.projectForm.reset();
  renderProjects();
  invalidateResults();
  els.schedulesContainer.innerHTML =
    '<div class="empty-state"><h3>No schedules yet</h3><p>Add one or more projects, select a conference date, then generate.</p></div>';
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
);
renderHolidays();
renderProjects();
