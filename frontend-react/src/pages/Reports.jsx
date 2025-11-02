import React from 'react'
import { api } from '../api'
import { formatCurrency } from '../utils/format.js'

function useAsync(fn, deps){
  const [state, setState] = React.useState({ loading: true, error: '', data: null })
  React.useEffect(()=>{
    let ok = true
    setState({ loading: true, error: '', data: null })
    fn().then(d=>{ if (ok) setState({ loading: false, error: '', data: d }) })
      .catch(e=>{ if (ok) setState({ loading: false, error: e?.message || 'Failed', data: null }) })
    return ()=>{ ok = false }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

export default function Reports(){
  const [year, setYear] = React.useState(new Date().getFullYear())

  const snapshot = useAsync(async ()=>{
    return api.request('/reports/net_worth/')
  }, [])

  const cashflow = useAsync(async ()=>{
    return api.request(`/reports/monthly_cashflow/?year=${year}`)
  }, [year])

  const timeline = useAsync(async ()=>{
    return api.request(`/reports/net_worth_timeline/?year=${year}`)
  }, [year])

  return (
    <div>
      <h2 className="h4 mb-3">Reports</h2>

      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Net Worth Snapshot</strong>
        </div>
        <div className="card-body">
          {snapshot.loading && <div className="text-muted">Loading…</div>}
          {snapshot.error && <div className="alert alert-danger">{snapshot.error}</div>}
          {snapshot.data && (
            <div className="row g-3">
              <Stat label="Assets (INR)" value={snapshot.data.totals.assets_inr} />
              <Stat label="Investments (INR)" value={snapshot.data.totals.investments_inr} />
              <Stat label="Money Lent (INR)" value={snapshot.data.totals.money_lent_inr} />
              <Stat label="Liabilities (INR)" value={snapshot.data.totals.liabilities_inr} />
              <Stat label="Net Worth (INR)" value={snapshot.data.totals.net_worth_inr} strong />
            </div>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Monthly Cashflow</strong>
          <YearPicker year={year} setYear={setYear} />
        </div>
        <div className="card-body">
          {cashflow.loading && <div className="text-muted">Loading…</div>}
          {cashflow.error && <div className="alert alert-danger">{cashflow.error}</div>}
          {cashflow.data && (
            <>
            <MiniBars
              data={cashflow.data.months.map(m=>({ label: String(m.month), value: m.net_inr }))}
              title="Net (INR)"
              positiveClass="bg-success"
              negativeClass="bg-danger"
            />
            <div className="table-responsive">
              <table className="table table-striped table-sm">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Income (INR)</th>
                    <th className="text-end">Expenses (INR)</th>
                    <th className="text-end">Net (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.data.months.map((m, idx)=> (
                    <tr key={idx}>
                      <td>{m.month}</td>
                      <td className="text-end">{formatCurrency(m.income_inr, 'INR')}</td>
                      <td className="text-end">{formatCurrency(m.expense_inr, 'INR')}</td>
                      <td className="text-end">{formatCurrency(m.net_inr, 'INR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Net Worth Timeline (Approx.)</strong>
          <YearPicker year={year} setYear={setYear} />
        </div>
        <div className="card-body">
          {timeline.loading && <div className="text-muted">Loading…</div>}
          {timeline.error && <div className="alert alert-danger">{timeline.error}</div>}
          {timeline.data && (
            <>
              <MiniBars
                data={timeline.data.months.map(m=>({ label: String(m.month), value: m.approx_net_worth_inr }))}
                title="Approx Net Worth (INR)"
                positiveClass="bg-primary"
                negativeClass="bg-primary"
              />
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-end">Approx Net Worth (INR)</th>
                      <th className="text-end">Net Flow (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.data.months.map((m, idx)=> (
                      <tr key={idx}>
                        <td>{m.month}</td>
                        <td className="text-end">{formatCurrency(m.approx_net_worth_inr, 'INR')}</td>
                        <td className="text-end">{formatCurrency(m.net_flow_inr, 'INR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {timeline.data && (
            <div className="text-muted small mt-2">Baseline (Jan 1): {formatCurrency(timeline.data.baseline_jan1_inr, 'INR')} · Current snapshot: {formatCurrency(timeline.data.current_net_worth_inr, 'INR')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function YearPicker({ year, setYear }){
  const years = []
  const now = new Date().getFullYear()
  for (let y = now - 5; y <= now + 1; y++) years.push(y)
  return (
    <div className="d-flex align-items-center gap-2">
      <label className="form-label m-0">Year</label>
      <select className="form-select form-select-sm" value={year} onChange={e=> setYear(Number(e.target.value))}>
        {years.map(y=> <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

function Stat({ label, value, strong }){
  return (
    <div className="col-md-4 col-lg-3">
      <div className="summary-card">
        <div className="d-flex justify-content-between">
          <div>
            <h6 className="card-title">{label}</h6>
            <h5 className={`mb-0 ${strong ? 'fw-bold' : ''}`}>{formatCurrency(Number(value)||0, 'INR')}</h5>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniBars({ data, title, positiveClass='bg-success', negativeClass='bg-danger' }){
  if (!Array.isArray(data) || data.length === 0) return null
  const maxAbs = Math.max(1, ...data.map(d => Math.abs(Number(d.value) || 0)))
  return (
    <div className="mb-3">
      <div className="small text-muted mb-1">{title}</div>
      <div>
        {data.map((d, idx) => {
          const val = Number(d.value) || 0
          const width = Math.max(2, Math.round(Math.abs(val) / maxAbs * 100))
          const cls = val >= 0 ? positiveClass : negativeClass
          return (
            <div key={idx} className="d-flex align-items-center gap-2 mb-1">
              <div style={{width: 24}} className="text-muted small text-end">{d.label}</div>
              <div className="flex-grow-1">
                <div className={`progress`} style={{height: 6}}>
                  <div className={`progress-bar ${cls}`} style={{width: `${width}%`}}></div>
                </div>
              </div>
              <div style={{width: 160}} className="text-end small">{formatCurrency(val, 'INR')}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
