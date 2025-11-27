import React, { useState } from 'react'
import { NeumoCard } from './neumo/NeumoKit'

type HostLoginProps = {
  onBack: () => void
  onSuccess: (hostName: string) => void
}

export const HostLogin: React.FC<HostLoginProps> = ({
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !accessCode.trim()) {
      return
    }
    onSuccess(name.trim())
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <NeumoCard>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <h2 className="nm-heading-lg" style={{ fontSize: 20 }}>
            Host login
          </h2>
          <p className="nm-body" style={{ fontSize: 12 }}>
            Manage your listings, respond to nurse requests, and keep everything
            in one place.
          </p>

          <div className="nm-field-group">
            <label className="nm-label">Host name</label>
            <input
              className="nm-input"
              placeholder="e.g. Morgan, Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="nm-field-group">
            <label className="nm-label">Email</label>
            <input
              className="nm-input"
              type="email"
              placeholder="host@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="nm-field-group">
            <label className="nm-label">Host access code</label>
            <input
              className="nm-input"
              placeholder="Enter host code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <button
              type="button"
              className="nm-pill"
              style={{ fontSize: 12 }}
              onClick={onBack}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="nm-pill nm-pill--active"
              style={{ fontSize: 13 }}
            >
              Continue as host
            </button>
          </div>
        </form>
      </NeumoCard>
    </div>
  )
}
