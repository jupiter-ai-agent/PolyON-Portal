import { useEffect, useRef } from 'react'
import { MailLayout } from './MailLayout'
import { useMailStore } from '../../store/mailStore'
import { createJMAPEventSource } from '../../api/jmap'

export function MailPage() {
  const {
    session,
    accountId,
    selectedMailboxId,
    loadSession,
    loadMailboxes,
    loadEmails,
    error,
  } = useMailStore()

  const esRef = useRef<EventSource | null>(null)

  // 1) 앱 마운트 시 JMAP 세션 로드
  useEffect(() => {
    loadSession()
  }, [loadSession])

  // 2) 세션 확보 후 메일함 로드
  useEffect(() => {
    if (!accountId) return
    loadMailboxes()
  }, [accountId, loadMailboxes])

  // 3) 메일함 선택 시 이메일 목록 로드
  useEffect(() => {
    if (!selectedMailboxId || !accountId) return
    loadEmails(selectedMailboxId)
  }, [selectedMailboxId, accountId, loadEmails])

  // 4) EventSource 실시간 알림
  //    브라우저 EventSource는 Authorization 헤더 미지원.
  //    → URL 쿼리 파라미터로 토큰 전달 (HTTPS 환경에서만 안전).
  //    → 토큰 없으면 쿠키 기반 세션으로 폴백.
  useEffect(() => {
    if (!session || !accountId) return

    // 기존 EventSource 정리
    esRef.current?.close()

    const es = createJMAPEventSource(
      (changedState) => {
        // 상태 변경 감지 → 현재 메일함 새로고침
        console.log('[JMAP EventSource] state changed:', changedState)
        if (selectedMailboxId) {
          loadEmails(selectedMailboxId)
        }
        loadMailboxes()
      },
      (e) => {
        console.warn('[JMAP EventSource] error:', e)
        // 에러 시 EventSource 자동 재연결은 브라우저가 처리
      }
    )

    esRef.current = es

    return () => {
      es?.close()
      esRef.current = null
    }
  }, [session, accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 에러 상태 표시
  if (error && !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">메일 서버 연결 실패</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadSession()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return <MailLayout />
}
