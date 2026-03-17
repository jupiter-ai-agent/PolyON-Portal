import { useMemo } from 'react'
import { Reply, Forward, Trash2, Paperclip, MoreHorizontal } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import DOMPurify from 'dompurify'
import { useMailStore } from '../../store/mailStore'

function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function MailReader() {
  const { emails, selectedEmailId, deleteEmail, openCompose } = useMailStore()
  const email = emails.find(e => e.id === selectedEmailId)

  // HTML 메일 sanitize
  const sanitizedHtml = useMemo(() => {
    if (!email) return ''
    const rawHtml = email.bodyValues?.['body']?.value
    if (!rawHtml) return `<p style="color:#666">${email.preview}</p>`
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a',
        'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'img', 'div', 'span', 'hr', 'pre', 'code',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel'],
    })
  }, [email])

  if (!email) return null

  const senderName = email.from[0]?.name || email.from[0]?.email
  const senderEmail = email.from[0]?.email

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 툴바 */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100">
        <button
          onClick={() => openCompose()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Reply size={14} />
          답장
        </button>
        <button
          onClick={() => openCompose()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Forward size={14} />
          전달
        </button>
        <button
          onClick={() => deleteEmail(email.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
          삭제
        </button>

        <div className="ml-auto">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-sm"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 outline-none">
                  읽지않음으로 표시
                </DropdownMenu.Item>
                <DropdownMenu.Item className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 outline-none">
                  보관함으로 이동
                </DropdownMenu.Item>
                <DropdownMenu.Item className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 outline-none">
                  스팸으로 신고
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                <DropdownMenu.Item className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 outline-none">
                  원본 보기
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* 메일 본문 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* 제목 */}
        <h1 className="text-xl font-semibold text-mail-unread mb-4 leading-snug">
          {email.subject}
        </h1>

        {/* 발신자 정보 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-none">
              {senderName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="text-sm font-semibold text-mail-unread">
                {senderName}
                {email.from[0]?.name && (
                  <span className="font-normal text-mail-read ml-1">
                    &lt;{senderEmail}&gt;
                  </span>
                )}
              </div>
              <div className="text-xs text-mail-read">
                수신: {email.to.map(t => t.name || t.email).join(', ')}
              </div>
            </div>
          </div>
          <div className="text-xs text-mail-read whitespace-nowrap">
            {formatFullDate(email.receivedAt)}
          </div>
        </div>

        {/* 첨부파일 */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {email.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Paperclip size={14} className="text-gray-400" />
                <span className="font-medium">{att.name || `첨부파일 ${i + 1}`}</span>
                {att.size && (
                  <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 본문 iframe */}
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #202124;
                  margin: 0;
                  padding: 0;
                }
                a { color: #1a73e8; }
                img { max-width: 100%; height: auto; }
                p { margin: 0 0 1em; }
                blockquote {
                  border-left: 3px solid #dadce0;
                  margin: 0;
                  padding: 0 0 0 1em;
                  color: #5f6368;
                }
              </style>
            </head>
            <body>${sanitizedHtml}</body>
            </html>
          `}
          className="w-full border-none"
          style={{ minHeight: '300px' }}
          title="메일 본문"
          sandbox="allow-same-origin"
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement
            if (iframe.contentDocument) {
              iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px'
            }
          }}
        />
      </div>

      {/* 하단: 빠른 답장 */}
      <div className="border-t border-gray-100 px-8 py-4">
        <div
          onClick={() => openCompose()}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-mail-read text-sm cursor-text hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Reply size={16} className="text-gray-400" />
          <span>답장 입력...</span>
        </div>
      </div>
    </div>
  )
}
