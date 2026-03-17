import * as Separator from '@radix-ui/react-separator'
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  AlertTriangle,
  Trash2,
  PencilLine,
} from 'lucide-react'
import { useMailStore } from '../../store/mailStore'
import type { Mailbox } from '../../api/jmap'

const MAILBOX_ICONS: Record<string, React.ElementType> = {
  inbox: Inbox,
  starred: Star,
  sent: Send,
  drafts: FileEdit,
  spam: AlertTriangle,
  trash: Trash2,
}

const MAILBOX_ORDER = ['inbox', 'starred', 'sent', 'drafts', 'spam', 'trash']

export function MailSidebar() {
  const { mailboxes, selectedMailboxId, selectMailbox, openCompose } = useMailStore()

  const sortedMailboxes = [...mailboxes].sort(
    (a, b) =>
      MAILBOX_ORDER.indexOf(a.id) - MAILBOX_ORDER.indexOf(b.id)
  )

  return (
    <div className="flex flex-col h-full py-2">
      {/* Compose 버튼 */}
      <div className="px-3 mb-4">
        <button
          onClick={openCompose}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium text-sm shadow-sm hover:shadow-md transition-all duration-150"
        >
          <PencilLine size={18} />
          <span>새 메일 작성</span>
        </button>
      </div>

      <Separator.Root className="h-px bg-gray-200 mx-3 mb-2" />

      {/* 메일함 목록 */}
      <nav className="flex-1 px-1">
        {sortedMailboxes.map(mailbox => (
          <MailboxItem
            key={mailbox.id}
            mailbox={mailbox}
            isSelected={mailbox.id === selectedMailboxId}
            onSelect={() => selectMailbox(mailbox.id)}
          />
        ))}
      </nav>

      <Separator.Root className="h-px bg-gray-200 mx-3 my-2" />

      {/* 하단 여백 */}
      <div className="px-3 py-2 text-xs text-mail-read opacity-50 text-center">
        PolyON Mail
      </div>
    </div>
  )
}

interface MailboxItemProps {
  mailbox: Mailbox
  isSelected: boolean
  onSelect: () => void
}

function MailboxItem({ mailbox, isSelected, onSelect }: MailboxItemProps) {
  const Icon = MAILBOX_ICONS[mailbox.id] || Inbox

  return (
    <button
      onClick={onSelect}
      className={`
        flex items-center justify-between w-full px-3 py-2 rounded-r-full text-sm
        transition-colors duration-100 mb-0.5
        ${isSelected
          ? 'bg-mail-selected text-mail-unread font-semibold'
          : 'text-mail-read hover:bg-mail-hover'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          size={18}
          className={isSelected ? 'text-blue-600' : 'text-gray-500'}
        />
        <span className="truncate">{mailbox.name}</span>
      </div>
      {mailbox.unreadEmails > 0 && (
        <span
          className={`
            text-xs font-semibold min-w-5 text-right
            ${isSelected ? 'text-blue-700' : 'text-mail-unread'}
          `}
        >
          {mailbox.unreadEmails}
        </span>
      )}
    </button>
  )
}
