import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { AppHeader } from './components/chrome/AppHeader';
import { Footer } from './components/chrome/Footer';
import { FloatingHelp } from './components/chrome/FloatingHelp';
import { CollectionModal } from './components/results/CollectionModal';
import { CompanyDrawer } from './components/results/CompanyDrawer';
import { TourEngine } from './components/tour/TourEngine';
import { BookDemoModal } from './components/tour/BookDemoModal';
import { SaveSearchModal, OpenSearchModal, HelpModal } from './components/chrome/SearchModals';
import { SearchPage } from './pages/search/SearchPage';
import { setNavigate } from './lib/nav';

const CompanyPage = lazy(() => import('./pages/company/CompanyPage'));

function NavBridge() {
  const navigate = useNavigate();
  useEffect(() => setNavigate((to, opts) => navigate(to, opts)), [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBridge />
      <div className="min-h-screen flex flex-col bg-page">
        <AppHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route
              path="/companies/:id/:section?"
              element={<Suspense fallback={<div className="py-20 text-center text-muted">Loading…</div>}><CompanyPage /></Suspense>}
            />
            <Route path="*" element={<SearchPage />} />
          </Routes>
        </main>
        <Footer />
        <FloatingHelp />
        <CollectionModal />
        <CompanyDrawer />
        <BookDemoModal />
        <SaveSearchModal />
        <OpenSearchModal />
        <HelpModal />
        <TourEngine />
      </div>
    </BrowserRouter>
  );
}
