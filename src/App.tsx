import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MailPage } from './pages/mail/MailPage'

// PolyON Portal — 메인 앱 라우터
// 기존 Portal 기능은 index.html vanilla JS로 별도 제공
// React SPA는 /mail/* 로 시작

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 웹메일 라우트 */}
        <Route path="/mail/*" element={<MailPage />} />

        {/* 루트: 메일로 리다이렉트 (개발용) */}
        <Route path="/" element={<Navigate to="/mail" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/mail" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
