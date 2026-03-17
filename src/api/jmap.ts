// JMAP Client — Real Implementation via Core /jmap-proxy
// Core 프록시가 Bearer JWT를 Stalwart로 투명 전달

import type {
  JMAPSession,
  JMAPMethodCall,
  JMAPResponse,
  Mailbox,
  Email,
  BlobUploadResponse,
  QueryOpts,
} from './jmap.types'

// Re-export types for backward compatibility
export type { JMAPSession, Mailbox, Email, BlobUploadResponse, QueryOpts }
export type { EmailAddress, BodyPart, BodyStructure, Attachment } from './jmap.types'

// ── Constants ────────────────────────────────────────────────────────────────

const JMAP_BASE = '/jmap-proxy'

// ── Token / Auth ─────────────────────────────────────────────────────────────

/**
 * Portal은 Keycloak OIDC 세션 기반.
 * Nginx /auth/ → Keycloak 프록시를 통해 쿠키로 세션 유지.
 * React SPA는 별도 토큰 저장 없이 쿠키 기반으로 동작.
 *
 * 토큰이 localStorage/sessionStorage에 있으면 Bearer 헤더로 전달.
 * 없으면 쿠키만 전달 (Keycloak 쿠키 세션 기반).
 *
 * ※ 실제 배포 환경에서는 Keycloak JS adapter가 토큰을 주입함.
 *    키: 'kc_access_token', 'access_token', 'token' 순으로 탐색.
 */
// keycloak.ts에서 인메모리 토큰 가져오기 (localStorage 방식 제거)
import { getToken } from '../auth/keycloak'
export { getToken }

function getAuthHeaders(): HeadersInit {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ── Session ──────────────────────────────────────────────────────────────────

let _session: JMAPSession | null = null

export function getCachedSession(): JMAPSession | null {
  return _session
}

/** JMAP 세션 조회 — RFC 8620 §2 */
export async function getJMAPSession(): Promise<JMAPSession> {
  const res = await fetch(`${JMAP_BASE}/.well-known/jmap`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (res.status === 401) {
    throw new JMAPError('인증이 필요합니다. 다시 로그인해 주세요.', 401)
  }
  if (!res.ok) {
    throw new JMAPError(`JMAP 세션 조회 실패: ${res.status}`, res.status)
  }

  const session = (await res.json()) as JMAPSession
  _session = session
  return session
}

/** primaryAccountId 추출 — urn:ietf:params:jmap:mail */
export function getPrimaryAccountId(session: JMAPSession): string {
  const accountId =
    session.primaryAccounts['urn:ietf:params:jmap:mail'] ||
    session.primaryAccounts['urn:ietf:params:jmap:core'] ||
    Object.keys(session.accounts)[0]

  if (!accountId) {
    throw new JMAPError('JMAP 계정을 찾을 수 없습니다.', 0)
  }
  return accountId
}

// ── Core JMAP Request ────────────────────────────────────────────────────────

/** JMAP API 배치 요청 — RFC 8620 §3 */
export async function jmapRequest(methodCalls: JMAPMethodCall[]): Promise<JMAPResponse> {
  const session = _session
  if (!session) {
    throw new JMAPError('JMAP 세션이 없습니다. getJMAPSession()을 먼저 호출하세요.', 0)
  }

  // apiUrl이 절대 경로면 그대로, 상대 경로면 JMAP_BASE 기준
  const apiUrl = session.apiUrl.startsWith('/')
    ? session.apiUrl
    : `${JMAP_BASE}${session.apiUrl.startsWith('http') ? '' : '/jmap'}`

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls,
    }),
  })

  if (res.status === 401) {
    throw new JMAPError('인증 만료. 다시 로그인해 주세요.', 401)
  }
  if (!res.ok) {
    throw new JMAPError(`JMAP 요청 실패: ${res.status}`, res.status)
  }

  return (await res.json()) as JMAPResponse
}

// ── Mailbox ──────────────────────────────────────────────────────────────────

/** Mailbox/get — 메일함 목록 */
export async function getMailboxes(accountId: string): Promise<Mailbox[]> {
  const resp = await jmapRequest([
    [
      'Mailbox/get',
      {
        accountId,
        ids: null,
      },
      '0',
    ],
  ])

  const [, result] = resp.methodResponses[0]
  return (result.list as Mailbox[]) || []
}

// ── Email Query & Get ────────────────────────────────────────────────────────

/** Email/query — 특정 메일함의 이메일 ID 목록 */
export async function queryEmails(
  accountId: string,
  mailboxId: string,
  opts: QueryOpts = {}
): Promise<string[]> {
  const { limit = 50, position = 0, sort } = opts

  const resp = await jmapRequest([
    [
      'Email/query',
      {
        accountId,
        filter: { inMailbox: mailboxId },
        sort: sort || [{ property: 'receivedAt', isAscending: false }],
        limit,
        position,
      },
      '0',
    ],
  ])

  const [, result] = resp.methodResponses[0]
  return (result.ids as string[]) || []
}

/** Email/get — ID로 이메일 상세 조회 */
export async function getEmails(
  accountId: string,
  ids: string[],
  properties?: string[]
): Promise<Email[]> {
  if (ids.length === 0) return []

  const defaultProperties = [
    'id', 'threadId', 'mailboxIds', 'subject',
    'from', 'to', 'cc', 'bcc', 'replyTo',
    'receivedAt', 'sentAt', 'preview',
    'hasAttachment', 'keywords', 'size',
    'htmlBody', 'textBody', 'attachments', 'bodyValues',
  ]

  const resp = await jmapRequest([
    [
      'Email/get',
      {
        accountId,
        ids,
        properties: properties || defaultProperties,
        fetchHTMLBodyValues: true,
        fetchTextBodyValues: true,
        maxBodyValueBytes: 102400, // 100KB
      },
      '0',
    ],
  ])

  const [, result] = resp.methodResponses[0]
  return (result.list as Email[]) || []
}

// ── Email Set ────────────────────────────────────────────────────────────────

/** Email/set — 읽음처리, 이동, 삭제 등 */
export async function setEmails(
  accountId: string,
  updates: Record<string, Partial<Email>>
): Promise<void> {
  await jmapRequest([
    [
      'Email/set',
      {
        accountId,
        update: updates,
      },
      '0',
    ],
  ])
}

/** 이메일 읽음 표시 */
export async function markEmailRead(accountId: string, emailId: string): Promise<void> {
  await setEmails(accountId, {
    [emailId]: { keywords: { $seen: true } },
  })
}

/** 이메일 안읽음 표시 */
export async function markEmailUnread(accountId: string, emailId: string): Promise<void> {
  await setEmails(accountId, {
    [emailId]: { keywords: {} },
  })
}

/** 이메일 Trash로 이동 */
export async function moveEmailToTrash(
  accountId: string,
  emailId: string,
  currentMailboxId: string,
  trashMailboxId: string
): Promise<void> {
  await jmapRequest([
    [
      'Email/set',
      {
        accountId,
        update: {
          [emailId]: {
            [`mailboxIds/${currentMailboxId}`]: null,
            [`mailboxIds/${trashMailboxId}`]: true,
          },
        },
      },
      '0',
    ],
  ])
}

// ── Email Send ───────────────────────────────────────────────────────────────

/** 이메일 발송 — Email/set + EmailSubmission/set */
export async function sendEmail(
  accountId: string,
  draft: Partial<Email>
): Promise<{ id: string }> {
  // 1) Email 초안 생성
  const resp = await jmapRequest([
    [
      'Email/set',
      {
        accountId,
        create: {
          draft: {
            mailboxIds: draft.mailboxIds || {},
            from: draft.from,
            to: draft.to,
            cc: draft.cc,
            bcc: draft.bcc,
            subject: draft.subject || '(제목 없음)',
            htmlBody: draft.htmlBody,
            textBody: draft.textBody,
            bodyValues: draft.bodyValues,
            keywords: { $draft: true },
          },
        },
      },
      '0',
    ],
    [
      'EmailSubmission/set',
      {
        accountId,
        create: {
          sub1: {
            emailId: '#draft',
            envelope: {
              mailFrom: {
                email: draft.from?.[0]?.email || '',
              },
              rcptTo: [
                ...(draft.to || []).map((a) => ({ email: a.email })),
                ...(draft.cc || []).map((a) => ({ email: a.email })),
                ...(draft.bcc || []).map((a) => ({ email: a.email })),
              ],
            },
          },
        },
      },
      '1',
    ],
  ])

  const [, emailResult] = resp.methodResponses[0]
  const created = emailResult.created as Record<string, { id: string }> | undefined
  const id = created?.['draft']?.id || 'unknown'
  return { id }
}

// ── Blob ─────────────────────────────────────────────────────────────────────

/** Blob 업로드 — 첨부파일 */
export async function uploadBlob(accountId: string, file: File): Promise<BlobUploadResponse> {
  const session = _session
  if (!session) {
    throw new JMAPError('JMAP 세션이 없습니다.', 0)
  }

  // uploadUrl 패턴: {apiUrl}/upload/{accountId}/
  const uploadUrl = session.uploadUrl
    .replace('{accountId}', accountId)

  const finalUrl = uploadUrl.startsWith('http')
    ? uploadUrl
    : `${JMAP_BASE}${uploadUrl}`

  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': file.type || 'application/octet-stream',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(finalUrl, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: file,
  })

  if (!res.ok) {
    throw new JMAPError(`Blob 업로드 실패: ${res.status}`, res.status)
  }

  return (await res.json()) as BlobUploadResponse
}

/** Blob 다운로드 URL 생성 */
export function getBlobDownloadURL(
  accountId: string,
  blobId: string,
  name: string
): string {
  const session = _session
  if (!session) return ''

  const downloadUrl = session.downloadUrl
    .replace('{accountId}', encodeURIComponent(accountId))
    .replace('{blobId}', encodeURIComponent(blobId))
    .replace('{name}', encodeURIComponent(name))
    .replace('{type}', 'application/octet-stream')

  return downloadUrl.startsWith('http')
    ? downloadUrl
    : `${JMAP_BASE}${downloadUrl}`
}

// ── EventSource ───────────────────────────────────────────────────────────────

/**
 * JMAP EventSource 연결
 *
 * 브라우저 EventSource는 Authorization 헤더 미지원.
 * → 토큰을 URL 쿼리 파라미터로 전달 (서버 지원 필요).
 * → 토큰 없는 환경에서는 쿠키 기반 세션으로 폴백.
 *
 * 주의: 토큰을 URL에 노출하므로 HTTPS 환경에서만 사용.
 */
export function createJMAPEventSource(
  onStateChange: (state: string) => void,
  onError?: (e: Event) => void
): EventSource | null {
  const session = _session
  if (!session) return null

  const token = getToken()
  let url = `${JMAP_BASE}/jmap/eventsource/?types=*&closeAfter=no&ping=30`

  if (token) {
    url += `&token=${encodeURIComponent(token)}`
  }

  const es = new EventSource(url, { withCredentials: true })

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.type === 'state' && data.changed) {
        onStateChange(data.changed)
      }
    } catch {
      // 파싱 오류 무시
    }
  }

  if (onError) {
    es.onerror = onError
  }

  return es
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class JMAPError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'JMAPError'
    this.statusCode = statusCode
  }
}
