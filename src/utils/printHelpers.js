import { formatDdMmYyyy } from './dates'

export { formatDdMmYyyy }

export function billTotal(values) {
  if (!values) return 0
  return String(values)
    .split('+')
    .reduce((sum, part) => sum + (parseFloat(part) || 0), 0)
}

export function casesLabel(fn) {
  if (
    fn.regularCases != null &&
    fn.bigCases != null &&
    String(fn.regularCases) !== '' &&
    String(fn.bigCases) !== ''
  ) {
    return `${fn.cases}(R-${fn.regularCases} B-${fn.bigCases})`
  }
  if (fn.regularCases) return `${fn.cases}(R-${fn.regularCases})`
  if (fn.bigCases) return `${fn.cases}(B-${fn.bigCases})`
  return fn.cases || ''
}

export function companyAddress(company) {
  if (!company) return ''
  return [company.addressLine1, company.addressLine2, company.area, company.city, company.state, company.country]
    .filter(Boolean)
    .join(', ')
}

/** Group FNs by transporter and insert RECEIVER subtotal rows (legacy print layout). */
export function groupNotesForVanPrint(notes = []) {
  const map = new Map()
  for (const fn of notes) {
    if (fn.isCases) continue
    const key = fn.transporter?.name || 'UNKNOWN'
    if (!map.has(key)) map.set(key, { rows: [], totalCases: 0 })
    const bucket = map.get(key)
    bucket.rows.push(fn)
    const n = parseInt(fn.cases, 10)
    bucket.totalCases += Number.isNaN(n) ? 0 : n
  }
  const out = []
  for (const [, bucket] of map) {
    out.push(...bucket.rows)
    out.push({
      isCases: true,
      receiver: 'RECEIVER :',
      totalCases: bucket.totalCases,
    })
  }
  return out
}

export function totalCases(notes = []) {
  return notes.reduce((sum, fn) => {
    if (fn.isCases) return sum
    const n = parseInt(fn.cases, 10)
    return sum + (Number.isNaN(n) ? 0 : n)
  }, 0)
}

function absolutizeHtml(html) {
  const origin = window.location.origin
  return html
    .replace(/(<img[^>]+src=["'])\/([^"']+)(["'])/gi, `$1${origin}/$2$3`)
    .replace(/(<img[^>]+src=["'])(?!https?:|data:)([^"']+)(["'])/gi, `$1${origin}/$2$3`)
}

function printStyles(hidePrintOnlyCols) {
  return `
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 14px 18px;
      color: #222;
      font-size: 12px;
    }
    img { max-width: 140px; }
    .dispatch-brand { text-align: center; margin-bottom: 12px; }
    .dispatch-brand img { width: 120px; height: auto; }
    .dispatch-brand .adrs { margin-top: 6px; font-size: 12px; line-height: 1.35; color: #333; }
    .van-details-meta { font-size: 13px; margin-bottom: 8px; }
    .van-meta-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 6px;
    }
    .van-meta-row label { font-weight: 600; }
    .sr-box {
      background: #f1f1f1;
      border: 1px solid #ccc;
      padding: 2px 10px;
    }
    .sr-box label, .sr-box span { color: #941414 !important; font-weight: 700; }
    .dispatch-divider { border-bottom: 4px double #aec6dc; margin: 8px 0 12px; }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #bbb;
      padding: 5px 6px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f3f3f3; font-weight: 700; }
    .upper { text-transform: uppercase; }
    .receiver-row td { background: #fff; }
    .receiver-label,
    .receiver-cases {
      color: #941414 !important;
      font-weight: 700;
    }
    .no-print { display: none !important; }
    ${hidePrintOnlyCols ? '.print-hide { display: none !important; }' : ''}
    .fn-print-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .fn-print-title { color: #814b27; font-size: 18px; font-weight: 700; }
    .fn-print-company { text-align: center; margin-bottom: 14px; font-size: 12px; line-height: 1.4; }
    .fn-print-company .comp-line { color: #256f9c; font-size: 14px; margin-bottom: 2px; }
    .fn-print-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ccc; }
    .fn-cell { display: flex; gap: 8px; padding: 6px 8px; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; font-size: 12px; }
    .fn-cell:nth-child(2n) { border-right: none; }
    .fn-cell label { font-weight: 600; white-space: nowrap; }
    .fn-cell span { color: #256f9c; }
    .fn-freight { justify-content: center; text-transform: uppercase; }
    @media print {
      body { margin: 8px; }
      .no-print, .print-hide { display: none !important; }
    }
  `
}

/** Print via hidden iframe — avoids popup blockers that break window.open(). */
export function printHtml(html, title = 'Print', options = {}) {
  const hidePrintOnlyCols = Boolean(options.hidePrintOnlyCols)
  const content = absolutizeHtml(html)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', title)
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${printStyles(hidePrintOnlyCols)}</style>
</head>
<body>${content}</body>
</html>`)
  doc.close()

  const win = iframe.contentWindow
  let printed = false
  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1000)
  }

  const trigger = () => {
    if (printed) return
    printed = true
    try {
      win.focus()
      win.print()
    } finally {
      cleanup()
    }
  }

  // Wait for images (logo) before printing
  const images = Array.from(doc.images || [])
  if (images.length === 0) {
    setTimeout(trigger, 80)
    return
  }
  let pending = images.length
  const done = () => {
    pending -= 1
    if (pending <= 0) setTimeout(trigger, 80)
  }
  images.forEach((img) => {
    if (img.complete) done()
    else {
      img.addEventListener('load', done)
      img.addEventListener('error', done)
    }
  })
  // Safety timeout if image events never fire
  setTimeout(trigger, 2000)
}

export function printElementById(elementId, title = 'Print', options = {}) {
  const el = document.getElementById(elementId)
  if (!el) return
  printHtml(el.innerHTML, title, options)
}
