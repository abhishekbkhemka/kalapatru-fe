import { useEffect } from 'react'
import { billTotal, casesLabel, companyAddress, formatDdMmYyyy, printElementById } from '../utils/printHelpers'

export default function ForwardingNotePrintModal({ note, onClose, autoPrint = false }) {
  const printId = 'forwarding-note-print'

  useEffect(() => {
    if (!note || !autoPrint) return
    const t = setTimeout(() => printElementById(printId, `FN-${note.id}`), 120)
    return () => clearTimeout(t)
  }, [note, autoPrint])

  if (!note) return null

  const company = note.company || {}

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fn-print-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head no-print">
          <h3>Forwarding Note</h3>
          <div className="row-actions">
            <button
              type="button"
              className="btn primary small"
              onClick={() => printElementById(printId, `FN-${note.id}`)}
            >
              Print
            </button>
            <button type="button" className="link-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div id={printId} className="fn-print-sheet">
          <div className="fn-print-top">
            <div className="fn-print-title">Forwarding Note</div>
            <img src="/logo.png" alt="Kalpataru" />
          </div>

          <div className="fn-print-company">
            <div className="comp-line">
              <strong>{company.name || 'Kalpataru'}</strong>
              {company.code ? <span> ({company.code})</span> : null}
            </div>
            <div>{companyAddress(company) || 'Kalpataru Tower Patna Gaya Road Elahibagh Patna-800007'}</div>
            <div>
              VAT : {company.vat || '-'} &nbsp;&nbsp; GST : {company.cst_or_tin || '-'}
            </div>
          </div>

          <div className="fn-print-grid">
            <div className="fn-cell">
              <label>Serial No.:</label>
              <span>{note.id}</span>
            </div>
            <div className="fn-cell">
              <label>Date:</label>
              <span>{note.fnDate ? new Date(note.fnDate).toDateString() : ''}</span>
            </div>
            <div className="fn-cell">
              <label>Transport Name:</label>
              <span className="upper">{note.transporter?.name}</span>
            </div>
            <div className="fn-cell">
              <label>Station/Place:</label>
              <span className="upper">{note.transporterStation}</span>
            </div>
            <div className="fn-cell">
              <label>Customer Name:</label>
              <span className="upper">{note.customer?.name}</span>
            </div>
            <div className="fn-cell">
              <label>Station/Place:</label>
              <span className="upper">{note.customer?.city}</span>
            </div>
            <div className="fn-cell">
              <label>Bill No:</label>
              <span>{note.billNo}</span>
            </div>
            <div className="fn-cell">
              <label>Bill Value:</label>
              <span>{billTotal(note.billValues)}</span>
            </div>
            <div className="fn-cell">
              <label>Bill Date:</label>
              <span>{note.billDates || formatDdMmYyyy(note.fnDate)}</span>
            </div>
            <div className="fn-cell">
              <label>Cases:</label>
              <span>{casesLabel(note)}</span>
            </div>
            <div className="fn-cell">
              <label>Pvt. Marka:</label>
              <span className="upper">{note.marka}</span>
            </div>
            <div className="fn-cell">
              <label>Permit No.:</label>
              <span className="upper">{note.permitNo}</span>
            </div>
            <div className="fn-cell">
              <label>Commodity:</label>
              <span className="upper">{note.commodity}</span>
            </div>
            <div className="fn-cell fn-freight">
              <label>FRIEGHT TO BE BILLED</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
