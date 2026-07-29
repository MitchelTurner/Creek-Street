import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BoardPage } from './pages/BoardPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { DocketPage } from './pages/DocketPage';
import { GuidancePage } from './pages/GuidancePage';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { OpenDataPage } from './pages/OpenDataPage';
import { StructureDetailPage } from './pages/StructureDetailPage';
import { StructuresPage } from './pages/StructuresPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
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
