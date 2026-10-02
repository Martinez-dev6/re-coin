import { Route, Routes } from 'react-router-dom';
import Provisional from './pantallas/Provisional.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Provisional />} />
    </Routes>
  );
}
