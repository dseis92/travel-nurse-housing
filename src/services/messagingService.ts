import { supabase } from '../lib/supabaseClient'
import type { Message, MessageThread } from '../types'

export const messagingService = {
  /**
   * Get all message threads for a user
   */
  async getUserThreads(userId: string): Promise<MessageThread[]> {
    const { data, error } = await supabase
      .from('message_threads')
      .select(
        `
        *,
        messages:messages(*)
      `
      )
      .contains('participant_ids', [userId])
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (
      data?.map((thread: any) => ({
        id: thread.id,
        listingId: thread.listing_id,
        participantIds: thread.participant_ids,
        lastMessage: thread.messages?.[0]
          ? {
              id: thread.messages[0].id,
              threadId: thread.id,
              senderId: thread.messages[0].sender_id,
              body: thread.messages[0].body,
              createdAt: thread.messages[0].created_at,
            }
          : undefined,
        unreadCount: 0, // TODO: implement unread tracking
      })) || []
    )
  },

  /**
   * Get messages for a specific thread
   */
  async getThreadMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (
      data?.map((msg: any) => ({
        id: msg.id,
        threadId: msg.thread_id,
        senderId: msg.sender_id,
        body: msg.body,
        createdAt: msg.created_at,
        attachments: msg.attachments,
        isSystem: msg.is_system,
      })) || []
    )
  },

  /**
   * Send a message
   */
  async sendMessage(
    threadId: string,
    senderId: string,
    body: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        body,
      })
      .select()
      .single()

    if (error) throw error

    // Update thread timestamp
    await supabase
      .from('message_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    return {
      id: data.id,
      threadId: data.thread_id,
      senderId: data.sender_id,
      body: data.body,
      createdAt: data.created_at,
      attachments: data.attachments,
      isSystem: data.is_system,
    }
  },

  /**
   * Create a new message thread
   */
  async createThread(
    participantIds: string[],
    listingId?: number
  ): Promise<MessageThread> {
    const { data, error } = await supabase
      .from('message_threads')
      .insert({
        participant_ids: participantIds,
        listing_id: listingId,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      listingId: data.listing_id,
      participantIds: data.participant_ids,
    }
  },

  /**
   * Find or create a thread between two users for a specific listing
   */
  async findOrCreateThread(
    userId1: string,
    userId2: string,
    listingId?: number
  ): Promise<MessageThread> {
    // Try to find existing thread
    const { data: existing } = await supabase
      .from('message_threads')
      .select('*')
      .contains('participant_ids', [userId1])
      .contains('participant_ids', [userId2])
      .eq('listing_id', listingId || null)
      .single()

    if (existing) {
      return {
        id: existing.id,
        listingId: existing.listing_id,
        participantIds: existing.participant_ids,
      }
    }

    // Create new thread
    return await messagingService.createThread([userId1, userId2], listingId)
  },

  /**
   * Subscribe to new messages in a thread
   */
  subscribeToThread(
    threadId: string,
    onMessage: (message: Message) => void
  ) {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: any) => {
          const msg = payload.new as any
          onMessage({
            id: msg.id,
            threadId: msg.thread_id,
            senderId: msg.sender_id,
            body: msg.body,
            createdAt: msg.created_at,
            attachments: msg.attachments,
            isSystem: msg.is_system,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Subscribe to all threads for a user (for notifications)
   */
  subscribeToUserThreads(
    userId: string,
    onNewMessage: (message: Message) => void
  ) {
    const channel = supabase
      .channel(`user:${userId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          const msg = payload.new as any

          // Check if this message is in a thread the user is part of
          const { data: thread } = await supabase
            .from('message_threads')
            .select('participant_ids')
            .eq('id', msg.thread_id)
            .single()

          if (thread?.participant_ids?.includes(userId)) {
            onNewMessage({
              id: msg.id,
              threadId: msg.thread_id,
              senderId: msg.sender_id,
              body: msg.body,
              createdAt: msg.created_at,
              attachments: msg.attachments,
              isSystem: msg.is_system,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
