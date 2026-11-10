import { useMonitoring, type Alert, type EventType, type Rule } from './store';
import { getCompany } from '../data/dataset';
import { getPerson } from '../data/persons';
import { useCollections } from '../store/collectionsStore';
import { articleUrl } from '../data/news';

const TEXT: Record<EventType, (name: string) => string> = {
  'Financial results': (n) => `${n} filed annual accounts showing turnover up 12%`,
  'Credit changes': (n) => `${n}: credit limit reduced by the credit reference partner`,
  'Sector developments': (n) => `New sector report mentions ${n}`,
  'M&A': (n) => `${n} announced the acquisition of a smaller competitor`,
  'Insolvency & administration': (n) => `Notice of intention to appoint administrators filed for ${n}`,
  'Leadership changes': (n) => `${n} appointed a new chief financial officer`,
  Regulatory: (n) => `Regulator published a decision concerning ${n}`,
  Filings: (n) => `${n} filed a confirmation statement`,
  'Officer changes': (n) => `A director of ${n} resigned`,
  'Ownership changes': (n) => `New shareholder holding more than 25% notified at ${n}`,
  'Credit rating changes': (n) => `${n} credit rating moved from B to C`,
  'Insolvency events': (n) => `Winding-up petition presented against ${n}`,
  'New companies matching a saved search': (n) => `3 new companies now match “${n}”`,
};

function linkFor(rule: Rule, type: EventType): string {
  const t = rule.target;
  if (t.kind === 'company') return `/companies/${t.id}${type === 'Officer changes' || type === 'Leadership changes' ? '/people' : type === 'Ownership changes' ? '/ownership' : type === 'Filings' || type === 'Financial results' ? '/filing-history' : ''}`;
  if (t.kind === 'person') return `/people/${t.id}`;
  return '/';
}

/** Demo-only: generate realistic events for every active rule so alerts can be shown live. */
export function simulateEvents(perRule = 2): number {
  const { rules, addAlerts } = useMonitoring.getState();
  const now = Date.now();
  const alerts: Alert[] = [];
  rules.filter((r) => !r.paused).forEach((rule, ri) => {
    for (let k = 0; k < perRule; k++) {
      const type = rule.events[(ri + k + Math.floor(now / 1000)) % rule.events.length];
      let name = rule.target.label;
      if (rule.target.kind === 'collection') {
        const col = useCollections.getState().collections.find((c) => c.id === rule.target.id);
        const cid = col?.companyIds[(k + ri) % Math.max(1, col.companyIds.length)];
        name = (cid && getCompany(cid)?.name) || name;
      }
      if (rule.target.kind === 'person') {
        const p = getPerson(rule.target.id);
        const co = p && getCompany(p.appointments[k % p.appointments.length]?.companyId);
        name = co ? `${co.name} (where ${p!.name} is a director)` : name;
      }
      const id = `al-${now.toString(36)}-${ri}-${k}`;
      alerts.push({ id, ruleId: rule.id, target: rule.target, type, title: TEXT[type](name), ts: new Date(now - k * 60e3).toISOString(), read: false, link: linkFor(rule, type), sourceName: 'Sample event feed', sourceUrl: articleUrl('alerts.example', id) });
    }
  });
  addAlerts(alerts);
  return alerts.length;
}
