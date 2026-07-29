import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { BoardPage } from './pages/BoardPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { DocketPage } from './pages/DocketPage';
import { DraftBuilderPage } from './pages/DraftBuilderPage';
import { GuidancePage } from './pages/GuidancePage';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { NoticePage } from './pages/NoticePage';
import { OfficialApplicationPage } from './pages/OfficialApplicationPage';
import { OfficialPortalPage } from './pages/OfficialPortalPage';
import { OpenDataPage } from './pages/OpenDataPage';
import { PermitsPage } from './pages/PermitsPage';
import { PhotosPage } from './pages/PhotosPage';
import { PrecedentsPage } from './pages/PrecedentsPage';
import { StructureDetailPage } from './pages/StructureDetailPage';
import { StructuresPage } from './pages/StructuresPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TimelinesPage } from './pages/TimelinesPage';
import { TriagePage } from './pages/TriagePage';
import { WorkspacePage } from './pages/WorkspacePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="workspace" element={<WorkspacePage />} />
        <Route path="workspace/:id" element={<DraftBuilderPage />} />
        <Route path="official" element={<OfficialPortalPage />} />
        <Route path="official/applications/:id" element={<OfficialApplicationPage />} />
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
        <Route path="guidance" element={<GuidancePage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="opendata" element={<OpenDataPage />} />
      </Route>
    </Routes>
  );
}
