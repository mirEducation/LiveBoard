import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { generateBoardId } from './utils/id';
import BoardPage from './components/BoardPage';

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/${generateBoardId()}`, { replace: true });
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:boardId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
