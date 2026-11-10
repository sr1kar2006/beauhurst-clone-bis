import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { SampleTag } from '../components/ui/Sample';
import { useUi, useIsOpen } from '../store/uiStore';
import { useAllowance, useJobs, overage, nextReset } from './stores';
import { rowCount, startJob } from './exportJobs';
import { TENDER } from '../config/tender';
import { formatDate, formatInt } from '../lib/format';

/** Usage meter used on the account page, Plan page and admin console. */
export function UsageMeter() {
  const { used, allowance } = useAllowance();
  const pct = Math.min(100, (used / allowance) * 100);
  return (
    <div data-usage-meter>
      <div className="flex justify-between text-[14px] mb-[4px]">
        <span className="text-ink font-semibold">{formatInt(used)} of {formatInt(allowance)} bulk-export rows used this month<SampleTag note={TENDER.bulkAllowanceRows.note} /></span>
        <span className="text-text">Resets {formatDate(nextReset().toISOString())}</span>
      </div>
      <div className="h-[10px] bg-track rounded-full overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={allowance} aria-valuenow={used} aria-label="Bulk-export allowance used">
        <div className={`h-full ${pct > 90 ? 'bg-[#C0392B]' : pct > 70 ? 'bg-[#E0662E]' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Shown before any bulk export starts: rows, allowance used, charge (if any) and a confirm for overage. */
export function BulkExportModal() {
  const isOpen = useIsOpen('bulk-export');
  const close = useUi((s) => s.close);
  const pending = useJobs((s) => s.pending);
  const { used, allowance } = useAllowance();
  const [confirm, setConfirm] = useState(false);
  const [format, setFormat] = useState(pending?.format ?? 'xlsx');
  const [started, setStarted] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setConfirm(false); setStarted(null); setFormat(pending?.format === 'pdf' ? 'xlsx' : pending?.format ?? 'xlsx'); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const job = useJobs((s) => s.jobs.find((j) => j.id === started));
  if (!pending) return null;
  const rows = rowCount(pending.spec);
  const { over, charge } = overage(used, rows, allowance);
  const parts = Math.ceil(rows / TENDER.rowsPerFile.value);

  return (
    <Modal id="bulk-export" width={560} label="Bulk export">
      <div className="px-[22px] py-[16px] border-b border-border"><h2 className="text-[18px] text-ink font-semibold">Bulk export</h2></div>
      <div className="px-[22px] py-[18px] space-y-[12px] text-[14px] text-text" data-bulk-modal>
        {!job ? (
          <>
            <p className="text-ink" data-allowance-message>
              This export uses <strong>{formatInt(rows)}</strong> rows. You have used <strong>{formatInt(used)}</strong> of your <strong>{formatInt(allowance)}</strong> monthly bulk-export rows.{' '}
              {over ? <strong className="text-[#9B1C1C]">{formatInt(over)} rows are over the allowance.</strong> : <strong className="text-[#1E6B34]">No additional charge.</strong>}
              <SampleTag note="Allowance and charges are placeholders until confirmed by the bid team." />
            </p>
            {over > 0 && (
              <div className="bg-[#FDF3F2] border border-[#F3C9C5] rounded-card p-[10px]" data-overage>
                <p>Charge for rows beyond the allowance: <strong className="text-ink">£{TENDER.overagePer1000.value.toFixed(2)} per 1,000 rows</strong>, so <strong className="text-ink">£{charge.toFixed(2)}</strong> for this export (sample).</p>
                <label className="flex items-center gap-[8px] mt-[8px] text-ink cursor-pointer"><input type="checkbox" className="accent-primary w-[16px] h-[16px]" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} data-overage-confirm />I understand this export will be charged.</label>
              </div>
            )}
            <p>The export runs in the background and is split into {parts} file{parts > 1 ? 's' : ''} of up to {formatInt(TENDER.rowsPerFile.value)} rows, zipped. It stays on your <Link to="/downloads" className="text-primary underline" onClick={() => close('bulk-export')}>Downloads</Link> page for {TENDER.exportExpiryDays.value} days.</p>
            <fieldset className="flex items-center gap-[14px]"><legend className="sr-only">Format</legend>Format:
              {(['xlsx', 'csv'] as const).map((f) => <label key={f} className="inline-flex items-center gap-[5px] text-ink"><input type="radio" name="bulk-format" className="accent-primary" checked={format === f} onChange={() => setFormat(f)} />{f === 'xlsx' ? 'Excel' : 'CSV'}</label>)}
              {pending.format === 'pdf' && <span className="text-[12px]">PDF is limited to {formatInt(TENDER.bulkThreshold.value)} rows; large exports use Excel or CSV.</span>}
            </fieldset>
          </>
        ) : (
          <div data-job-progress>
            <p className="text-ink mb-[8px]">{job.status === 'Ready' ? 'Your export is ready.' : `Preparing ${formatInt(job.rows)} rows… ${job.files} of ${parts} files built`}</p>
            <div className="h-[12px] bg-track rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress} aria-label="Export progress">
              <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="mt-[8px] text-[13px]">You can close this window; the job carries on and appears on the <Link to="/downloads" onClick={() => close('bulk-export')} className="text-primary underline">Downloads</Link> page.</p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
        <button onClick={() => close('bulk-export')} className="h-[30px] px-[15px] border border-primary text-primary rounded-btn font-semibold">{job ? 'Close' : 'Cancel'}</button>
        {!job && (
          <button data-start-export disabled={over > 0 && !confirm} onClick={() => setStarted(startJob(pending.spec, format, pending.filename))} className="h-[30px] px-[15px] bg-primary text-white rounded-btn font-semibold disabled:opacity-40">
            {over > 0 ? 'Confirm and start export' : 'Start export'}
          </button>
        )}
        {job?.status === 'Ready' && <Link to="/downloads" onClick={() => close('bulk-export')} className="h-[30px] px-[15px] bg-primary text-white rounded-btn font-semibold inline-flex items-center" data-go-downloads>Go to Downloads</Link>}
      </div>
    </Modal>
  );
}
