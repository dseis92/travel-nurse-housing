import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabaseClient'
import type { ListingRow } from './types'

type BookingModalProps = {
  listing: ListingRow
  onClose: () => void
}

export function BookingModal({ listing, onClose }: BookingModalProps) {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || success) return

    setLoading(true)
    setError(null)

    if (!guestEmail || !startDate || !endDate) {
      setError('Email and dates are required.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('bookings').insert([
      {
        listing_id: listing.id,
        guest_name: guestName || null,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        start_date: startDate,
        end_date: endDate,
        // note is currently just for host context; not stored in DB yet
      },
    ])

    if (error) {
      console.error(error)
      setError('Could not submit request. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
      <div className="max-w-lg w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-xl shadow-slate-950/70 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-400">
              Request to book
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              {listing.title}
            </h2>
            <p className="text-[11px] text-slate-400">
              {listing.city}, {listing.state} • {listing.hospital_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-700/70 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-3">
              <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-700/70 rounded-xl px-3 py-2">
                Booking request sent. The host will reach out to you by email or
                phone to confirm details.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 text-slate-100 hover:border-sky-500 hover:text-sky-300 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Jane Doe, RN"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Email (for host to reply)
                  </label>
                  <input
                    required
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Contract start
                  </label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Contract end
                  </label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">
                    Anything the host should know?
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Shift type, pets, parking needs, ideal move-in date, etc."
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-medium shadow-sm shadow-sky-900/40 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Sending…' : 'Send booking request'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
