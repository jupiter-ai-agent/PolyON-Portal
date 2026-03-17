import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  X, Minimize2, Maximize2, Paperclip,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon,
  Send, FileEdit,
} from 'lucide-react'
import { useMailStore } from '../../store/mailStore'

export function MailCompose() {
  const { isComposeOpen, closeCompose, sendMail } = useMailStore()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-32 prose prose-sm max-w-none',
      },
    },
  })

  const handleSend = async () => {
    if (!to) return
    setIsSending(true)
    try {
      await sendMail({
        to: [{ name: null, email: to }],
        subject,
        htmlBody: [{ type: 'text/html', partId: 'body' }],
        bodyValues: {
          body: { value: editor?.getHTML() || '' },
        },
      })
      closeCompose()
      setTo(''); setCc(''); setBcc(''); setSubject('')
      editor?.commands.clearContent()
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveDraft = async () => {
    // TODO: Email/set create draft
    closeCompose()
  }

  if (!isComposeOpen) return null

  const positionClass = isMaximized
    ? 'inset-4 rounded-xl'
    : 'bottom-0 right-4 w-[520px] rounded-t-xl'

  return (
    <div
      className={`fixed z-50 bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200 ${positionClass}`}
      style={isMaximized ? {} : { maxHeight: isMinimized ? '40px' : '520px' }}
    >
      {/* 타이틀바 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 text-white rounded-t-xl flex-none">
        <span className="text-sm font-medium">새 메일</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(v => !v)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(v => !v)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={closeCompose}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 본문 — 최소화 시 숨김 */}
      {!isMinimized && (
        <>
          {/* 수신자 필드 */}
          <div className="border-b border-gray-100 flex-none">
            <RecipientField
              label="받는 사람"
              value={to}
              onChange={setTo}
              extra={
                <div className="flex gap-2 text-xs text-gray-400">
                  {!showCc && (
                    <button onClick={() => setShowCc(true)} className="hover:text-gray-600">
                      참조
                    </button>
                  )}
                  {!showBcc && (
                    <button onClick={() => setShowBcc(true)} className="hover:text-gray-600">
                      숨김
                    </button>
                  )}
                </div>
              }
            />
            {showCc && (
              <RecipientField label="참조" value={cc} onChange={setCc} />
            )}
            {showBcc && (
              <RecipientField label="숨김참조" value={bcc} onChange={setBcc} />
            )}
            <div className="flex items-center px-3 py-2 border-t border-gray-100">
              <span className="text-xs text-gray-400 w-12 flex-none">제목</span>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="제목을 입력하세요"
                className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
              />
            </div>
          </div>

          {/* TipTap 에디터 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <EditorContent editor={editor} className="text-sm text-gray-800" />
          </div>

          {/* 포맷 툴바 */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-gray-100 flex-none">
            <FormatBtn
              label="굵게"
              icon={<Bold size={14} />}
              active={editor?.isActive('bold')}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            />
            <FormatBtn
              label="기울임"
              icon={<Italic size={14} />}
              active={editor?.isActive('italic')}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            />
            <FormatBtn
              label="밑줄"
              icon={<UnderlineIcon size={14} />}
              active={editor?.isActive('underline')}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            />
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <FormatBtn
              label="글머리기호"
              icon={<List size={14} />}
              active={editor?.isActive('bulletList')}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            />
            <FormatBtn
              label="번호목록"
              icon={<ListOrdered size={14} />}
              active={editor?.isActive('orderedList')}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            />
            <FormatBtn
              label="링크"
              icon={<LinkIcon size={14} />}
              active={editor?.isActive('link')}
              onClick={() => {
                const url = window.prompt('URL을 입력하세요:')
                if (url) editor?.chain().focus().setLink({ href: url }).run()
              }}
            />
          </div>

          {/* 하단 액션 */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50 flex-none">
            <button
              onClick={handleSend}
              disabled={!to || isSending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Send size={14} />
              {isSending ? '전송 중...' : '보내기'}
            </button>
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
            >
              <FileEdit size={14} />
              임시저장
            </button>
            <button
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Paperclip size={14} />
              첨부
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function RecipientField({
  label, value, onChange, extra,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  extra?: React.ReactNode
}) {
  return (
    <div className="flex items-center px-3 py-2 border-b border-gray-100">
      <span className="text-xs text-gray-400 w-16 flex-none">{label}</span>
      <input
        type="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`${label} 이메일 주소`}
        className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
      />
      {extra}
    </div>
  )
}

function FormatBtn({
  label, icon, active, onClick,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
    </button>
  )
}
