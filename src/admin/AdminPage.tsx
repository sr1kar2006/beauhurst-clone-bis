import { useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageShell, Panel, btnOutline, btnPrimary, th, td } from '../components/layout/PageShell';
import { Modal } from '../components/ui/Modal';
import { TV } from '../components/ui/Sample';
import { useUi } from '../store/uiStore';
import { useAuth, seats } from '../auth/authStore';
import { useAudit } from '../auth/audit';
import type { Role, User } from '../auth/users';
import { TENDER } from '../config';
import { allUsage, SECTION_LABEL } from '../usage/model';
import { usageReport, sessionLog, viewsReport, presetRange, PRESETS, fmtDuration, type Preset, type Range } from '../usage/report';
import { ExportMenu } from '../export/ExportMenu';
import type { ExportSpec } from '../export/types';
import { UsageMeter } from '../export/BulkExportModal';
import { formatInt } from '../lib/format';
import { profilePath } from '../lib/nav';

const TABS = [{ id: 'users', label: 'Users' }, { id: 'usage', label: 'Usage reports' }, { id: 'audit', label: 'Audit log' }] as const;
const dt = (t: number | string | null) => (t == null ? '—' : new Date(t).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
const d = (t: number) => new Date(t).toISOString().slice(0, 10);

export default function AdminPage() {
  const { tab = 'users' } = useParams();
  const users = useAuth((s) => s.users);
  return (
    <PageShell
      title="Admin console"
      wide
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Admin console' }]}
      intro={<><TV v={TENDER.clientOrg} />. Administrators manage users and see usage. Every user has full access to every other feature.</>}
      actions={<span className="text-[15px] font-semibold text-ink" data-seat-counter>{users.length} of {seats()} licences assigned · Full access for all users</span>}
    >
      <nav className="flex items-center gap-[4px] border-b border-border mb-[18px]" aria-label="Admin sections">
        {TABS.map((t) => (
          <NavLink key={t.id} to={`/admin/${t.id}`} data-admin-tab={t.id} className={({ isActive }) => `h-[38px] px-[16px] -mb-px border-b-2 inline-flex items-center text-[15px] ${isActive || (tab === t.id) ? 'border-primary text-primary font-semibold' : 'border-transparent text-ink hover:text-primary'}`}>{t.label}</NavLink>
        ))}
      </nav>
      {tab === 'users' && <UsersTab />}
      {tab === 'usage' && <UsageTab />}
      {tab === 'audit' && <AuditTab />}
    </PageShell>
  );
}

// ------------------------------------------------------------------ range picker
function RangePicker({ preset, setPreset, range, setRange }: { preset: Preset; setPreset: (p: Preset) => void; range: Range; setRange: (r: Range) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-[8px] text-[14px]" data-range-picker>
      <div role="group" aria-label="Period" className="inline-flex border border-primary rounded-btn overflow-hidden divide-x divide-primary">
        {PRESETS.map((p) => (
          <button key={p.id} aria-pressed={preset === p.id} data-preset={p.id} onClick={() => { setPreset(p.id); if (p.id !== 'custom') setRange(presetRange(p.id)); }}
            className={`h-[30px] px-[10px] text-[13px] font-semibold ${preset === p.id ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary-light'}`}>{p.label}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <span className="inline-flex items-center gap-[6px]">
          <label className="inline-flex items-center gap-[4px]">From <input type="date" value={d(range.from)} onChange={(e) => e.target.value && setRange({ ...range, from: Date.parse(e.target.value) })} className="h-[30px] border border-border rounded-btn px-[6px]" data-range-from /></label>
          <label className="inline-flex items-center gap-[4px]">to <input type="date" value={d(range.to - 864e5)} onChange={(e) => e.target.value && setRange({ ...range, to: Date.parse(e.target.value) + 864e5 })} className="h-[30px] border border-border rounded-btn px-[6px]" data-range-to /></label>
        </span>
      )}
      <span className="text-text text-[13px]">{new Date(range.from).toLocaleDateString('en-GB')} to {new Date(range.to - 864e5).toLocaleDateString('en-GB')}</span>
    </div>
  );
}

function useRange(initial: Preset = '30d') {
  const [preset, setPreset] = useState<Preset>(initial);
  const [range, setRange] = useState<Range>(() => presetRange(initial));
  return { preset, setPreset, range, setRange };
}

// ------------------------------------------------------------------ users
function UsersTab() {
  const { users, setRole, setStatus, removeUser, resendInvite } = useAuth();
  const currentId = useAuth((s) => s.currentId);
  const open = useUi((s) => s.open);
  const [sel, setSel] = useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null);
  const { preset, setPreset, range, setRange } = useRange('30d');
  const rep = useMemo(() => usageReport(allUsage(), users, range), [users, range]);
  const row = (id: string) => rep.perUser.find((r) => r.user.id === id)!;
  const spec = (): ExportSpec => ({
    title: 'Users', subtitle: `${users.length} of ${seats()} licences`, filtersUsed: [`Period: ${new Date(range.from).toLocaleDateString('en-GB')} to ${new Date(range.to - 864e5).toLocaleDateString('en-GB')}`],
    sheets: [{ name: 'Users', columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email', width: 34 }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'last', label: 'Last login' }, { key: 'sessions', label: 'Sessions', format: 'int' }, { key: 'time', label: 'Connection time (min)', format: 'int' }, { key: 'created', label: 'Created', format: 'date' }],
      rows: users.map((u) => ({ name: u.name, email: u.email, role: u.role, status: u.status, last: dt(row(u.id)?.lastLogin ?? null), sessions: row(u.id)?.sessions ?? 0, time: Math.round((row(u.id)?.connectionMs ?? 0) / 60e3), created: u.created })) }],
    sources: ['in-house'], viewPath: '/admin/users',
  });
  return (
    <>
      <div className="flex flex-wrap items-center gap-[10px] mb-[12px]">
        <RangePicker preset={preset} setPreset={setPreset} range={range} setRange={setRange} />
        <div className="ml-auto flex items-center gap-[8px]">
          {sel.length > 0 && <>
            <span className="text-[14px] text-text">{sel.length} selected</span>
            <button className={btnOutline} onClick={() => { setStatus(sel.filter((x) => x !== currentId), 'Deactivated'); setSel([]); }} data-bulk-deactivate>Deactivate</button>
            <button className={btnOutline} onClick={() => { setStatus(sel, 'Active'); setSel([]); }}>Reactivate</button>
          </>}
          <ExportMenu label="Export" build={spec} filename="users" />
          <button className={btnPrimary} onClick={() => open('add-user', 'modal')} data-add-user><UserPlus size={15} />Add user</button>
        </div>
      </div>
      <Panel bodyClass="overflow-x-auto">
        <table className="w-full border-collapse" data-users-table>
          <thead><tr>
            <th className={th}><input type="checkbox" aria-label="Select all users" className="accent-primary" checked={sel.length === users.length} onChange={(e) => setSel(e.target.checked ? users.map((u) => u.id) : [])} /></th>
            {['Name', 'Email', 'Role', 'Status', 'Last login', 'Sessions in period', 'Connection time', 'Created', ''].map((h) => <th key={h} className={th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map((u) => {
              const r = row(u.id);
              return (
                <tr key={u.id} data-user-row={u.email}>
                  <td className={td}><input type="checkbox" aria-label={`Select ${u.name}`} className="accent-primary" checked={sel.includes(u.id)} onChange={(e) => setSel(e.target.checked ? [...sel, u.id] : sel.filter((x) => x !== u.id))} /></td>
                  <td className={`${td} font-semibold`}>{u.name}{u.id === currentId && <span className="ml-[6px] text-[11px] text-muted font-normal">(you)</span>}</td>
                  <td className={td}>{u.email}</td>
                  <td className={td}><select aria-label={`Role of ${u.name}`} value={u.role} disabled={u.id === currentId} onChange={(e) => setRole(u.id, e.target.value as Role)} className="h-[28px] border border-border rounded-btn px-[4px] bg-white"><option>Administrator</option><option>Member</option></select></td>
                  <td className={td}><span className={`px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${u.status === 'Active' ? 'bg-[#DCF3E1] text-[#1E6B34]' : u.status === 'Invited' ? 'bg-chip-blue text-badge-blue-text' : 'bg-[#EFEFEF] text-text'}`}>{u.status}</span></td>
                  <td className={`${td} whitespace-nowrap`}>{dt(r?.lastLogin ?? null)}</td>
                  <td className={td}>{formatInt(r?.sessions ?? 0)}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDuration(r?.connectionMs ?? 0)}</td>
                  <td className={td}>{new Date(u.created).toLocaleDateString('en-GB')}</td>
                  <td className={`${td} whitespace-nowrap space-x-[10px] text-[13px]`}>
                    {u.status === 'Invited' && <button className="text-primary hover:underline" onClick={() => resendInvite(u.id)}>Resend invite</button>}
                    {u.id !== currentId && (u.status === 'Deactivated'
                      ? <button className="text-primary hover:underline" onClick={() => setStatus([u.id], 'Active')}>Reactivate</button>
                      : <button className="text-primary hover:underline" onClick={() => setStatus([u.id], 'Deactivated')}>Deactivate</button>)}
                    {u.id !== currentId && <button className="text-[#C0392B] hover:underline" onClick={() => { setConfirmRemove(u); open('remove-user', 'modal'); }} data-remove-user={u.email}>Remove</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <AddUserModal />
      <Modal id="remove-user" width={440} label="Remove user">
        <div className="px-[22px] py-[18px] text-[14px] text-text">
          <h2 className="text-[18px] text-ink font-semibold mb-[8px]">Remove {confirmRemove?.name}?</h2>
          <p>They lose access immediately and their licence is freed. Their usage history stays in reports. This cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
          <button className={btnOutline} onClick={() => useUi.getState().close('remove-user')}>Cancel</button>
          <button className="h-[32px] px-[14px] rounded-btn bg-[#C0392B] text-white font-semibold" data-confirm-remove onClick={() => { if (confirmRemove) removeUser(confirmRemove.id); useUi.getState().close('remove-user'); }}>Remove user</button>
        </div>
      </Modal>
    </>
  );
}

function AddUserModal() {
  const addUser = useAuth((s) => s.addUser);
  const count = useAuth((s) => s.users.length);
  const close = useUi((s) => s.close);
  const [form, setForm] = useState({ name: '', email: '', role: 'Member' as Role, team: 'Mergers' });
  const [error, setError] = useState('');
  const full = count >= seats();
  return (
    <Modal id="add-user" width={480} label="Add user">
      <form onSubmit={(e) => { e.preventDefault(); const r = addUser(form); if (!r.ok) return setError(r.reason); setForm({ name: '', email: '', role: 'Member', team: 'Mergers' }); setError(''); close('add-user'); }}>
        <div className="px-[22px] py-[16px] border-b border-border"><h2 className="text-[18px] text-ink font-semibold">Add user</h2></div>
        <div className="px-[22px] py-[18px] space-y-[12px] text-[14px]">
          {full && <p role="alert" className="bg-[#FDF3F2] border border-[#F3C9C5] rounded-card p-[10px] text-[#9B1C1C]" data-seats-full>All {seats()} licences are assigned. Remove a user first to free a licence.</p>}
          <label className="block text-ink">Full name<input required data-autofocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-3" data-new-name /></label>
          <label className="block text-ink">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-3" data-new-email /></label>
          <label className="block text-ink">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-2 bg-white"><option>Member</option><option>Administrator</option></select></label>
          <p className="text-[13px] text-text">Every user gets full functionality. Administrators also get this console.</p>
          {error && !full && <p role="alert" className="text-[#C0392B]">{error}</p>}
        </div>
        <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
          <button type="button" className={btnOutline} onClick={() => close('add-user')}>Cancel</button>
          <button type="submit" disabled={full} className={btnPrimary} data-submit-user>Send invite</button>
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ usage
function UsageTab() {
  const users = useAuth((s) => s.users);
  const { preset, setPreset, range, setRange } = useRange('30d');
  const log = useMemo(() => allUsage(), [range]); // eslint-disable-line react-hooks/exhaustive-deps
  const rep = useMemo(() => usageReport(log, users, range), [log, users, range]);
  const [drill, setDrill] = useState<string | null>(null);
  const top = [...rep.perUser].sort((a, b) => b.connectionMs - a.connectionMs).slice(0, 15);
  const kpi = (label: string, value: string, key: string) => <div className="bg-white border border-card-border rounded-card p-[14px]" data-kpi={key}><div className="text-[13px] text-text">{label}</div><div className="text-[24px] font-bold text-ink">{value}</div></div>;
  const period = `${new Date(range.from).toLocaleDateString('en-GB')} to ${new Date(range.to - 864e5).toLocaleDateString('en-GB')}`;
  const spec = (): ExportSpec => ({
    title: 'Usage report', subtitle: period, filtersUsed: [`Period: ${period}`],
    sheets: [
      { name: 'Summary', columns: [{ key: 'k', label: 'Measure' }, { key: 'v', label: 'Value' }], rows: [['Active users', rep.kpis.activeUsers], ['Sessions', rep.kpis.sessions], ['Average session', fmtDuration(rep.kpis.avgSessionMs)], ['Total connection time', fmtDuration(rep.kpis.connectionMs)], ['Page views', rep.kpis.views], ['Exports', rep.kpis.exports]].map(([k, v]) => ({ k, v })) },
      { name: 'Per user', columns: [{ key: 'name', label: 'User' }, { key: 'sessions', label: 'Sessions', format: 'int' }, { key: 'mins', label: 'Connection time (min)', format: 'int' }, { key: 'views', label: 'Page views', format: 'int' }, { key: 'exports', label: 'Exports', format: 'int' }, { key: 'last', label: 'Last login' }], rows: rep.perUser.map((r) => ({ name: r.user.name, sessions: r.sessions, mins: Math.round(r.connectionMs / 60e3), views: r.views, exports: r.exports, last: dt(r.lastLogin) })) },
      { name: 'Daily active users', columns: [{ key: 'day', label: 'Day', format: 'date' }, { key: 'active', label: 'Active users', format: 'int' }], rows: rep.daily },
      { name: 'Most viewed companies', columns: [{ key: 'name', label: 'Company' }, { key: 'views', label: 'Views', format: 'int' }, { key: 'users', label: 'Users', format: 'int' }], rows: rep.topCompanies },
    ],
    sources: ['in-house'], viewPath: '/admin/usage', toc: true,
  });
  return (
    <>
      <div className="flex flex-wrap items-center gap-[10px] mb-[14px]">
        <RangePicker preset={preset} setPreset={setPreset} range={range} setRange={setRange} />
        <div className="ml-auto"><ExportMenu label="Export report" build={spec} filename="usage-report" /></div>
      </div>
      <div className="grid grid-cols-6 gap-[12px] mb-[16px]">
        {kpi('Active users', formatInt(rep.kpis.activeUsers), 'active')}{kpi('Sessions', formatInt(rep.kpis.sessions), 'sessions')}{kpi('Average session', fmtDuration(rep.kpis.avgSessionMs), 'avg')}
        {kpi('Connection time', fmtDuration(rep.kpis.connectionMs), 'time')}{kpi('Page views', formatInt(rep.kpis.views), 'views')}{kpi('Exports', formatInt(rep.kpis.exports), 'exports')}
      </div>
      <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
        <Panel title="Daily active users"><ReactECharts style={{ height: 240 }} option={{ grid: { left: 40, right: 16, top: 16, bottom: 30 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: rep.daily.map((x) => x.day.slice(5)) }, yAxis: { type: 'value', minInterval: 1 }, series: [{ type: 'line', data: rep.daily.map((x) => x.active), smooth: true, itemStyle: { color: '#4B4291' }, areaStyle: { opacity: 0.08 } }], aria: { enabled: true } }} /></Panel>
        <Panel title="Views by section"><ReactECharts style={{ height: 240 }} option={{ tooltip: {}, legend: { right: 0, orient: 'vertical', top: 'middle' }, series: [{ type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], data: rep.bySection.map((s) => ({ name: SECTION_LABEL[s.section] ?? s.section, value: s.views })), label: { show: false } }], color: ['#4B4291', '#467BAD', '#E0662E', '#34C345', '#B61483', '#4DA29D', '#C98A1E', '#999'], aria: { enabled: true } }} /></Panel>
        <Panel title="Sessions per user (top 15)"><ReactECharts style={{ height: 300 }} option={{ grid: { left: 120, right: 30, top: 10, bottom: 20 }, tooltip: {}, xAxis: { type: 'value' }, yAxis: { type: 'category', data: top.map((r) => r.user.name).reverse() }, series: [{ type: 'bar', data: top.map((r) => r.sessions).reverse(), itemStyle: { color: '#467BAD' } }], aria: { enabled: true } }} /></Panel>
        <Panel title="Connection time per user, hours (top 15)"><ReactECharts style={{ height: 300 }} option={{ grid: { left: 120, right: 30, top: 10, bottom: 20 }, tooltip: {}, xAxis: { type: 'value' }, yAxis: { type: 'category', data: top.map((r) => r.user.name).reverse() }, series: [{ type: 'bar', data: top.map((r) => Math.round(r.connectionMs / 36e5 * 10) / 10).reverse(), itemStyle: { color: '#4DA29D' } }], aria: { enabled: true } }} /></Panel>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-[16px] items-start">
        <Panel title="Per user" bodyClass="overflow-x-auto">
          <table className="w-full border-collapse" data-usage-users>
            <thead><tr>{['User', 'Sessions', 'Connection time', 'Views', 'Exports', 'Last login', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{rep.perUser.map((r) => (
              <tr key={r.user.id} className={drill === r.user.id ? 'bg-primary-light/60' : ''}>
                <td className={`${td} font-semibold`}>{r.user.name}</td><td className={td}>{r.sessions}</td><td className={td}>{fmtDuration(r.connectionMs)}</td><td className={td}>{r.views}</td><td className={td}>{r.exports}</td><td className={`${td} whitespace-nowrap`}>{dt(r.lastLogin)}</td>
                <td className={td}><button className="text-primary hover:underline text-[13px]" onClick={() => setDrill(r.user.id)} data-drill={r.user.email}>Sessions & views</button></td>
              </tr>
            ))}</tbody>
          </table>
        </Panel>
        <div className="space-y-[16px]">
          <Panel title="Most viewed companies" bodyClass="">
            <table className="w-full border-collapse"><thead><tr>{['Company', 'Views', 'Users'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>{rep.topCompanies.map((c) => <tr key={c.id}><td className={td}><Link to={profilePath(c.id)} className="text-primary hover:underline">{c.name}</Link></td><td className={td}>{c.views}</td><td className={td}>{c.users}</td></tr>)}</tbody></table>
          </Panel>
          {drill && <UserDrill userId={drill} range={range} />}
        </div>
      </div>
    </>
  );
}

function UserDrill({ userId, range }: { userId: string; range: Range }) {
  const user = useAuth((s) => s.users.find((u) => u.id === userId))!;
  const [tab, setTab] = useState<'sessions' | 'views'>('sessions');
  const log = useMemo(() => allUsage(), []);
  const sessions = sessionLog(log, userId, range);
  const views = viewsReport(log, userId, range);
  const spec = (): ExportSpec => ({
    title: `${user.name}: ${tab === 'sessions' ? 'session log' : 'views report'}`, viewPath: '/admin/usage', sources: ['in-house'],
    sheets: tab === 'sessions'
      ? [{ name: 'Sessions', columns: [{ key: 'in', label: 'Sign-in' }, { key: 'out', label: 'Sign-out' }, { key: 'mins', label: 'Minutes', format: 'int' }, { key: 'pages', label: 'Pages', format: 'int' }, { key: 'exports', label: 'Exports', format: 'int' }], rows: sessions.map((s) => ({ in: dt(s.session.start), out: dt(s.session.end), mins: Math.round(s.durationMs / 60e3), pages: s.pages, exports: s.exports.length })) }]
      : [{ name: 'Views', columns: [{ key: 'when', label: 'When' }, { key: 'type', label: 'Type' }, { key: 'what', label: 'Viewed', width: 40 }], rows: views.map((v) => ({ when: dt(v.ts), type: v.entityType, what: v.label ?? v.entityId })) }],
  });
  return (
    <Panel title={`${user.name}`} actions={<ExportMenu label="Export" build={spec} filename={`usage-${user.id}`} />} bodyClass="p-0" className="" >
      <div role="tablist" className="flex border-b border-card-border px-[12px]">
        {(['sessions', 'views'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`h-[34px] px-[10px] text-[14px] -mb-px border-b-2 ${tab === t ? 'border-primary text-primary font-semibold' : 'border-transparent'}`} data-drill-tab={t}>{t === 'sessions' ? `Session log (${sessions.length})` : `Views report (${views.length})`}</button>)}
      </div>
      <div className="max-h-[380px] overflow-y-auto nb-scroll" data-drill-panel={tab}>
        {tab === 'sessions' ? (
          <table className="w-full border-collapse text-[13px]"><thead><tr>{['Sign-in', 'Sign-out', 'Duration', 'Pages', 'Exports'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{sessions.map((s) => <tr key={s.session.id}><td className={td}>{dt(s.session.start)}</td><td className={td}>{dt(s.session.end)}</td><td className={td}>{fmtDuration(s.durationMs)}</td><td className={td}>{s.pages}</td><td className={td}>{s.exports.length}</td></tr>)}
              {!sessions.length && <tr><td colSpan={5} className={`${td} text-text`}>No sessions in this period.</td></tr>}</tbody></table>
        ) : (
          <table className="w-full border-collapse text-[13px]"><thead><tr>{['When', 'Type', 'Viewed'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{views.slice(0, 300).map((v, i) => <tr key={i}><td className={td}>{dt(v.ts)}</td><td className={`${td} capitalize`}>{v.entityType}</td><td className={td}>{v.entityType === 'company' && v.entityId ? <Link to={profilePath(v.entityId)} className="text-primary hover:underline">{v.label}</Link> : v.label ?? v.entityId}</td></tr>)}
              {!views.length && <tr><td colSpan={3} className={`${td} text-text`}>No company, person or report views in this period.</td></tr>}</tbody></table>
        )}
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------ audit
function AuditTab() {
  const entries = useAudit((s) => s.entries);
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const actions = [...new Set(entries.map((e) => e.action))].sort();
  const shown = entries.filter((e) => (!action || e.action === action) && (!q || `${e.actor} ${e.detail}`.toLowerCase().includes(q.toLowerCase())));
  const spec = (): ExportSpec => ({ title: 'Audit log', filtersUsed: [action ? `Action: ${action}` : 'All actions', q ? `Search: ${q}` : ''].filter(Boolean), viewPath: '/admin/audit', sources: ['in-house'],
    sheets: [{ name: 'Audit log', columns: [{ key: 'ts', label: 'When' }, { key: 'actor', label: 'By' }, { key: 'action', label: 'Action' }, { key: 'detail', label: 'Detail', width: 70 }], rows: shown.map((e) => ({ ts: dt(e.ts), actor: e.actor, action: e.action, detail: e.detail })) }] });
  return (
    <>
      <div className="flex items-center gap-[10px] mb-[12px] text-[14px]">
        <label className="inline-flex items-center gap-[6px]">Action<select value={action} onChange={(e) => setAction(e.target.value)} className="h-[30px] border border-border rounded-btn px-2 bg-white" data-audit-filter><option value="">All</option>{actions.map((a) => <option key={a}>{a}</option>)}</select></label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by person or detail" aria-label="Search audit log" className="h-[30px] w-[260px] border border-border rounded-btn px-[8px]" />
        <span className="text-text">{shown.length} entries</span>
        <div className="ml-auto"><ExportMenu label="Export" build={spec} filename="audit-log" /></div>
      </div>
      <Panel bodyClass="">
        <table className="w-full border-collapse" data-audit-table>
          <thead><tr>{['When', 'By', 'Action', 'Detail'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{shown.map((e) => <tr key={e.id}><td className={`${td} whitespace-nowrap`}>{dt(e.ts)}</td><td className={td}>{e.actor}</td><td className={`${td} font-semibold`}>{e.action}</td><td className={td}>{e.detail}</td></tr>)}</tbody>
        </table>
      </Panel>
      <div className="mt-[16px]"><Panel title="Bulk-export allowance (organisation)"><UsageMeter /></Panel></div>
    </>
  );
}
