import { Buffer } from 'buffer';
import { createZip, readZipEntries } from './binary-file.helper';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlUnescape(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function columnName(index: number): string {
  let current = index + 1;
  let result = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function buildWorksheetXml(rows: string[][]): string {
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, cellIndex) => {
          const ref = `${columnName(cellIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rowXml}</sheetData>` +
    '</worksheet>'
  );
}

export function createXlsxBuffer(sheetName: string, rows: string[][]): Buffer {
  const safeSheetName = xmlEscape(sheetName);
  const sheetXml = buildWorksheetXml(rows);

  return createZip([
    {
      name: '[Content_Types].xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>',
        'utf8'
      ),
    },
    {
      name: '_rels/.rels',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '</Relationships>',
        'utf8'
      ),
    },
    {
      name: 'xl/workbook.xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets>' +
          `<sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>` +
          '</sheets>' +
          '</workbook>',
        'utf8'
      ),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          '</Relationships>',
        'utf8'
      ),
    },
    {
      name: 'xl/styles.xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
          '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
          '<borders count="1"><border/></borders>' +
          '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
          '<cellXfs count="1"><xf xfId="0"/></cellXfs>' +
          '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
          '</styleSheet>',
        'utf8'
      ),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: Buffer.from(sheetXml, 'utf8'),
    },
  ]);
}

export function createCsvBuffer(rows: string[][]): Buffer {
  const content = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  return Buffer.from(content, 'utf8');
}

function parseSharedStrings(xml: string): string[] {
  const matches = [...xml.matchAll(/<si[^>]*>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/si>/g)];
  return matches.map((match) => xmlUnescape(match[1]));
}

export function parseXlsxBuffer(buffer: Buffer): string[][] {
  const entries = readZipEntries(buffer);
  const sheetXml = entries.get('xl/worksheets/sheet1.xml');
  if (!sheetXml) {
    throw new Error('Workbook does not contain sheet1.xml');
  }

  const sharedStringsXml = entries.get('xl/sharedStrings.xml');
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml.toString('utf8')) : [];
  const rows: string[][] = [];
  const rowMatches = [...sheetXml.toString('utf8').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];

  for (const rowMatch of rowMatches) {
    const cells: string[] = [];
    const cellMatches = [
      ...rowMatch[1].matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*?(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g),
    ];

    for (const cellMatch of cellMatches) {
      const columnLetters = cellMatch[1];
      const type = cellMatch[2];
      const payload = cellMatch[3];
      const index = columnLetters
        .split('')
        .reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;

      while (cells.length < index) {
        cells.push('');
      }

      let value = '';
      if (type === 'inlineStr') {
        const inline = payload.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        value = inline ? xmlUnescape(inline[1]) : '';
      } else {
        const raw = payload.match(/<v[^>]*>([\s\S]*?)<\/v>/);
        const rawValue = raw ? raw[1] : '';
        value = type === 's' ? sharedStrings[parseInt(rawValue, 10)] ?? '' : xmlUnescape(rawValue);
      }

      cells[index] = value;
    }

    rows.push(cells);
  }

  return rows;
}
