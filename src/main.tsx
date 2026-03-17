import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { initAuth } from './auth/keycloak'
import App from './App'
import './index.css'

function AuthLoader() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    initAuth().then(({ authenticated, error }) => {
      if (authenticated) {
        setStatus('ok')
      } else {
        setError(error || '인증 실패')
        setStatus('error')
      }
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">인증 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">메일 서버 연결 실패</h2>
          <p className="text-sm text-gray-500 mb-6">{error || '인증이 필요합니다. 다시 로그인해 주세요.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return <App />
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <AuthLoader />
  </StrictMode>
)
