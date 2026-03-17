import { MailSidebar } from './MailSidebar'
import { MailList } from './MailList'
import { MailReader } from './MailReader'
import { MailCompose } from './MailCompose'
import { useMailStore } from '../../store/mailStore'

export function MailLayout() {
  const selectedEmailId = useMailStore(s => s.selectedEmailId)

  return (
    <div className="flex h-screen bg-mail-bg font-sans overflow-hidden">
      {/* 좌측 사이드바: 240px 고정 */}
      <aside className="w-60 flex-none bg-mail-bg overflow-y-auto">
        <MailSidebar />
      </aside>

      {/* 중앙 메일 목록: 320px 고정 */}
      <section
        className="flex-none overflow-y-auto border-r border-gray-200 bg-white"
        style={{ width: '320px' }}
      >
        <MailList />
      </section>

      {/* 우측 메일 리더: flex-1 */}
      <main className="flex-1 overflow-y-auto bg-white">
        {selectedEmailId ? (
          <MailReader />
        ) : (
          <div className="flex items-center justify-center h-full text-mail-read text-sm">
            <div className="text-center">
              <div className="text-4xl mb-4">✉️</div>
              <p>메일을 선택하세요</p>
            </div>
          </div>
        )}
      </main>

      {/* 작성 모달 (우측 하단 고정) */}
      <MailCompose />
    </div>
  )
}
