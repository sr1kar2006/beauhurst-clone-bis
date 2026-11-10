import { Download, RotateCcw } from 'lucide-react';
import { PageShell, Panel, th, td } from '../components/layout/PageShell';
import { useJobs, jobBlob, jobSpec, type JobStatus } from './stores';
import { downloadJob, startJob } from './exportJobs';
import { UsageMeter } from './BulkExportModal';
import { formatInt } from '../lib/format';

const TONE: Record<JobStatus, string> = { Queued: 'bg-chip-blue text-badge-blue-text', Running: 'bg-[#FFF2CC] text-[#7A5B00]', Ready: 'bg-[#DCF3E1] text-[#1E6B34]', Expired: 'bg-[#EFEFEF] text-text', Failed: 'bg-[#FDE2E1] text-[#9B1C1C]' };
const size = (b: number) => (b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`) : '—');
const dt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function DownloadsPage() {
  const jobs = useJobs((s) => s.jobs);
  return (
    <PageShell title="Downloads" intro="Bulk exports run in the background. Finished files stay here until they expire; re-run an export to refresh it with the latest data.">
      <Panel className="mb-[16px]"><UsageMeter /></Panel>
      <Panel bodyClass="">
        <table className="w-full border-collapse" data-downloads-table>
          <thead><tr>{['Export', 'Rows', 'Format', 'Files', 'Size', 'Status', 'Created', 'Expires', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {jobs.map((j) => {
              const blob = jobBlob(j.id);
              const spec = jobSpec(j.id);
              return (
                <tr key={j.id} data-job={j.id}>
                  <td className={`${td} font-semibold`}>{j.name}{j.overageRows ? <span className="block text-[12px] font-normal text-[#9B1C1C]">{formatInt(j.overageRows)} rows over allowance</span> : null}</td>
                  <td className={td}>{formatInt(j.rows)}</td>
                  <td className={`${td} uppercase`}>{j.format === 'xlsx' ? 'Excel' : j.format} (zip)</td>
                  <td className={td}>{j.files || '—'}</td>
                  <td className={td}>{size(j.size)}</td>
                  <td className={td}>
                    <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${TONE[j.status]}`} data-job-status>{j.status}{j.status === 'Running' ? ` ${j.progress}%` : ''}</span>
                    {j.status === 'Ready' && !blob && <span className="block text-[12px] text-muted">File from a previous session: re-run</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{dt(j.created)}</td>
                  <td className={`${td} whitespace-nowrap`}>{dt(j.expires)}</td>
                  <td className={`${td} whitespace-nowrap space-x-[10px]`}>
                    {j.status === 'Ready' && blob && <button onClick={() => downloadJob(j.id, blob, j.name)} className="inline-flex items-center gap-[4px] text-primary font-semibold hover:underline" data-download-job><Download size={14} />Download</button>}
                    {spec && j.status !== 'Running' && <button onClick={() => startJob(spec.spec, spec.format, spec.filename)} className="inline-flex items-center gap-[4px] text-primary hover:underline"><RotateCcw size={14} />Re-run</button>}
                  </td>
                </tr>
              );
            })}
            {!jobs.length && <tr><td colSpan={9} className={`${td} text-center text-text`}>No exports yet.</td></tr>}
          </tbody>
        </table>
      </Panel>
    </PageShell>
  );
}
