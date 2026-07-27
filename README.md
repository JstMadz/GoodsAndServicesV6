# TUP Goods and Services Procurement Scheduling System

![License](https://img.shields.io/badge/License-MIT-green.svg)
![HTML](https://img.shields.io/badge/HTML5-orange.svg)
![CSS](https://img.shields.io/badge/CSS3-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)

## Overview

The **TUP Goods and Services Procurement Scheduling System** is a web-based application developed to automate the preparation of procurement schedules for **Goods and Services** in accordance with the **Government Procurement Reform Act** and its Implementing Rules and Regulations (IRR).

The application automatically generates procurement activity schedules while considering:

* Government procurement timeline requirements
* Weekends (Saturday and Sunday)
* User-defined holidays
* Adjustable activity durations
* Automatic schedule recalculation

The system is designed to reduce manual computation errors, improve compliance with procurement regulations, and simplify schedule preparation for procurement offices.

---

# Features

## Automatic Procurement Schedule Generation

Generates procurement schedules beginning with the **Pre-Procurement Conference** and automatically computes all succeeding procurement activities.

Activities included:

* Pre-Procurement Conference
* Advertisement / Posting of Invitation to Bid
* Pre-Bid Conference
* Deadline of Submission and Receipt of Bids / Bid Opening
* Bid Evaluation
* Post-Qualification
* Approval of Resolution / Issuance of Notice of Award
* Contract Preparation and Signing
* Approval of Contract by Higher Authority
* Issuance of Notice to Proceed

---

## Automatic Rule Enforcement

The system automatically follows procurement timing rules before any manual adjustment.

### Implemented Rules

### Advertisement

Automatically scheduled after the Pre-Procurement Conference.

---

### Pre-Bid Conference

Automatically scheduled:

* **7 Calendar Days after Advertisement / Posting**
* Adjusts automatically whenever the resulting date falls on:

  * Saturday
  * Sunday
  * Declared Holiday

---

### Deadline of Submission and Receipt of Bids

Automatically scheduled:

* **12 Calendar Days after the Pre-Bid Conference**

* Automatically moves to the next working day if the computed date falls on:

* Saturday

* Sunday

* Holiday

Example:

| Activity           | Date                      |
| ------------------ | ------------------------- |
| Pre-Bid Conference | October 14, 2025          |
| +12 Calendar Days  | October 26, 2025 (Sunday) |
| Final Schedule     | October 27, 2025 (Monday) |

---

## Holiday Management

The application allows users to manage holidays through a calendar-based interface.

Features include:

* Add holidays using Date Picker
* Remove holidays individually
* Store holidays in Local Storage
* Save holidays as a JSON file
* Load holidays from a JSON file

The scheduling engine automatically skips all weekends and registered holidays.

---

## Adjustable Activity Durations

Each procurement activity includes an adjustment field allowing users to:

* Extend activity durations
* Shorten durations when permitted
* Automatically recompute all succeeding procurement dates

---

## Interactive Gantt Chart

The generated schedule is visualized using a Gantt Chart.

Features:

* Timeline visualization
* Actual activity durations
* Automatic resizing
* Printable
* Included in exported PDF

---

## Export Options

Generate procurement schedules in multiple formats.

Supported exports:

* CSV
* JSON
* PDF
* Print-ready Schedule

---

## Project Information

The application allows entry of:

* Project Title
* Approved Budget for the Contract (ABC)

These are automatically included in:

* Printed Schedule
* PDF Export
* CSV Metadata
* JSON Metadata

---

# Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Chart.js
* html2pdf.js
* Local Storage API

---

# Project Structure

```
Goods-and-Services-Scheduler/
│
├── index.html
├── style.css
├── script.js
├── tup_logo.png
├── README.md
└── holidays.json (optional)
```

---

# Installation

Clone the repository.

```bash
git clone https://github.com/yourusername/Goods-and-Services-Scheduler.git
```

Open the project folder.

```bash
cd Goods-and-Services-Scheduler
```

Open **index.html** using:

* VS Code Live Server (Recommended)
* Google Chrome
* Microsoft Edge
* Mozilla Firefox

No installation is required.

---

# How to Use

## Step 1

Enter the:

* Project Title
* Approved Budget for the Contract (ABC)

---

## Step 2

Select the **Pre-Procurement Conference Date**.

---

## Step 3

(Optional)

Add holidays using the calendar picker.

---

## Step 4

Click

**Generate Schedule**

The application automatically computes all procurement activities.

---

## Step 5

If necessary,

adjust activity durations.

The schedule updates automatically.

---

## Step 6

Export the generated schedule.

Available formats:

* CSV
* JSON
* PDF
* Print

---

# Procurement Logic

The scheduling engine automatically:

* Computes procurement activities sequentially
* Skips Saturdays
* Skips Sundays
* Skips user-defined holidays
* Enforces mandatory procurement timing rules
* Recalculates succeeding activities after every adjustment

---

# Browser Compatibility

Tested on:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox

---

# Future Enhancements

Planned improvements include:

* Multi-project scheduling
* Annual procurement calendar
* Procurement dashboard
* Automatic Philippine holiday API integration
* Critical path analysis
* Resource loading
* Procurement milestone notifications
* Excel export (.xlsx)
* Dark Mode
* Multi-user support
* Database integration
* User authentication
* RA 12009 enhanced procurement workflow
* Electronic approval workflow

---

# License

This project is released under the **MIT License**.

You are free to use, modify, and distribute this project subject to the terms of the license.

---

# Acknowledgments

This project was developed to support procurement planning and scheduling within the **Technological University of the Philippines (TUP)** and to assist procurement practitioners in preparing compliant schedules for **Goods and Services Procurement**.

The scheduling logic is based on applicable Philippine government procurement policies and working-day scheduling practices.

---

# Author

**Madz Amador**

Faculty Member
Bachelor of Science in Information Systems (BSIS)
Technological University of the Philippines

---

If you find this project useful, consider giving it a ⭐ on GitHub.
