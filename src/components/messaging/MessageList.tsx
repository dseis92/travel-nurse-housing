import type { MessageThread as MessageThreadType, UserProfile } from '../../types'
import { NeumoCard } from '../../neumo/NeumoKit'

interface MessageListProps {
  threads: MessageThreadType[]
  currentUserId: string
  getUserById: (id: string) => UserProfile | undefined
  onSelectThread: (threadId: string) => void
  onClose: () => void
}

export function MessageList({
  threads,
  currentUserId,
  getUserById,
  onSelectThread,
  onClose,
}: MessageListProps) {
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
        }}
      >
        <NeumoCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80vh',
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
              <h2
                className="nm-heading-lg"
                style={{ fontSize: 16, margin: 0 }}
              >
                Messages
              </h2>
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

            {/* Thread list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 10,
              }}
            >
              {threads.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: 12,
                    marginTop: 40,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <div style={{ marginBottom: 6, fontWeight: 600 }}>
                    No messages yet
                  </div>
                  <div>
                    Start a conversation when you request a booking or contact a
                    host.
                  </div>
                </div>
              ) : (
                threads.map((thread) => {
                  const otherUserId = thread.participantIds.find(
                    (id) => id !== currentUserId
                  )
                  const otherUser = otherUserId
                    ? getUserById(otherUserId)
                    : undefined

                  if (!otherUser) return null

                  const hasUnread = (thread.unreadCount ?? 0) > 0
                  const lastMessage = thread.lastMessage

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => onSelectThread(thread.id)}
                      style={{
                        width: '100%',
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 18,
                        border: 'none',
                        background: 'rgba(255,255,255,0.9)',
                        boxShadow:
                          '0 10px 22px rgba(148,163,184,0.25), -3px -3px 8px rgba(255,255,255,0.9)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div
                        style={{ display: 'flex', gap: 10, alignItems: 'center' }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 999,
                            background:
                              'linear-gradient(135deg, #14B8A6, #FB923C)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          {otherUser.role === 'nurse' ? '👩‍⚕️' : '🏠'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: hasUnread ? 700 : 600,
                              }}
                            >
                              {otherUser.name}
                            </div>
                            {lastMessage && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#6b7280',
                                }}
                              >
                                {new Date(
                                  lastMessage.createdAt
                                ).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color: hasUnread ? '#1f2937' : '#6b7280',
                              fontWeight: hasUnread ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {lastMessage?.body || 'No messages yet'}
                          </div>
                        </div>

                        {hasUnread && (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              background:
                                'linear-gradient(135deg, #14B8A6, #10B981)',
                              color: 'white',
                              fontSize: 10,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {thread.unreadCount}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </NeumoCard>
      </div>
    </div>
  )
}
