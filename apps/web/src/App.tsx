import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const BoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.BoardPage })));
const CompliancePage = lazy(() =>
  import('./pages/CompliancePage').then((m) => ({ default: m.CompliancePage })),
);
const ConstructionPage = lazy(() =>
  import('./pages/ConstructionPage').then((m) => ({ default: m.ConstructionPage })),
);
const DecisionsPage = lazy(() =>
  import('./pages/DecisionsPage').then((m) => ({ default: m.DecisionsPage })),
);
const DocketPage = lazy(() => import('./pages/DocketPage').then((m) => ({ default: m.DocketPage })));
const DraftBuilderPage = lazy(() =>
  import('./pages/DraftBuilderPage').then((m) => ({ default: m.DraftBuilderPage })),
);
const GuidancePage = lazy(() =>
  import('./pages/GuidancePage').then((m) => ({ default: m.GuidancePage })),
);
const IngestAdminPage = lazy(() =>
  import('./pages/IngestAdminPage').then((m) => ({ default: m.IngestAdminPage })),
);
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const MeetingsPage = lazy(() =>
  import('./pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })),
);
const MeetingOutcomesPage = lazy(() =>
  import('./pages/MeetingOutcomesPage').then((m) => ({ default: m.MeetingOutcomesPage })),
);
const NoticePage = lazy(() => import('./pages/NoticePage').then((m) => ({ default: m.NoticePage })));
const OfficialApplicationPage = lazy(() =>
  import('./pages/OfficialApplicationPage').then((m) => ({ default: m.OfficialApplicationPage })),
);
const OfficialPortalPage = lazy(() =>
  import('./pages/OfficialPortalPage').then((m) => ({ default: m.OfficialPortalPage })),
);
const OfficialMeetingPrepPage = lazy(() =>
  import('./pages/OfficialMeetingPrepPage').then((m) => ({ default: m.OfficialMeetingPrepPage })),
);
const OfficialMeetingOutcomesPage = lazy(() =>
  import('./pages/OfficialMeetingOutcomesPage').then((m) => ({
    default: m.OfficialMeetingOutcomesPage,
  })),
);
const OpenDataPage = lazy(() =>
  import('./pages/OpenDataPage').then((m) => ({ default: m.OpenDataPage })),
);
const OpsDashboardPage = lazy(() =>
  import('./pages/OpsDashboardPage').then((m) => ({ default: m.OpsDashboardPage })),
);
const StaffQueuePage = lazy(() =>
  import('./pages/StaffQueuePage').then((m) => ({ default: m.StaffQueuePage })),
);
const PermitsPage = lazy(() =>
  import('./pages/PermitsPage').then((m) => ({ default: m.PermitsPage })),
);
const PhotosPage = lazy(() => import('./pages/PhotosPage').then((m) => ({ default: m.PhotosPage })));
const PrecedentsPage = lazy(() =>
  import('./pages/PrecedentsPage').then((m) => ({ default: m.PrecedentsPage })),
);
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const StructureDetailPage = lazy(() =>
  import('./pages/StructureDetailPage').then((m) => ({ default: m.StructureDetailPage })),
);
const StructuresPage = lazy(() =>
  import('./pages/StructuresPage').then((m) => ({ default: m.StructuresPage })),
);
const SubscriptionsPage = lazy(() =>
  import('./pages/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })),
);
const TimelinesPage = lazy(() =>
  import('./pages/TimelinesPage').then((m) => ({ default: m.TimelinesPage })),
);
const TriagePage = lazy(() => import('./pages/TriagePage').then((m) => ({ default: m.TriagePage })));
const VisitIndexPage = lazy(() =>
  import('./pages/VisitIndexPage').then((m) => ({ default: m.VisitIndexPage })),
);
const VisitStructurePage = lazy(() =>
  import('./pages/VisitStructurePage').then((m) => ({ default: m.VisitStructurePage })),
);
const WorkspacePage = lazy(() =>
  import('./pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage })),
);

function RouteFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/50" role="status">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="visit" element={<VisitIndexPage />} />
            <Route path="visit/:slug" element={<VisitStructurePage />} />
            <Route path="construction" element={<ConstructionPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="workspace/:id" element={<DraftBuilderPage />} />
            <Route path="official" element={<OfficialPortalPage />} />
            <Route path="official/meetings/:id" element={<OfficialMeetingPrepPage />} />
            <Route path="official/meetings/:id/outcomes" element={<OfficialMeetingOutcomesPage />} />
            <Route path="official/applications/:id" element={<OfficialApplicationPage />} />
            <Route path="admin/ingest" element={<IngestAdminPage />} />
            <Route path="admin/ops" element={<OpsDashboardPage />} />
            <Route path="admin/queue" element={<StaffQueuePage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="timelines" element={<TimelinesPage />} />
            <Route path="photos" element={<PhotosPage />} />
            <Route path="triage" element={<TriagePage />} />
            <Route path="permits" element={<PermitsPage />} />
            <Route path="precedents" element={<PrecedentsPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="structures" element={<StructuresPage />} />
            <Route path="structures/:slug" element={<StructureDetailPage />} />
            <Route path="docket" element={<DocketPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id/outcomes" element={<MeetingOutcomesPage />} />
            <Route path="guidance" element={<GuidancePage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="opendata" element={<OpenDataPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
