import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}
