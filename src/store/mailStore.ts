import { create } from 'zustand'
import type { Mailbox, Email } from '../api/jmap'
import type { JMAPSession } from '../api/jmap.types'
import {
  getJMAPSession,
  getPrimaryAccountId,
  getMailboxes as fetchMailboxes,
  queryEmails as fetchQueryEmails,
  getEmails as fetchGetEmails,
  setEmails as apiSetEmails,
  moveEmailToTrash as apiMoveToTrash,
  sendEmail as apiSendEmail,
  JMAPError,
} from '../api/jmap'

interface MailState {
  // Session
  session: JMAPSession | null
  accountId: string | null

  // Data
  mailboxes: Mailbox[]
  emails: Email[]
  selectedMailboxId: string | null
  selectedEmailId: string | null
  isComposeOpen: boolean
  isLoading: boolean
  error: string | null

  // Internal setters
  setMailboxes: (mailboxes: Mailbox[]) => void
  setEmails: (emails: Email[]) => void
  selectMailbox: (id: string) => void
  selectEmail: (id: string | null) => void
  openCompose: () => void
  closeCompose: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // JMAP async actions
  loadSession: () => Promise<void>
  loadMailboxes: () => Promise<void>
  loadEmails: (mailboxId: string) => Promise<void>
  markRead: (emailId: string) => Promise<void>
  markUnread: (emailId: string) => Promise<void>
  deleteEmail: (emailId: string) => Promise<void>
  archiveEmail: (emailId: string) => Promise<void>
  toggleStar: (emailId: string) => Promise<void>
  sendMail: (draft: Partial<Email>) => Promise<{ id: string }>
}

export const useMailStore = create<MailState>((set, get) => ({
  session: null,
  accountId: null,
  mailboxes: [],
  emails: [],
  selectedMailboxId: 'inbox',
  selectedEmailId: null,
  isComposeOpen: false,
  isLoading: false,
  error: null,

  setMailboxes: (mailboxes) => set({ mailboxes }),
  setEmails: (emails) => set({ emails }),

  selectMailbox: (id) => set({ selectedMailboxId: id, selectedEmailId: null }),

  selectEmail: async (id) => {
    set({ selectedEmailId: id })
    if (id) {
      // 읽음 처리 (비동기, 실패해도 UI는 유지)
      await get().markRead(id)
    }
  },

  openCompose: () => set({ isComposeOpen: true }),
  closeCompose: () => set({ isComposeOpen: false }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // ── JMAP Session ───────────────────────────────────────────────────────────

  loadSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const session = await getJMAPSession()
      const accountId = getPrimaryAccountId(session)
      set({ session, accountId })
    } catch (err) {
      const msg = err instanceof JMAPError
        ? err.message
        : 'JMAP 서버에 연결할 수 없습니다.'
      set({ error: msg })
      console.error('[mailStore] loadSession:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Mailboxes ──────────────────────────────────────────────────────────────

  loadMailboxes: async () => {
    const { accountId } = get()
    if (!accountId) return

    set({ isLoading: true })
    try {
      const mailboxes = await fetchMailboxes(accountId)
      // sortOrder 기준 정렬
      mailboxes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      set({ mailboxes })
    } catch (err) {
      console.error('[mailStore] loadMailboxes:', err)
      set({ error: '메일함을 불러오는 데 실패했습니다.' })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Emails ─────────────────────────────────────────────────────────────────

  loadEmails: async (mailboxId: string) => {
    const { accountId } = get()
    if (!accountId) return

    set({ isLoading: true })
    try {
      const ids = await fetchQueryEmails(accountId, mailboxId, { limit: 50 })
      if (ids.length === 0) {
        set({ emails: [] })
        return
      }
      const emails = await fetchGetEmails(accountId, ids)
      set({ emails })
    } catch (err) {
      console.error('[mailStore] loadEmails:', err)
      set({ error: '이메일을 불러오는 데 실패했습니다.' })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Mark Read/Unread ───────────────────────────────────────────────────────

  markRead: async (emailId: string) => {
    const { accountId, emails } = get()

    // Optimistic update
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === emailId
          ? { ...e, keywords: { ...e.keywords, $seen: true } }
          : e
      ),
      mailboxes: state.mailboxes.map((mb) => {
        const email = state.emails.find((e) => e.id === emailId)
        if (email && email.mailboxIds[mb.id] && !email.keywords?.['$seen']) {
          return { ...mb, unreadEmails: Math.max(0, mb.unreadEmails - 1) }
        }
        return mb
      }),
    }))

    // Server sync (silent — don't block UI)
    if (!accountId) return
    const email = emails.find((e) => e.id === emailId)
    if (!email || email.keywords?.['$seen']) return

    try {
      await apiSetEmails(accountId, {
        [emailId]: { keywords: { ...email.keywords, $seen: true } },
      })
    } catch (err) {
      console.warn('[mailStore] markRead server sync failed:', err)
    }
  },

  markUnread: async (emailId: string) => {
    const { accountId, emails } = get()

    // Optimistic update
    set((state) => ({
      emails: state.emails.map((e) => {
        if (e.id === emailId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { $seen: _removed, ...rest } = e.keywords || {}
          return { ...e, keywords: rest as Record<string, boolean> }
        }
        return e
      }),
    }))

    if (!accountId) return
    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { $seen: _removed, ...keywords } = email.keywords || {}
      await apiSetEmails(accountId, {
        [emailId]: { keywords: keywords as Record<string, boolean> },
      })
    } catch (err) {
      console.warn('[mailStore] markUnread server sync failed:', err)
    }
  },

  // ── Delete (Trash) ─────────────────────────────────────────────────────────

  deleteEmail: async (emailId: string) => {
    const { accountId, emails, mailboxes, selectedEmailId } = get()

    // Optimistic: UI에서 제거
    set({
      emails: emails.filter((e) => e.id !== emailId),
      selectedEmailId: selectedEmailId === emailId ? null : selectedEmailId,
    })

    if (!accountId) return

    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    // Trash 메일함 ID 찾기
    const trashBox = mailboxes.find((mb) => mb.role === 'trash')
    if (!trashBox) {
      // Trash 없으면 완전 삭제
      try {
        await apiSetEmails(accountId, { [emailId]: null as unknown as Partial<Email> })
      } catch (err) {
        console.warn('[mailStore] deleteEmail (destroy) failed:', err)
      }
      return
    }

    const currentMailboxId = Object.keys(email.mailboxIds)[0]
    try {
      await apiMoveToTrash(accountId, emailId, currentMailboxId, trashBox.id)
    } catch (err) {
      console.warn('[mailStore] deleteEmail (trash) failed:', err)
    }
  },

  // ── Archive ────────────────────────────────────────────────────────────────

  archiveEmail: async (emailId: string) => {
    const { accountId, emails, mailboxes, selectedEmailId } = get()

    set({
      emails: emails.filter((e) => e.id !== emailId),
      selectedEmailId: selectedEmailId === emailId ? null : selectedEmailId,
    })

    if (!accountId) return

    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    const archiveBox = mailboxes.find((mb) => mb.role === 'archive')
    if (!archiveBox) return

    const currentMailboxId = Object.keys(email.mailboxIds)[0]
    try {
      // 아카이브로 이동 — moveEmailToTrash과 동일 패턴
      await apiMoveToTrash(accountId, emailId, currentMailboxId, archiveBox.id)
    } catch (err) {
      console.warn('[mailStore] archiveEmail failed:', err)
    }
  },

  // ── Toggle Star ────────────────────────────────────────────────────────────

  toggleStar: async (emailId: string) => {
    const { accountId, emails } = get()
    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    const isFlagged = !!email.keywords?.['$flagged']
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { $flagged: _removed, ...rest } = email.keywords || {}
    const newKeywords: Record<string, boolean> = isFlagged
      ? rest
      : { ...rest, $flagged: true }

    // Optimistic update
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === emailId ? { ...e, keywords: newKeywords } : e
      ),
    }))

    if (!accountId) return

    try {
      await apiSetEmails(accountId, { [emailId]: { keywords: newKeywords } })
    } catch (err) {
      console.warn('[mailStore] toggleStar failed:', err)
    }
  },

  // ── Send ───────────────────────────────────────────────────────────────────

  sendMail: async (draft: Partial<Email>) => {
    const { accountId } = get()
    if (!accountId) throw new Error('JMAP 계정이 없습니다.')

    return await apiSendEmail(accountId, draft)
  },
}))
