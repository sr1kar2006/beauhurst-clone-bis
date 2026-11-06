import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Company } from '../../data/types';
import { formatInt, formatMoney } from '../../lib/format';
import { useResults } from '../../store/resultsStore';

const pin = L.divIcon({
  className: '',
  html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#4B4291;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

function Clusters({ results }: { results: Company[] }) {
  const map = useMap();
  const openProfile = useResults((s) => s.openProfile);
  useEffect(() => {
    const group = L.markerClusterGroup({ chunkedLoading: true, showCoverageOnHover: false, maxClusterRadius: 50 });
    results.forEach((c) => {
      const m = L.marker([c.lat, c.lng], { icon: pin, title: c.name });
      const popup = document.createElement('div');
      popup.innerHTML = `<div style="font-family:'Public Sans',sans-serif;min-width:160px"><div style="font-weight:600;color:#282828;font-size:14px">${esc(c.name)}</div><div style="color:#595959;font-size:13px">${esc(c.headOffice)}</div><div style="margin-top:4px;font-size:13px">Fundraising total: <strong>${formatMoney(c.fundraisingTotal) || '—'}</strong></div><button style="margin-top:6px;color:#4B4291;text-decoration:underline;font-size:13px">View profile</button></div>`;
      popup.querySelector('button')!.addEventListener('click', () => openProfile(c.id));
      m.bindPopup(popup);
      group.addLayer(m);
    });
    map.addLayer(group);
    if (results.length) {
      const b = group.getBounds();
      if (b.isValid()) map.fitBounds(b, { padding: [30, 30], maxZoom: 9 });
    }
    return () => { map.removeLayer(group); };
  }, [map, results, openProfile]);
  return null;
}

export function ResultsMap({ results, plural = 'companies' }: { results: Company[]; plural?: string }) {
  return (
    <div className="max-w-content mx-auto">
      <p className="text-[14px] text-muted mb-[12px]">Head offices of the {formatInt(results.length)} {plural} in your search results. Click a cluster to zoom in.</p>
      <div className="bg-surface border border-border rounded-card overflow-hidden" style={{ height: 620 }}>
        <MapContainer center={[54.3, -2.5]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Clusters results={results} />
        </MapContainer>
      </div>
    </div>
  );
}
