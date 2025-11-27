import React, { useState } from 'react'
import { NeumoCard } from './neumo/NeumoKit'

type NurseLoginProps = {
  onBack: () => void
  onSuccess: (name: string) => void
}

export const NurseLogin: React.FC<NurseLoginProps> = ({
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
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
            Nurse sign in
          </h2>
          <p className="nm-body" style={{ fontSize: 12 }}>
            Save your matches, sync your preferences, and get smoother stays for
            every contract.
          </p>

          <div className="nm-field-group">
            <label className="nm-label">Preferred name</label>
            <input
              className="nm-input"
              placeholder="e.g. Taylor, Sam, Jess"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="nm-field-group">
            <label className="nm-label">Email</label>
            <input
              className="nm-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              Continue as nurse
            </button>
          </div>
        </form>
      </NeumoCard>
    </div>
  )
}
