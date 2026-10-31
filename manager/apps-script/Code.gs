/**
 * Izyan Tech Manager — Google Sheets sync backend (Apps Script Web App)
 *
 * Row-level sync. Every record is one row, matched by `id`. The full record is kept
 * in the `json` column; the other columns are a readable copy for you to look at in the Sheet.
 *  - push : upsert rows by id under a script lock. A row is replaced only when the incoming
 *           version is newer (higher `rev`; equal `rev` -> later `updatedAt`).
 *  - pull : returns rows whose `serverUpdatedAt` is newer than the caller's cursor.
 * Every request must carry the secret key saved in Script Properties as SECRET_KEY.
 *
 * Setup: see SETUP.md (run setupSheet() once, set SECRET_KEY, deploy as Web App).
 */

var COMMON = ['id', 'rev', 'updatedAt', 'updatedBy', 'deleted', 'serverUpdatedAt'];

var TABLES = {
  Clients:  ['name', 'business', 'phone', 'city', 'createdAt'],
  Orders:   ['orderNo', 'date', 'clientName', 'packages', 'total', 'paymentMode', 'downPayment', 'emiMonths', 'stage'],
  Payments: ['date', 'orderNo', 'clientName', 'amount', 'method', 'reference'],
  Invoices: ['invoiceNo', 'kind', 'date', 'orderNo', 'clientName', 'amount'],
  Settings: ['key']
};

var NUMERIC = { rev: 1, serverUpdatedAt: 1, total: 1, downPayment: 1, emiMonths: 1, amount: 1 };

/* ------------------------------------------------------------------ entry points */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!checkKey_(p.key)) return json_({ ok: false, error: 'BAD_KEY' });
  return json_({ ok: true, app: 'izyan-tech-manager', serverTime: Date.now() });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'BAD_JSON' });
  }
  if (!checkKey_(body.key)) return json_({ ok: false, error: 'BAD_KEY' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return json_({ ok: false, error: 'BUSY' });
  }
  try {
    if (body.action === 'ping') return json_({ ok: true, app: 'izyan-tech-manager', serverTime: Date.now() });
    if (body.action === 'push') return json_(push_(body));
    if (body.action === 'pull') return json_(pull_(body));
    return json_({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return json_({ ok: false, error: 'SERVER_ERROR', message: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ push */

function push_(body) {
  var records = body.records || [];
  var byTable = {};
  records.forEach(function (rec) {
    if (!rec || !TABLES[rec.t] || !rec.r || !rec.r.id) return;
    (byTable[rec.t] = byTable[rec.t] || []).push(rec);
  });

  var results = [];
  Object.keys(byTable).forEach(function (table) {
    var headers = headers_(table);
    var sh = ensureSheet_(table, headers);
    var data = readRows_(sh);
    var index = {};
    data.forEach(function (row, i) { index[row.id] = i; });
    var updates = [], appends = [];

    byTable[table].forEach(function (rec) {
      var inc = rec.r;
      var i = index[inc.id];
      var cur = i === undefined ? null : data[i];
      var verdict = compare_(inc, cur);
      if (verdict === 'accept') {
        var stamp = nextStamp_();
        var row = { id: inc.id, rev: inc.rev, updatedAt: inc.updatedAt, updatedBy: inc.updatedBy,
                    deleted: !!inc.deleted, serverUpdatedAt: stamp };
        var view = rec.v || {};
        TABLES[table].forEach(function (h) { row[h] = view[h]; });
        var full = JSON.parse(JSON.stringify(inc));
        full.serverUpdatedAt = stamp;
        row.json = JSON.stringify(full);
        var values = toValues_(row, headers);
        if (cur) {
          updates.push([i + 2, values]);
          data[i] = row;
        } else {
          appends.push(values);
          index[row.id] = data.length;
          data.push(row);
        }
        results.push({ t: table, id: inc.id, status: 'ok', serverUpdatedAt: stamp });
      } else if (verdict === 'same') {
        results.push({ t: table, id: inc.id, status: 'ok', serverUpdatedAt: Number(cur.serverUpdatedAt) || 0 });
      } else {
        results.push({ t: table, id: inc.id, status: 'stale', server: rowToRecord_(cur) });
      }
    });

    updates.forEach(function (u) { sh.getRange(u[0], 1, 1, headers.length).setValues([u[1]]); });
    appendValues_(sh, headers, appends);
  });
  return { ok: true, results: results, serverTime: Date.now() };
}

// accept / same / reject
function compare_(inc, cur) {
  if (!cur) return 'accept';
  var ir = Number(inc.rev) || 0, cr = Number(cur.rev) || 0;
  if (ir > cr) return 'accept';
  if (ir < cr) return 'reject';
  if (String(inc.updatedAt) === String(cur.updatedAt)) return 'same';
  return String(inc.updatedAt) > String(cur.updatedAt) ? 'accept' : 'reject';
}

/* ------------------------------------------------------------------ pull */

function pull_(body) {
  var since = Number(body.since) || 0;
  var out = {};
  var cursor = since;
  Object.keys(TABLES).forEach(function (table) {
    var sh = ensureSheet_(table, headers_(table));
    var rows = readRows_(sh).filter(function (r) {
      var s = Number(r.serverUpdatedAt) || 0;
      if (s > cursor) cursor = s;
      return s > since;
    }).map(rowToRecord_).filter(function (r) { return r; });
    if (rows.length) out[table] = rows;
  });
  return { ok: true, rows: out, cursor: cursor, serverTime: Date.now() };
}

function rowToRecord_(row) {
  if (!row) return null;
  var r;
  try { r = JSON.parse(row.json || '{}'); } catch (e) { return null; }
  if (!r || !r.id) return null;
  r.rev = Number(row.rev) || Number(r.rev) || 0;
  r.serverUpdatedAt = Number(row.serverUpdatedAt) || 0;
  r.deleted = row.deleted === true || String(row.deleted).toLowerCase() === 'true';
  return r;
}

/* ------------------------------------------------------------------ helpers */

function headers_(table) { return COMMON.concat(TABLES[table]).concat(['json']); }

function checkKey_(key) {
  var secret = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
  return !!secret && String(key || '') === String(secret);
}

// Strictly increasing server timestamp (ms); safe because callers hold the script lock.
function nextStamp_() {
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty('LAST_STAMP')) || 0;
  var now = Date.now();
  var ts = now > last ? now : last + 1;
  props.setProperty('LAST_STAMP', String(ts));
  return ts;
}

function ensureSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    formatRows_(sh, headers, 2, Math.max(sh.getMaxRows() - 1, 1));
  }
  return sh;
}

// Text columns stay text (ids, phone numbers and dates are never auto-converted); money stays numbers.
function formatRows_(sh, headers, startRow, n) {
  headers.forEach(function (h, c) {
    sh.getRange(startRow, c + 1, n, 1).setNumberFormat(NUMERIC[h] ? '0.##' : '@');
  });
}

function appendValues_(sh, headers, values) {
  if (!values.length) return;
  var start = Math.max(sh.getLastRow(), 1) + 1;
  var need = start + values.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need + 200);
  formatRows_(sh, headers, start, values.length);
  sh.getRange(start, 1, values.length, headers.length).setValues(values);
}

// Reads rows as objects keyed by the header row actually present in the sheet.
function readRows_(sh) {
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var head = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {}, empty = true;
    for (var c = 0; c < head.length; c++) {
      if (!head[c]) continue;
      var v = values[r][c];
      if (v instanceof Date) v = v.toISOString();
      if (v !== '' && v !== null) empty = false;
      obj[head[c]] = v;
    }
    if (!empty && obj.id) rows.push(obj);
  }
  return rows;
}

function toValues_(row, headers) {
  return headers.map(function (h) {
    var v = row[h];
    if (v === undefined || v === null || v === '') return '';
    if (NUMERIC[h]) { var n = Number(v); return isFinite(n) ? n : ''; }
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ one-time setup */

/** Run once from the Apps Script editor (Run ▶ setupSheet). Creates every tab with headers. */
function setupSheet() {
  Object.keys(TABLES).forEach(function (t) { ensureSheet_(t, headers_(t)); });
  var first = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (first && first.getName() === 'Sheet1' && first.getLastRow() === 0) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(first);
}
