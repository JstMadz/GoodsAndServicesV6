/* Goods & Services Scheduler v6.0
   - Gantt removed
   - Multi-project with start/end time
   - Clarification (-9 days) & Supplemental (-7 days)
   - ABC formatted to ₱
   - Editable Maximum Days
   - Prints all projects on separate pages
   - Fully working Holiday add/remove/save/load
*/

/* ---------- Activities ---------- */
const activities = [
  {
    name: "Pre-Procurement Conference",
    base: 0,
    type: "start",
    key: "preproc",
  },
  {
    name: "Advertisement / Posting of Invitation to Bid",
    base: 3,
    type: "calendar",
    key: "advert",
  },
  { name: "Pre-Bid Conference", base: 7, type: "calendar", key: "prebid" },
  {
    name: "Last Day of Clarification from Bidders",
    base: null,
    type: "relative_before_deadline_9",
    key: "clarif",
  },
  {
    name: "Posting of Supplemental Bid Bulletin",
    base: null,
    type: "relative_before_deadline_7",
    key: "supp",
  },
  {
    name: "Deadline of Submission and Receipt of Bids / Bid Opening",
    base: 12,
    type: "calendar",
    key: "deadline",
  },
  { name: "Bid Evaluation", base: 3, type: "working", key: "bideval" },
  { name: "Post-Qualification", base: 5, type: "working", key: "postqual" },
  {
    name: "Approval of Resolution / Issuance of Notice of Award",
    base: 3,
    type: "working",
    key: "award",
  },
  {
    name: "Contract Preparation and Signing",
    base: 5,
    type: "working",
    key: "contract",
  },
  {
    name: "Approval of Contract by Higher Authority",
    base: 3,
    type: "working",
    key: "approval",
  },
  {
    name: "Issuance of Notice to Proceed",
    base: 2,
    type: "working",
    key: "ntp",
  },
];

/* ---------- Global Variables ---------- */
let holidays = [];
let projects = [];
let lastSchedules = [];

/* ---------- Utility Functions ---------- */
function toISODate(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().split("T")[0];
}

function addCalendarDays(date, days) {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function subCalendarDays(date, days) {
  const r = new Date(date);
  r.setDate(r.getDate() - days);
  return r;
}

function isWeekend(date) {
  return [0, 6].includes(new Date(date).getDay());
}

function isHolidayISO(iso) {
  return holidays.includes(iso);
}

function advanceToNextWorkingDay(date) {
  const r = new Date(date);
  while (isWeekend(r) || isHolidayISO(toISODate(r))) r.setDate(r.getDate() + 1);
  return r;
}

function retreatToPrevWorkingDay(date) {
  const r = new Date(date);
  while (isWeekend(r) || isHolidayISO(toISODate(r))) r.setDate(r.getDate() - 1);
  return r;
}

function addWorkingDays(startDate, days) {
  let r = new Date(startDate),
    added = 0;
  while (added < days) {
    r.setDate(r.getDate() + 1);
    if (!isWeekend(r) && !isHolidayISO(toISODate(r))) added++;
  }
  return r;
}

function formatReadableDate(date) {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const [hour, minute] = timeStr.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

function formatPeso(value) {
  if (value === "" || value === null || value === undefined) return "₱0.00";
  let n = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) n = 0;
  return (
    "₱" +
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function escapeHtml(s) {
  return (s || "").replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])
  );
}

/* ---------- HOLIDAYS SECTION ---------- */
const holidayPicker = document.getElementById("holidayPicker");
const addHolidayBtn = document.getElementById("addHolidayBtn");
const clearHolidaysBtn = document.getElementById("clearHolidaysBtn");
const loadHolidaysBtn = document.getElementById("loadHolidaysBtn");
const loadHolidaysFile = document.getElementById("loadHolidaysFile");
const saveHolidaysBtn = document.getElementById("saveHolidaysBtn");
const holidayList = document.getElementById("holidayList");

function renderHolidays() {
  if (!holidayList) return;
  holidayList.innerHTML = "";
  if (!holidays.length) {
    holidayList.innerHTML = `<div class="chip">(none)</div>`;
    return;
  }
  holidays.sort();
  holidays.forEach((h) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span>${h}</span> <button title="Remove ${h}">✕</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      holidays = holidays.filter((x) => x !== h);
      saveHolidaysLocal();
      renderHolidays();
    });
    holidayList.appendChild(chip);
  });
}

addHolidayBtn.addEventListener("click", () => {
  const v = holidayPicker.value;
  if (!v) return alert("Please pick a date first.");
  if (!holidays.includes(v)) {
    holidays.push(v);
    saveHolidaysLocal();
    renderHolidays();
  } else {
    alert("Holiday already added: " + v);
  }
  holidayPicker.value = "";
});
clearHolidaysBtn.addEventListener("click", () => {
  if (confirm("Clear all holidays?")) {
    holidays = [];
    saveHolidaysLocal();
    renderHolidays();
  }
});

saveHolidaysBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ holidays }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "holidays.json";
  a.click();
});
loadHolidaysBtn.addEventListener("click", () => loadHolidaysFile.click());
loadHolidaysFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      if (Array.isArray(json.holidays)) {
        holidays = json.holidays;
        saveHolidaysLocal();
        renderHolidays();
      } else alert("Invalid JSON format.");
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
});

function saveHolidaysLocal() {
  try {
    localStorage.setItem("tup_gs_holidays", JSON.stringify(holidays));
  } catch (e) {
    console.error("Failed to save holidays:", e);
  }
}

function loadHolidaysLocal() {
  try {
    const s = localStorage.getItem("tup_gs_holidays");
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) holidays = arr;
    }
  } catch (e) {
    console.error("Failed to load holidays:", e);
  }
}

/* ---------- PROJECTS ---------- */
const projectTitleInput = document.getElementById("projectTitle");
const abcInput = document.getElementById("abcInput");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectsList = document.getElementById("projectsList");
const preprocInput = document.getElementById("preprocDate");
const generateBtn = document.getElementById("generateBtn");
const printBtn = document.getElementById("printBtn");
const resetBtn = document.getElementById("resetBtn");
const schedulesContainer = document.getElementById("schedulesContainer");

function renderProjectsList() {
  projectsList.innerHTML = projects.length
    ? projects
        .map(
          (p) => `
        <div class="project-chip">
          <div class="proj-left">
            <div class="proj-title">${escapeHtml(p.title)}</div>
            <div class="proj-meta">ABC: ${p.abc} · ${p.startTime}–${
            p.endTime
          }</div>
          </div>
          <div><button data-id="${p.id}">🗑️</button></div>
        </div>`
        )
        .join("")
    : '<div class="chip">(none)</div>';
  projectsList.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      projects = projects.filter((p) => p.id !== btn.dataset.id);
      saveProjectsLocal();
      renderProjectsList();
    });
  });
}

function saveProjectsLocal() {
  localStorage.setItem("tup_gs_projects", JSON.stringify(projects));
}

function loadProjectsLocal() {
  projects = JSON.parse(localStorage.getItem("tup_gs_projects") || "[]");
}

addProjectBtn.addEventListener("click", () => {
  const title = projectTitleInput.value.trim();
  if (!title) return alert("Enter project title.");
  const start = startTimeInput.value,
    end = endTimeInput.value;
  if (!start || !end) return alert("Enter both start and end times.");
  const abc = formatPeso(abcInput.value);
  const id = Date.now().toString(36);
  projects.push({ id, title, abc, startTime: start, endTime: end });
  saveProjectsLocal();
  renderProjectsList();
  projectTitleInput.value =
    abcInput.value =
    startTimeInput.value =
    endTimeInput.value =
      "";
});

/* ---------- Compute Schedule ---------- */
function computeSchedule(preprocISO) {
  const preproc = new Date(preprocISO);
  const ad = advanceToNextWorkingDay(addCalendarDays(preproc, 3));
  const prebid = advanceToNextWorkingDay(addCalendarDays(ad, 7));
  const deadline = advanceToNextWorkingDay(addCalendarDays(prebid, 12));
  const clar = retreatToPrevWorkingDay(subCalendarDays(deadline, 9));
  const supp = retreatToPrevWorkingDay(subCalendarDays(deadline, 7));

  const rows = [];
  let current = new Date(preproc);
  activities.forEach((a) => {
    let computed = null;
    if (a.key === "preproc") computed = current;
    else if (a.key === "advert")
      computed = advanceToNextWorkingDay(addCalendarDays(preproc, a.base));
    else if (a.key === "prebid")
      computed = advanceToNextWorkingDay(addCalendarDays(ad, a.base));
    else if (a.key === "deadline")
      computed = advanceToNextWorkingDay(addCalendarDays(prebid, a.base));
    else if (a.key === "clarif") computed = clar;
    else if (a.key === "supp") computed = supp;
    else computed = addWorkingDays(current, a.base);
    current = new Date(computed);
    rows.push({
      activity: a.name,
      date: formatReadableDate(computed),
      minDays: a.base || 0,
      maxDays: (a.base || 0) + 2,
    });
  });
  return rows;
}

/* ---------- Render Schedules ---------- */
function renderSchedules() {
  schedulesContainer.innerHTML = "";
  if (!projects.length)
    return (schedulesContainer.innerHTML =
      "<div class='chip'>(No projects added)</div>");
  if (!preprocInput.value)
    return alert("Pick Pre-Procurement Conference date first.");
  const preprocISO = preprocInput.value;
  lastSchedules = [];

  projects.forEach((p, idx) => {
    const rows = computeSchedule(preprocISO);
    lastSchedules.push({ project: p, rows });

    const section = document.createElement("section");
    section.className = "project-schedule";
    section.style.pageBreakBefore = idx > 0 ? "always" : "auto";

    section.innerHTML = `
        <div class="proj-header" style="text-align:center;margin-bottom:15px;">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;">
            <img src="tup_logo.png" alt="TUP Logo" style="height:60px;">
            <div>
              <h1 class="tup-title" style="margin:0;color:#800000;font-size:22px;font-weight:700;">
                Technological University of the Philippines
              </h1>
              <h2 class="schedule-title" style="margin:4px 0 0 0;color:#444;font-size:16px;font-weight:600;">
                Goods & Services Procurement Schedule
              </h2>
            </div>
          </div>
          <div class="proj-meta" style="font-size:14px;color:#111;line-height:1.4;">
            <p style="margin:2px 0;"><strong>Project Title:</strong> <span>${escapeHtml(
              p.title
            )}</span></p>
            <p style="margin:2px 0;"><strong>ABC:</strong> <span>${
              p.abc
            }</span></p>
            <p style="margin:2px 0;">
              <strong>Time:</strong> 
              <span>${formatTime12h(p.startTime)} – ${formatTime12h(
      p.endTime
    )}</span>
            </p>
            <p style="margin:2px 0;"><strong>Generated:</strong> <span>${formatReadableDate(
              new Date()
            )}</span></p>
          </div>
        </div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Computed Date</th>
              <th>Min Days</th>
              <th>Max Days</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
                <tr>
                  <td>${r.activity}</td>
                  <td>${r.date}</td>
                  <td>${r.minDays}</td>
                  <td>${r.maxDays}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `;

    schedulesContainer.appendChild(section);
  });
}

generateBtn.addEventListener("click", renderSchedules);

/* ---------- Download PDF (Each Project on Its Own Page with Header) ---------- */
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

downloadPdfBtn.addEventListener("click", async () => {
  if (!lastSchedules.length) return alert("Generate schedule first.");

  const opt = {
    margin: [10, 10, 10, 10],
    filename: "TUP_Goods_Services_Schedules.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  const container = document.createElement("div");

  // Loop through each project schedule and create one page per project
  lastSchedules.forEach((sched, idx) => {
    const section = document.createElement("section");
    section.style.pageBreakBefore = idx > 0 ? "always" : "auto";
    section.style.marginBottom = "30px";

    section.innerHTML = `
      <div class="proj-header" style="text-align:center;margin-bottom:15px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;">
          <img src="tup_logo.png" alt="TUP Logo" style="height:60px;">
          <div>
            <h1 style="margin:0;color:#800000;font-size:22px;font-weight:700;">
              Technological University of the Philippines
            </h1>
            <h2 style="margin:4px 0 0 0;color:#444;font-size:16px;font-weight:600;">
              Goods & Services Procurement Schedule
            </h2>
          </div>
        </div>
        <hr style="border:1px solid #800000;width:80%;margin:10px auto;">
        <div style="font-size:14px;color:#111;line-height:1.4;">
          <p style="margin:2px 0;"><strong>Project Title:</strong> <span>${escapeHtml(
            sched.project.title
          )}</span></p>
          <p style="margin:2px 0;"><strong>ABC:</strong> <span>${
            sched.project.abc
          }</span></p>
          <p style="margin:2px 0;">
            <strong>Time:</strong> 
            <span>${formatTime12h(sched.project.startTime)} – ${formatTime12h(
      sched.project.endTime
    )}</span>
          </p>

          <p style="margin:2px 0;"><strong>Generated:</strong> <span>${formatReadableDate(
            new Date()
          )}</span></p>
        </div>
      </div>
      <table class="schedule-table" style="width:100%;border-collapse:collapse;margin-top:8px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="border:1px solid #ccc;padding:8px;text-align:left;">Activity</th>
            <th style="border:1px solid #ccc;padding:8px;text-align:left;">Computed Date</th>
            <th style="border:1px solid #ccc;padding:8px;text-align:left;">Min Days</th>
            <th style="border:1px solid #ccc;padding:8px;text-align:left;">Max Days</th>
          </tr>
        </thead>
        <tbody>
          ${sched.rows
            .map(
              (r) => `
              <tr>
                <td style="border:1px solid #ccc;padding:8px;">${r.activity}</td>
                <td style="border:1px solid #ccc;padding:8px;">${r.date}</td>
                <td style="border:1px solid #ccc;padding:8px;">${r.minDays}</td>
                <td style="border:1px solid #ccc;padding:8px;">${r.maxDays}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    container.appendChild(section);
  });

  await html2pdf().set(opt).from(container).save();
});

/* ---------- Print (Each Project on Its Own Page with Header) ---------- */
printBtn.addEventListener("click", () => {
  if (!lastSchedules.length) return alert("Generate schedule first.");
  const win = window.open("", "_blank");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Print All Projects</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 20px; color: #111; }
        section { page-break-after: always; margin-bottom: 40px; }
        h1 { color: #800000; margin: 0; font-size: 22px; font-weight: 700; }
        h2 { color: #444; margin: 4px 0 0 0; font-size: 16px; font-weight: 600; }
        .proj-header { text-align: center; margin-bottom: 15px; }
        .proj-header .header-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
        .proj-header img { height: 60px; }
        hr { border: 1px solid #800000; width: 80%; margin: 10px auto; }
        .proj-meta p { margin: 2px 0; font-size: 14px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
      </style></head><body>`);

  // Write each project on a new page
  lastSchedules.forEach((sched, idx) => {
    win.document.write(`
        <section>
          <div class="proj-header">
            <div class="header-row">
              <img src="tup_logo.png" alt="TUP Logo">
              <div>
                <h1>Technological University of the Philippines</h1>
                <h2>Goods & Services Procurement Schedule</h2>
              </div>
            </div>
            <hr>
            <div class="proj-meta">
              <p><strong>Project Title:</strong> <span>${escapeHtml(
                sched.project.title
              )}</span></p>
              <p><strong>ABC:</strong> <span>${sched.project.abc}</span></p>
              <p><strong>Time:</strong> <span>${formatTime12h(
                sched.project.startTime
              )} – ${formatTime12h(sched.project.endTime)}</span></p>

              <p><strong>Generated:</strong> <span>${formatReadableDate(
                new Date()
              )}</span></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Computed Date</th>
                <th>Min Days</th>
                <th>Max Days</th>
              </tr>
            </thead>
            <tbody>
              ${sched.rows
                .map(
                  (r) => `
                  <tr>
                    <td>${r.activity}</td>
                    <td>${r.date}</td>
                    <td>${r.minDays}</td>
                    <td>${r.maxDays}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </section>
      `);
  });

  win.document.write("</body></html>");
  win.document.close();
  setTimeout(() => win.print(), 300);
});

/* ---------- Reset ---------- */
resetBtn.addEventListener("click", () => {
  if (!confirm("Reset all?")) return;
  holidays = [];
  projects = [];
  saveHolidaysLocal();
  saveProjectsLocal();
  renderHolidays();
  renderProjectsList();
  schedulesContainer.innerHTML = "";
  lastSchedules = [];
  preprocInput.value = "";
});

/* ---------- Init ---------- */
window.addEventListener("load", () => {
  loadHolidaysLocal();
  loadProjectsLocal();
  renderHolidays();
  renderProjectsList();
});
