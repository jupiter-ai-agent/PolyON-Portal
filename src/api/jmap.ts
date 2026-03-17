// JMAP Client — stub implementation
// 실제 JMAP 서버 연결 전 mock 데이터로 UI 동작 확인

export interface JMAPSession {
  apiUrl: string
  accessToken: string
  accountId: string
}

export interface Mailbox {
  id: string
  name: string
  role: string | null
  totalEmails: number
  unreadEmails: number
  totalThreads: number
  unreadThreads: number
  sortOrder: number
}

export interface EmailAddress {
  name: string | null
  email: string
}

export interface EmailBodyPart {
  partId?: string
  blobId?: string
  type: string
  name?: string
  size?: number
}

export interface Email {
  id: string
  threadId: string
  mailboxIds: Record<string, boolean>
  subject: string
  from: EmailAddress[]
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  replyTo?: EmailAddress[]
  receivedAt: string
  sentAt?: string
  preview: string
  bodyValues?: Record<string, { value: string; isEncodingProblem?: boolean; isTruncated?: boolean }>
  textBody?: EmailBodyPart[]
  htmlBody?: EmailBodyPart[]
  attachments?: EmailBodyPart[]
  keywords?: Record<string, boolean>
  size: number
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MAILBOXES: Mailbox[] = [
  { id: 'inbox', name: 'Inbox', role: 'inbox', totalEmails: 142, unreadEmails: 5, totalThreads: 98, unreadThreads: 4, sortOrder: 1 },
  { id: 'starred', name: 'Starred', role: null, totalEmails: 12, unreadEmails: 0, totalThreads: 10, unreadThreads: 0, sortOrder: 2 },
  { id: 'sent', name: 'Sent', role: 'sent', totalEmails: 487, unreadEmails: 0, totalThreads: 320, unreadThreads: 0, sortOrder: 3 },
  { id: 'drafts', name: 'Drafts', role: 'drafts', totalEmails: 3, unreadEmails: 3, totalThreads: 3, unreadThreads: 3, sortOrder: 4 },
  { id: 'spam', name: 'Spam', role: 'junk', totalEmails: 8, unreadEmails: 2, totalThreads: 7, unreadThreads: 2, sortOrder: 5 },
  { id: 'trash', name: 'Trash', role: 'trash', totalEmails: 24, unreadEmails: 0, totalThreads: 18, unreadThreads: 0, sortOrder: 6 },
]

const MOCK_EMAILS: Email[] = [
  {
    id: 'e1',
    threadId: 't1',
    mailboxIds: { inbox: true },
    subject: '[PolyON] 서버 점검 안내 - 3월 20일 02:00~04:00',
    from: [{ name: 'PolyON 관리팀', email: 'admin@polyon.io' }],
    to: [{ name: null, email: 'cmars@triangles.co.kr' }],
    receivedAt: '2026-03-17T10:30:00Z',
    preview: '안녕하세요. PolyON 관리팀입니다. 오는 3월 20일 새벽 02:00부터 04:00까지 서버 정기 점검이 있을 예정입니다.',
    keywords: {},
    size: 4096,
    htmlBody: [{ type: 'text/html', partId: 'body' }],
    bodyValues: {
      body: {
        value: `<p>안녕하세요. <strong>PolyON 관리팀</strong>입니다.</p>
<p>오는 <strong>3월 20일(목) 새벽 02:00 ~ 04:00</strong> 서버 정기 점검이 예정되어 있습니다.</p>
<p>점검 시간 동안 모든 서비스 이용이 불가하오니 양해 부탁드립니다.</p>
<br/>
<p>감사합니다.</p>`,
      },
    },
  },
  {
    id: 'e2',
    threadId: 't2',
    mailboxIds: { inbox: true },
    subject: 'Re: Q1 프로젝트 일정 조율 건',
    from: [{ name: '김철수', email: 'kim.cs@triangles.co.kr' }],
    to: [{ name: 'CMARS', email: 'cmars@triangles.co.kr' }],
    receivedAt: '2026-03-17T09:15:00Z',
    preview: '대표님, 말씀하신 3월 25일 일정으로 조율해 드리겠습니다. 회의실은 2층 대회의실로 예약해 두겠습니다.',
    keywords: { '$seen': true },
    size: 2048,
    htmlBody: [{ type: 'text/html', partId: 'body' }],
    bodyValues: {
      body: {
        value: `<p>대표님, 안녕하세요. 김철수입니다.</p>
<p>말씀하신 <strong>3월 25일(수) 14:00</strong> 일정으로 조율해 드리겠습니다.</p>
<p>회의실은 2층 대회의실로 예약해 두겠습니다.</p>
<p>추가로 필요한 사항이 있으시면 말씀해 주세요.</p>`,
      },
    },
  },
  {
    id: 'e3',
    threadId: 't3',
    mailboxIds: { inbox: true },
    subject: 'Triangle.s — 3월 급여명세서',
    from: [{ name: '인사팀', email: 'hr@triangles.co.kr' }],
    to: [{ name: 'CMARS', email: 'cmars@triangles.co.kr' }],
    receivedAt: '2026-03-15T08:00:00Z',
    preview: '3월분 급여명세서를 발송해 드립니다. 첨부 파일을 확인해 주세요.',
    keywords: { '$seen': true },
    size: 8192,
    htmlBody: [{ type: 'text/html', partId: 'body' }],
    bodyValues: {
      body: {
        value: `<p>안녕하세요.</p>
<p>2026년 3월분 급여명세서를 첨부하여 드립니다.</p>
<p>확인 후 이상이 있으시면 인사팀으로 연락 주시기 바랍니다.</p>`,
      },
    },
    attachments: [
      { type: 'application/pdf', name: '2026_03_급여명세서.pdf', size: 102400 },
    ],
  },
  {
    id: 'e4',
    threadId: 't4',
    mailboxIds: { inbox: true },
    subject: 'GitLab — New merge request: feat/webmail-skeleton',
    from: [{ name: 'GitLab', email: 'noreply@gitlab.triangles.co.kr' }],
    to: [{ name: 'CMARS', email: 'cmars@triangles.co.kr' }],
    receivedAt: '2026-03-17T07:44:00Z',
    preview: 'Jupiter opened a new merge request: feat/webmail-skeleton → main in PolyON-Portal',
    keywords: {},
    size: 3072,
    htmlBody: [{ type: 'text/html', partId: 'body' }],
    bodyValues: {
      body: {
        value: `<p>Jupiter opened a new merge request:</p>
<h3><a href="#">feat/webmail-skeleton</a> → main</h3>
<p><strong>PolyON-Portal</strong></p>
<hr/>
<p>웹메일 골격 구현 — Tailwind + Radix UI + TipTap + JMAP stub (Phase 1)</p>`,
      },
    },
  },
  {
    id: 'e5',
    threadId: 't5',
    mailboxIds: { inbox: true },
    subject: '안녕하세요, 협업 제안드립니다',
    from: [{ name: '이영희', email: 'lee.yh@partner.co.kr' }],
    to: [{ name: 'CMARS', email: 'cmars@triangles.co.kr' }],
    receivedAt: '2026-03-14T14:22:00Z',
    preview: '안녕하세요. Triangle.s의 서비스에 관심이 많아 협업 제안을 드리고자 연락드립니다.',
    keywords: { '$seen': true },
    size: 2560,
    htmlBody: [{ type: 'text/html', partId: 'body' }],
    bodyValues: {
      body: {
        value: `<p>안녕하세요. Triangle.s 대표님.</p>
<p>저는 파트너 코퍼레이션의 이영희 이사입니다.</p>
<p>귀사의 PolyON 플랫폼에 깊은 관심을 갖고 있으며, 협업 가능성을 논의하고 싶어 연락드립니다.</p>
<p>시간이 괜찮으신다면 미팅을 요청드려도 될까요?</p>`,
      },
    },
  },
]

// ── JMAP API Stubs ──────────────────────────────────────────────────────────

let _session: JMAPSession | null = null

export function setSession(session: JMAPSession) {
  _session = session
}

export function getSession(): JMAPSession | null {
  return _session
}

// Mailbox/get
export async function getMailboxes(): Promise<Mailbox[]> {
  // TODO: 실제 JMAP 호출
  // POST {apiUrl}
  // ["Mailbox/get", { "accountId": accountId, "ids": null }, "0"]
  await delay(100)
  return MOCK_MAILBOXES
}

// Email/query — 특정 mailboxId의 이메일 ID 목록
export async function queryEmails(mailboxId: string, _limit = 50, _position = 0): Promise<string[]> {
  // TODO: 실제 JMAP 호출
  // ["Email/query", { "accountId": accountId, "filter": { "inMailbox": mailboxId }, "sort": [{ "property": "receivedAt", "isAscending": false }], "limit": limit, "position": position }, "0"]
  await delay(150)
  return MOCK_EMAILS
    .filter(e => e.mailboxIds[mailboxId])
    .map(e => e.id)
}

// Email/get — ID로 이메일 상세 조회
export async function getEmails(ids: string[]): Promise<Email[]> {
  // TODO: 실제 JMAP 호출
  // ["Email/get", { "accountId": accountId, "ids": ids, "properties": [...] }, "0"]
  await delay(100)
  return MOCK_EMAILS.filter(e => ids.includes(e.id))
}

// EmailSubmission/set — 이메일 발송
export async function sendEmail(draft: Partial<Email>): Promise<{ id: string }> {
  // TODO: 실제 JMAP 호출
  // ["Email/set", { "accountId": accountId, "create": { "draft": draftObj } }, "0"]
  // ["EmailSubmission/set", { "accountId": accountId, "create": { "sub": { "emailId": "#draft", "envelope": {...} } } }, "1"]
  await delay(300)
  console.log('[JMAP stub] sendEmail:', draft)
  return { id: 'new-' + Date.now() }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
