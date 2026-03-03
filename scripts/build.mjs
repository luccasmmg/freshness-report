import { mkdir, readFile, writeFile } from "node:fs/promises";

const INPUT_CSV = "freshness-report.csv";
const OUTPUT_DIR = "dist";
const OUTPUT_HTML = `${OUTPUT_DIR}/index.html`;

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      value = "";
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTable(rows) {
  if (rows.length === 0) {
    return "<p>No rows found in freshness-report.csv.</p>";
  }

  const [header, ...body] = rows;
  const thead = `<thead><tr>${header
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${body
    .map(
      (record) =>
        `<tr>${header
          .map((_, index) => `<td>${escapeHtml(record[index] ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("")}</tbody>`;

  return `<table>${thead}${tbody}</table>`;
}

const csvText = await readFile(INPUT_CSV, "utf8");
const rows = parseCsv(csvText);
const tableMarkup = renderTable(rows);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Freshness Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --line: #d8dde8;
      --header: #0f172a;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at 20% -10%, #dbeafe 0%, rgba(219, 234, 254, 0) 45%),
        radial-gradient(circle at 80% 0%, #fee2e2 0%, rgba(254, 226, 226, 0) 40%),
        var(--bg);
    }

    main {
      max-width: 100%;
      padding: 1rem;
    }

    .panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
    }

    h1 {
      margin: 0;
      font-size: 1.35rem;
      line-height: 1.2;
      color: var(--header);
      padding: 1rem;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(180deg, #ffffff, #f8fafc);
    }

    .meta {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
      padding: 0 1rem 1rem;
    }

    .table-wrap {
      overflow: auto;
      max-height: calc(100vh - 11rem);
    }

    table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
      background: var(--card);
    }

    th,
    td {
      border: 1px solid var(--line);
      padding: 0.55rem 0.6rem;
      text-align: left;
      vertical-align: top;
      font-size: 0.82rem;
      line-height: 1.35;
    }

    th {
      background: #e2e8f0;
      color: #0f172a;
      position: sticky;
      top: 0;
      z-index: 1;
    }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>Freshness Report</h1>
      <p class="meta">Generated from <code>${INPUT_CSV}</code></p>
      <div class="table-wrap">${tableMarkup}</div>
    </section>
  </main>
</body>
</html>
`;

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(OUTPUT_HTML, html, "utf8");

console.log(`Built ${OUTPUT_HTML} from ${INPUT_CSV}`);
