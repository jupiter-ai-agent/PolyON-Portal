// JMAP Type Definitions — RFC 8620 / RFC 8621

export interface JMAPAccount {
  name: string
  isPersonal: boolean
  isReadOnly: boolean
  accountCapabilities: Record<string, unknown>
}

export interface JMAPSession {
  accounts: Record<string, JMAPAccount>
  primaryAccounts: Record<string, string>
  username: string
  apiUrl: string
  downloadUrl: string
  uploadUrl: string
  eventSourceUrl: string
  state: string
}

export type JMAPMethodCall = [string, Record<string, unknown>, string]

export interface JMAPResponse {
  sessionState: string
  methodResponses: [string, Record<string, unknown>, string][]
}

export interface Mailbox {
  id: string
  name: string
  role?: 'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | null
  totalEmails: number
  unreadEmails: number
  totalThreads: number
  unreadThreads: number
  parentId?: string | null
  sortOrder: number
}

export interface EmailAddress {
  name?: string | null
  email: string
}

export interface BodyPart {
  value: string
  isEncodingProblem?: boolean
  isTruncated?: boolean
}

export interface BodyStructure {
  partId?: string
  blobId?: string
  type: string
  name?: string
  size?: number
  charset?: string
  disposition?: string
  cid?: string
  language?: string[]
  location?: string
}

export type Attachment = BodyStructure

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
  hasAttachment: boolean
  bodyValues?: Record<string, BodyPart>
  textBody?: BodyStructure[]
  htmlBody?: BodyStructure[]
  attachments?: Attachment[]
  keywords: Record<string, boolean> // $seen, $flagged, $draft, $answered
  size: number
  blobId?: string
}

export interface BlobUploadResponse {
  accountId: string
  blobId: string
  type: string
  size: number
}

export interface QueryOpts {
  limit?: number
  position?: number
  anchor?: string
  anchorOffset?: number
  sort?: Array<{ property: string; isAscending?: boolean }>
}

// Capability identifiers
export const JMAP_CORE = 'urn:ietf:params:jmap:core'
export const JMAP_MAIL = 'urn:ietf:params:jmap:mail'
export const JMAP_SUBMISSION = 'urn:ietf:params:jmap:submission'
