import { useState, useEffect } from 'react'
import { messagingService } from '../../services/messagingService'
import { MessageList } from './MessageList'
import { MessageThread } from './MessageThread'
import type { MessageThread as MessageThreadType, Message, UserProfile } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface MessagingContainerProps {
  onClose: () => void
}

export function MessagingContainer({ onClose }: MessagingContainerProps) {
  const { profile } = useAuthStore()
  const [threads, setThreads] = useState<MessageThreadType[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])

  // Mock user lookup - in a real app, you'd fetch this from your backend
  const getUserById = (id: string): UserProfile | undefined => {
    // This would typically come from a user service or cache
    // For now, we'll create a mock user
    return {
      id,
      role: 'nurse', // Default, would come from actual data
      name: 'User ' + id.slice(0, 6),
      email: id + '@example.com',
    }
  }

  useEffect(() => {
    if (!profile?.id) return

    const loadThreads = async () => {
      try {
        const userThreads = await messagingService.getUserThreads(profile.id)
        setThreads(userThreads)
      } catch (error) {
        console.error('Error loading threads:', error)
        toast.error('Failed to load messages')
      }
    }

    loadThreads()

    // Subscribe to new messages for notifications
    const unsubscribe = messagingService.subscribeToUserThreads(
      profile.id,
      () => {
        // Reload threads when a new message arrives
        loadThreads()
      }
    )

    return () => {
      unsubscribe()
    }
  }, [profile?.id])

  const handleSelectThread = async (threadId: string) => {
    if (!profile?.id) return

    try {
      setSelectedThreadId(threadId)
      const messages = await messagingService.getThreadMessages(threadId)
      setThreadMessages(messages)
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async (body: string) => {
    if (!profile?.id || !selectedThreadId) return

    try {
      await messagingService.sendMessage(selectedThreadId, profile.id, body)
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }

  const handleCloseThread = () => {
    setSelectedThreadId(null)
    setThreadMessages([])
  }

  useEffect(() => {
    if (!selectedThreadId || !profile?.id) return

    // Subscribe to real-time messages for the selected thread
    const unsubscribe = messagingService.subscribeToThread(
      selectedThreadId,
      (message) => {
        setThreadMessages((prev) => [...prev, message])
      }
    )

    return () => {
      unsubscribe()
    }
  }, [selectedThreadId, profile?.id])

  if (!profile) {
    return null
  }

  if (selectedThreadId) {
    const thread = threads.find((t) => t.id === selectedThreadId)
    const otherUserId = thread?.participantIds.find((id) => id !== profile.id)
    const otherUser = otherUserId ? getUserById(otherUserId) : undefined

    if (!otherUser) {
      return null
    }

    return (
      <MessageThread
        messages={threadMessages}
        currentUserId={profile.id}
        otherUser={otherUser}
        onSendMessage={handleSendMessage}
        onClose={handleCloseThread}
      />
    )
  }

  return (
    <MessageList
      threads={threads}
      currentUserId={profile.id}
      getUserById={getUserById}
      onSelectThread={handleSelectThread}
      onClose={onClose}
    />
  )
}
