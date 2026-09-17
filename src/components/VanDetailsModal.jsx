import { useMemo } from 'react'
import {
  formatDdMmYyyy,
  groupNotesForVanPrint,
  printElementById,
  totalCases,
} from '../utils/printHelpers'

export default function VanDetailsModal({ dispatch, onClose }) {
  const rows = useMemo(
    () => groupNotesForVanPrint(dispatch?.forwardingNote || []),
    [dispatch],
  )
  const cases = totalCases(dispatch?.forwardingNote || [])
  const printId = 'van-details-print'

  if (!dispatch) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal van-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head title-bar-brown no-print">
          <h3>Van Details</h3>
          <button type="button" className="window-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div id={printId} className="van-details-sheet">
          <div className="dispatch-brand">
            <img src="/logo.png" alt="Kalpataru" />
            <div className="adrs">
              Kalpataru Tower Patna Gaya Road Elahibagh
              <br />
              Patna-800007
            </div>
          </div>

          <div className="van-details-meta">
            <div className="van-meta-row">
              <div>
                <label>Date: </label>
                <span>{formatDdMmYyyy(dispatch.date)}</span>
              </div>
              <div className="sr-box">
                <label>Sr No.: </label>
                <span>{dispatch.id}</span>
              </div>
            </div>
            <div className="van-meta-row">
              <div>
                <label>Van No.: </label>
                <span>{dispatch.vanNo}</span>
              </div>
              <div>
                <label>Total Cases.: </label>
                <span>{cases}</span>
              </div>
            </div>
            <div className="van-meta-row">
              <div>
                <label>Driver Name: </label>
                <span>{dispatch.name}</span>
              </div>
            </div>
            <div className="van-meta-row">
              <div>
                <label>Remarks: </label>
                <span>{dispatch.remarks}</span>
              </div>
            </div>
          </div>

          <div className="dispatch-divider" />

          <div className="dispatch-table-wrap van-print-table">
            <table className="data-table dispatch-table van-details-table">
              <thead>
                <tr>
                  <th className="print-hide">ID</th>
                  <th className="print-hide">Date</th>
                  <th>Transport Name</th>
                  <th>Station / Place</th>
                  <th className="print-hide">Bill No.</th>
                  <th className="print-hide">Bill Date.</th>
                  <th className="print-hide">Value</th>
                  <th>Pvt. Marka</th>
                  <th className="print-hide">Permit No.</th>
                  <th>Customer name</th>
                  <th>Cases</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((fn, idx) =>
                  fn.isCases ? (
                    <tr key={`receiver-${idx}`} className="receiver-row">
                      <td className="print-hide" />
                      <td className="print-hide" />
                      <td className="receiver-label">{fn.receiver || 'RECEIVER :'}</td>
                      <td />
                      <td className="print-hide" />
                      <td className="print-hide" />
                      <td className="print-hide" />
                      <td />
                      <td className="print-hide" />
                      <td />
                      <td className="receiver-cases">{fn.totalCases}</td>
                    </tr>
                  ) : (
                    <tr key={fn.id || idx}>
                      <td className="print-hide">{fn.id}</td>
                      <td className="print-hide">{formatDdMmYyyy(fn.fnDate)}</td>
                      <td className="upper">{fn.transporter?.name}</td>
                      <td className="upper">{fn.transporterStation}</td>
                      <td className="print-hide upper">{fn.billNo}</td>
                      <td className="print-hide">{fn.billDates}</td>
                      <td className="print-hide">{fn.billValues}</td>
                      <td>{fn.marka}</td>
                      <td className="print-hide upper">{fn.permitNo}</td>
                      <td className="upper">
                        {fn.customer?.name}
                        {fn.customer?.city ? ` -- ${fn.customer.city}` : ''}
                      </td>
                      <td>{fn.cases}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="classic-actions no-print">
          <button
            type="button"
            className="btn primary"
            onClick={() =>
              printElementById(printId, 'Van Details', {
                hidePrintOnlyCols: true,
              })
            }
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
