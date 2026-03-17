import { useState } from 'react'
import { Star, Trash2, Archive, MailOpen } from 'lucide-react'
import { useMailStore } from '../../store/mailStore'
import type { Email } from '../../api/jmap'

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const dayMs = 86400000

  if (diff < dayMs && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 7 * dayMs) {
    return date.toLocaleDateString('ko-KR', { weekday: 'short' })
  }
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function MailList() {
  const {
    emails,
    selectedEmailId,
    selectedMailboxId,
    selectEmail,
    deleteEmail,
    archiveEmail,
    markRead,
    markUnread,
    toggleStar,
  } = useMailStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const filteredEmails = emails.filter(e =>
    selectedMailboxId ? e.mailboxIds[selectedMailboxId] : true
  )

  const mailboxName = selectedMailboxId
    ? selectedMailboxId.charAt(0).toUpperCase() + selectedMailboxId.slice(1)
    : '메일'

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-mail-unread">{mailboxName}</h2>
        <span className="text-xs text-mail-read">{filteredEmails.length}개</span>
      </div>

      {/* 메일 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-mail-read text-sm">
            메일이 없습니다
          </div>
        ) : (
          filteredEmails.map(email => (
            <EmailRow
              key={email.id}
              email={email}
              isSelected={email.id === selectedEmailId}
              isChecked={checkedIds.has(email.id)}
              isHovered={hoveredId === email.id}
              onSelect={() => selectEmail(email.id)}
              onHover={() => setHoveredId(email.id)}
              onLeave={() => setHoveredId(null)}
              onCheck={(e) => toggleCheck(email.id, e)}
              onStar={(e) => { e.stopPropagation(); toggleStar(email.id) }}
              onDelete={(e) => { e.stopPropagation(); deleteEmail(email.id) }}
              onArchive={(e) => { e.stopPropagation(); archiveEmail(email.id) }}
              onMarkRead={(e) => {
                e.stopPropagation()
                email.keywords?.['$seen'] ? markUnread(email.id) : markRead(email.id)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface EmailRowProps {
  email: Email
  isSelected: boolean
  isChecked: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
  onCheck: (e: React.MouseEvent) => void
  onStar: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
  onMarkRead: (e: React.MouseEvent) => void
}

function EmailRow({
  email, isSelected, isChecked, isHovered,
  onSelect, onHover, onLeave,
  onCheck, onStar, onDelete, onArchive, onMarkRead,
}: EmailRowProps) {
  const isRead = !!email.keywords?.['$seen']
  const isStarred = !!email.keywords?.['$flagged']
  const senderName = email.from[0]?.name || email.from[0]?.email || '(알 수 없음)'

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative flex items-start px-3 py-2.5 cursor-pointer border-b border-gray-100
        transition-colors duration-75 group
        ${isSelected ? 'bg-mail-selected' : isHovered ? 'bg-mail-hover' : 'bg-white'}
        ${!isRead ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
      `}
    >
      {/* 체크박스 */}
      <div className="flex-none mr-2 mt-0.5" onClick={onCheck}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
      </div>

      {/* 별표 */}
      <div className="flex-none mr-2 mt-0.5" onClick={onStar}>
        <Star
          size={16}
          className={`cursor-pointer transition-colors ${
            isStarred
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
        />
      </div>

      {/* 메일 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span
            className={`text-sm truncate ${
              !isRead ? 'font-semibold text-mail-unread' : 'font-normal text-mail-read'
            }`}
          >
            {senderName}
          </span>
          <span className="flex-none text-xs text-mail-read whitespace-nowrap">
            {formatDate(email.receivedAt)}
          </span>
        </div>
        <div
          className={`text-xs truncate mt-0.5 ${
            !isRead ? 'font-medium text-mail-unread' : 'text-mail-read'
          }`}
        >
          {email.subject}
        </div>
        <div className="text-xs text-gray-400 truncate mt-0.5">
          {email.preview}
        </div>
      </div>

      {/* hover 시 액션 버튼 */}
      {isHovered && !isSelected && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-100 px-1"
          onClick={e => e.stopPropagation()}
        >
          <ActionBtn icon={<Trash2 size={14} />} label="삭제" onClick={onDelete} />
          <ActionBtn icon={<Archive size={14} />} label="보관" onClick={onArchive} />
          <ActionBtn
            icon={<MailOpen size={14} />}
            label={isRead ? '읽지않음' : '읽음'}
            onClick={onMarkRead}
          />
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  icon, label, onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
    >
      {icon}
    </button>
  )
}
