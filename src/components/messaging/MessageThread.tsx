import { useState, useEffect, useRef } from 'react'
import type { Message, UserProfile } from '../../types'
import { NeumoCard } from '../../neumo/NeumoKit'

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
  otherUser: UserProfile
  onSendMessage: (body: string) => Promise<void>
  onClose: () => void
}

export function MessageThread({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
  onClose,
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(messageText.trim())
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <NeumoCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '70vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 14,
                borderBottom: '1px solid rgba(148,163,184,0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #14B8A6, #FB923C)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {otherUser.role === 'nurse' ? '👩‍⚕️' : '🏠'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {otherUser.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {otherUser.role === 'nurse' ? 'Travel Nurse' : 'Host'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: 12,
                    marginTop: 40,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div>No messages yet. Say hello!</div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUserId
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '8px 12px',
                          borderRadius: isOwn
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                          background: isOwn
                            ? 'linear-gradient(135deg, #14B8A6, #10B981)'
                            : 'rgba(255,255,255,0.9)',
                          color: isOwn ? 'white' : '#1f2937',
                          boxShadow: isOwn
                            ? '0 8px 18px rgba(20,184,166,0.35)'
                            : '0 8px 18px rgba(148,163,184,0.25)',
                        }}
                      >
                        <div style={{ fontSize: 12, marginBottom: 4 }}>
                          {message.body}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            opacity: 0.75,
                            textAlign: 'right',
                          }}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: 14,
                borderTop: '1px solid rgba(148,163,184,0.25)',
                display: 'flex',
                gap: 8,
              }}
            >
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 16,
                  border: '1px solid rgba(148,163,184,0.3)',
                  fontSize: 12,
                  resize: 'none',
                  minHeight: 40,
                  maxHeight: 100,
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow:
                    'inset 0 2px 4px rgba(15,23,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)',
                }}
                rows={1}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!messageText.trim() || isSending}
                style={{
                  padding: '10px 16px',
                  borderRadius: 16,
                  border: 'none',
                  background:
                    messageText.trim() && !isSending
                      ? 'linear-gradient(135deg, #14B8A6, #10B981)'
                      : 'rgba(148,163,184,0.3)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor:
                    messageText.trim() && !isSending ? 'pointer' : 'not-allowed',
                  boxShadow:
                    messageText.trim() && !isSending
                      ? '0 8px 18px rgba(20,184,166,0.35)'
                      : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </NeumoCard>
      </div>
    </div>
  )
}
