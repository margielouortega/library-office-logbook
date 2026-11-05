const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "visitors.json");

app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}
function readVisitors() {
  ensureDataFile();
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Could not read visitors.json:", error.message);
    return [];
  }
}
function writeVisitors(visitors) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(visitors, null, 2), "utf8");
}
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}
function validateVisitor(body) {
  const visitorName = clean(body.visitorName);
  const purpose = clean(body.purpose);
  const office = clean(body.office);
  const visitDate = clean(body.visitDate);
  const timeIn = clean(body.timeIn);
  if (!visitorName || !purpose || !office || !visitDate || !timeIn) {
    return "Visitor name, purpose, office, date, and time-in are required.";
  }
  return null;
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "JSON file" }));

app.get("/api/visitors", (req, res) => {
  let visitors = readVisitors();
  const { date, month, office, search, status } = req.query;
  if (date) visitors = visitors.filter(v => v.visitDate === date);
  if (month) visitors = visitors.filter(v => v.visitDate.startsWith(month));
  if (office) visitors = visitors.filter(v => v.office === office);
  if (status === "inside") visitors = visitors.filter(v => !v.timeOut);
  if (status === "completed") visitors = visitors.filter(v => Boolean(v.timeOut));
  if (search) {
    const q = String(search).toLowerCase();
    visitors = visitors.filter(v =>
      [v.visitorName, v.purpose, v.office].some(value => String(value || "").toLowerCase().includes(q))
    );
  }
  visitors.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  res.json(visitors);
});

app.get("/api/visitors/:id", (req, res) => {
  const visitor = readVisitors().find(v => v.id === req.params.id);
  if (!visitor) return res.status(404).json({ message: "Visitor record not found." });
  res.json(visitor);
});

app.post("/api/visitors", (req, res) => {
  const error = validateVisitor(req.body);
  if (error) return res.status(400).json({ message: error });
  const visitors = readVisitors();
  const visitor = {
    id: crypto.randomUUID(),
    visitorName: clean(req.body.visitorName),
    purpose: clean(req.body.purpose),
    office: clean(req.body.office),
    visitDate: clean(req.body.visitDate),
    timeIn: clean(req.body.timeIn),
    timeOut: "",
    remarks: clean(req.body.remarks),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  visitors.push(visitor);
  writeVisitors(visitors);
  res.status(201).json(visitor);
});

app.put("/api/visitors/:id", (req, res) => {
  const visitors = readVisitors();
  const index = visitors.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Visitor record not found." });
  const current = visitors[index];
  const updated = {
    ...current,
    visitorName: clean(req.body.visitorName ?? current.visitorName),
    purpose: clean(req.body.purpose ?? current.purpose),
    office: clean(req.body.office ?? current.office),
    visitDate: clean(req.body.visitDate ?? current.visitDate),
    timeIn: clean(req.body.timeIn ?? current.timeIn),
    timeOut: clean(req.body.timeOut ?? current.timeOut),
    remarks: clean(req.body.remarks ?? current.remarks),
    updatedAt: new Date().toISOString()
  };
  const error = validateVisitor(updated);
  if (error) return res.status(400).json({ message: error });
  visitors[index] = updated;
  writeVisitors(visitors);
  res.json(updated);
});

app.patch("/api/visitors/:id/time-out", (req, res) => {
  const visitors = readVisitors();
  const index = visitors.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Visitor record not found." });
  if (visitors[index].timeOut) return res.status(400).json({ message: "Time-out is already recorded." });
  const timeOut = clean(req.body.timeOut) || new Date().toTimeString().slice(0, 5);
  visitors[index] = { ...visitors[index], timeOut, updatedAt: new Date().toISOString() };
  writeVisitors(visitors);
  res.json(visitors[index]);
});

app.delete("/api/visitors/:id", (req, res) => {
  const visitors = readVisitors();
  const remaining = visitors.filter(v => v.id !== req.params.id);
  if (remaining.length === visitors.length) return res.status(404).json({ message: "Visitor record not found." });
  writeVisitors(remaining);
  res.json({ message: "Visitor record deleted successfully." });
});

app.get("/api/reports/summary", (req, res) => {
  let visitors = readVisitors();
  const { date, month, office } = req.query;
  if (date) visitors = visitors.filter(v => v.visitDate === date);
  if (month) visitors = visitors.filter(v => v.visitDate.startsWith(month));
  if (office) visitors = visitors.filter(v => v.office === office);
  const byOffice = visitors.reduce((acc, v) => {
    acc[v.office] = (acc[v.office] || 0) + 1;
    return acc;
  }, {});
  res.json({
    totalVisits: visitors.length,
    currentlyInside: visitors.filter(v => !v.timeOut).length,
    completedVisits: visitors.filter(v => Boolean(v.timeOut)).length,
    byOffice,
    records: visitors
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Library Office Log Book API running at http://localhost:${PORT}`);
  console.log(`JSON data file: ${DATA_FILE}`);
});