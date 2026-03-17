import { useEffect } from 'react'
import { MailLayout } from './MailLayout'
import { useMailStore } from '../../store/mailStore'
import { getMailboxes, getEmails, queryEmails } from '../../api/jmap'

export function MailPage() {
  const { setMailboxes, setEmails, setLoading, setError, selectedMailboxId } = useMailStore()

  // 초기 데이터 로드
  useEffect(() => {
    async function loadMailboxes() {
      setLoading(true)
      try {
        const boxes = await getMailboxes()
        setMailboxes(boxes)
      } catch (err) {
        setError('메일함을 불러오는 데 실패했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadMailboxes()
  }, [setMailboxes, setLoading, setError])

  // 메일함 선택 시 메일 목록 로드
  useEffect(() => {
    if (!selectedMailboxId) return

    async function loadEmails() {
      try {
        const ids = await queryEmails(selectedMailboxId!)
        const emails = await getEmails(ids)
        setEmails(emails)
      } catch (err) {
        console.error('이메일 로드 실패:', err)
      }
    }
    loadEmails()
  }, [selectedMailboxId, setEmails])

  return <MailLayout />
}
