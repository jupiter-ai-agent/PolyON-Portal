import { create } from 'zustand'
import type { Mailbox, Email } from '../api/jmap'

interface MailState {
  // Data
  mailboxes: Mailbox[]
  emails: Email[]
  selectedMailboxId: string | null
  selectedEmailId: string | null
  isComposeOpen: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setMailboxes: (mailboxes: Mailbox[]) => void
  setEmails: (emails: Email[]) => void
  selectMailbox: (id: string) => void
  selectEmail: (id: string | null) => void
  openCompose: () => void
  closeCompose: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  markRead: (emailId: string) => void
  markUnread: (emailId: string) => void
  deleteEmail: (emailId: string) => void
  archiveEmail: (emailId: string) => void
  toggleStar: (emailId: string) => void
}

export const useMailStore = create<MailState>((set, get) => ({
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

  selectEmail: (id) => {
    if (id) {
      // 이메일 선택 시 자동으로 읽음 처리
      get().markRead(id)
    }
    set({ selectedEmailId: id })
  },

  openCompose: () => set({ isComposeOpen: true }),
  closeCompose: () => set({ isComposeOpen: false }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  markRead: (emailId) => set((state) => ({
    emails: state.emails.map(e =>
      e.id === emailId
        ? { ...e, keywords: { ...e.keywords, '$seen': true } }
        : e
    ),
    mailboxes: state.mailboxes.map(mb => {
      const email = state.emails.find(e => e.id === emailId)
      if (email && email.mailboxIds[mb.id] && !(email.keywords?.['$seen'])) {
        return { ...mb, unreadEmails: Math.max(0, mb.unreadEmails - 1) }
      }
      return mb
    }),
  })),

  markUnread: (emailId) => set((state) => ({
    emails: state.emails.map(e => {
      if (e.id === emailId) {
        const keywords = { ...e.keywords }
        delete keywords['$seen']
        return { ...e, keywords }
      }
      return e
    }),
  })),

  deleteEmail: (emailId) => set((state) => ({
    emails: state.emails.filter(e => e.id !== emailId),
    selectedEmailId: state.selectedEmailId === emailId ? null : state.selectedEmailId,
  })),

  archiveEmail: (emailId) => set((state) => ({
    emails: state.emails.filter(e => e.id !== emailId),
    selectedEmailId: state.selectedEmailId === emailId ? null : state.selectedEmailId,
  })),

  toggleStar: (emailId) => set((state) => ({
    emails: state.emails.map(e =>
      e.id === emailId
        ? {
            ...e,
            keywords: e.keywords?.['$flagged']
              ? { ...e.keywords, '$flagged': false }
              : { ...e.keywords, '$flagged': true },
          }
        : e
    ),
  })),
}))
