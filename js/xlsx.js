/* Outreach Tracker — writes a real Excel file (.xlsx) in the browser, with no outside library.
   Xlsx.build([{ name, head: [..], rows: [[..], ..] }, ..]) returns a Blob. One sheet per entry,
   bold frozen header row with filter buttons, sensible column widths. Text is always stored as text,
   so phone numbers keep their leading 0 and nothing is read as a formula. */
(function () {
  'use strict';
  var enc = new TextEncoder();

  /* ---- zip (stored, no compression: the files are small) ---- */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {   // files: [{ name, data: Uint8Array }]
    var parts = [], central = [], offset = 0;
    var d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF,
      dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + size;
    });
    var cdSize = central.reduce(function (a, x) { return a + x.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    return parts.concat(central, [new Uint8Array(e.buffer)]);
  }

  /* ---- workbook ---- */
  function x(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function col(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function sheetName(n, used) {
    var s = String(n || 'Sheet').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Sheet', base = s, k = 2;
    while (used[s.toLowerCase()]) s = base.slice(0, 28) + ' ' + (k++);
    used[s.toLowerCase()] = true; return s;
  }
  function cell(ref, v, style) {
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + v + '</v></c>';
    if (v === '' || v === null || v === undefined) return '';
    return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
  }
  function sheetXml(s) {
    var n = s.head.length, last = col(Math.max(n - 1, 0)) + (s.rows.length + 1);
    var widths = s.head.map(function (hd, i) {
      var w = String(hd).length;
      for (var r = 0; r < Math.min(s.rows.length, 300); r++) w = Math.max(w, String(s.rows[r][i] === undefined ? '' : s.rows[r][i]).length);
      return Math.min(Math.max(w + 2, 8), 60);
    });
    var rows = ['<row r="1">' + s.head.map(function (hd, i) { return cell(col(i) + 1, hd, 1); }).join('') + '</row>'];
    s.rows.forEach(function (r, ri) {
      rows.push('<row r="' + (ri + 2) + '">' + r.map(function (v, i) { return cell(col(i) + (ri + 2), v, 0); }).join('') + '</row>');
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="A1:' + last + '"/>' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' +
      '<sheetData>' + rows.join('') + '</sheetData>' +
      (s.rows.length ? '<autoFilter ref="A1:' + last + '"/>' : '') +
      '</worksheet>';
  }
  function build(sheets) {
    var used = {}, names = sheets.map(function (s) { return sheetName(s.name, used); });
    var files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
        '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        names.map(function (n, i) { return '<sheet name="' + x(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
        '<definedNames>' + sheets.map(function (s, i) {
          return s.rows.length ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(names[i].replace(/'/g, "''")) + '\'!$A$1:$' + col(Math.max(s.head.length - 1, 0)) + '$' + (s.rows.length + 1) + '</definedName>' : '';
        }).join('') + '</definedNames></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FF0E4A22"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    ];
    sheets.forEach(function (s, i) { files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s)]); });
    return new Blob(zip(files.map(function (f) { return { name: f[0], data: enc.encode(f[1]) }; })),
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  window.Xlsx = { build: build };
})();
