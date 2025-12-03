import { useState, useMemo } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'
import type { DayAvailability } from '../../services/availabilityService'

interface CalendarPickerProps {
  availability: DayAvailability[]
  selectedStartDate?: string
  selectedEndDate?: string
  onDateSelect: (startDate: string, endDate?: string) => void
  minStayNights?: number
  mode?: 'range' | 'single'
}

export function CalendarPicker({
  availability,
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
  minStayNights = 1,
  mode = 'range',
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: Array<{
      date: string
      dayOfMonth: number
      isCurrentMonth: boolean
      availability?: DayAvailability
    }> = []

    // Add padding days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1)
      days.push({
        date: prevDate.toISOString().split('T')[0],
        dayOfMonth: prevDate.getDate(),
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const dayAvailability = availability.find((a) => a.date === dateStr)

      days.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        availability: dayAvailability,
      })
    }

    return days
  }, [currentMonth, availability])

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const handleDayClick = (day: typeof calendarDays[0]) => {
    if (!day.isCurrentMonth || !day.availability) return

    const dayDate = new Date(day.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dayDate < today) return
    if (day.availability.status !== 'available') return

    if (mode === 'single') {
      onDateSelect(day.date)
      return
    }

    // Range mode
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      onDateSelect(day.date)
    } else {
      // Complete selection
      const start = new Date(selectedStartDate)
      const end = new Date(day.date)

      if (end < start) {
        // Clicked before start date, make it the new start
        onDateSelect(day.date)
      } else {
        // Valid range
        const nights = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (nights < minStayNights) {
          // Too short
          return
        }

        onDateSelect(selectedStartDate, day.date)
      }
    }
  }

  const isDayInRange = (date: string): boolean => {
    if (!selectedStartDate) return false

    const dayDate = new Date(date)
    const start = new Date(selectedStartDate)

    if (selectedEndDate) {
      const end = new Date(selectedEndDate)
      return dayDate >= start && dayDate <= end
    }

    if (hoveredDate && mode === 'range') {
      const hover = new Date(hoveredDate)
      if (hover >= start) {
        return dayDate >= start && dayDate <= hover
      }
    }

    return dayDate.toISOString().split('T')[0] === selectedStartDate
  }

  const getDayStatus = (day: typeof calendarDays[0]): string => {
    if (!day.isCurrentMonth) return 'disabled'
    if (!day.availability) return 'unavailable'

    const dayDate = new Date(day.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dayDate < today) return 'past'
    if (day.availability.status === 'booked') return 'booked'
    if (day.availability.status === 'blocked') return 'blocked'

    return 'available'
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <NeumoCard>
      <div style={{ padding: 12 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            className="nm-pill"
            style={{ fontSize: 11, padding: '6px 12px' }}
            onClick={goToPreviousMonth}
          >
            ←
          </button>

          <h3 className="nm-heading-lg" style={{ fontSize: 14, margin: 0 }}>
            {monthYear}
          </h3>

          <button
            type="button"
            className="nm-pill"
            style={{ fontSize: 11, padding: '6px 12px' }}
            onClick={goToNextMonth}
          >
            →
          </button>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8,
          }}
        >
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div
              key={day}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#6b7280',
                textAlign: 'center',
                paddingBlock: 4,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
          }}
        >
          {calendarDays.map((day, index) => {
            const status = getDayStatus(day)
            const inRange = isDayInRange(day.date)
            const isStart =
              day.date === selectedStartDate && day.isCurrentMonth
            const isEnd = day.date === selectedEndDate && day.isCurrentMonth

            let backgroundColor = 'transparent'
            let color = '#1f2937'
            let cursor = 'default'
            let border = '1px solid transparent'

            if (status === 'available') {
              backgroundColor = 'rgba(255,255,255,0.9)'
              cursor = 'pointer'
            } else if (status === 'booked') {
              backgroundColor = 'rgba(239,68,68,0.1)'
              color = '#ef4444'
            } else if (status === 'blocked') {
              backgroundColor = 'rgba(107,114,128,0.1)'
              color = '#6b7280'
            } else if (status === 'past' || status === 'disabled') {
              color = '#d1d5db'
            }

            if (inRange && status === 'available') {
              backgroundColor = 'rgba(20,184,166,0.15)'
            }

            if (isStart || isEnd) {
              backgroundColor = 'linear-gradient(135deg, #14B8A6, #10B981)'
              color = 'white'
              border = 'none'
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() =>
                  day.isCurrentMonth &&
                  status === 'available' &&
                  setHoveredDate(day.date)
                }
                onMouseLeave={() => setHoveredDate(null)}
                disabled={status !== 'available'}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: inRange || isStart || isEnd ? 600 : 400,
                  borderRadius: 12,
                  border,
                  background: backgroundColor,
                  color,
                  cursor,
                  transition: 'all 0.15s ease',
                  boxShadow:
                    status === 'available'
                      ? '0 2px 4px rgba(148,163,184,0.15)'
                      : 'none',
                }}
              >
                {day.dayOfMonth}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(148,163,184,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 2px 4px rgba(148,163,184,0.15)',
              }}
            />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Available</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'rgba(239,68,68,0.1)',
              }}
            />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Booked</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'rgba(107,114,128,0.1)',
              }}
            />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Blocked</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #14B8A6, #10B981)',
              }}
            />
            <span style={{ fontSize: 10, color: '#6b7280' }}>Selected</span>
          </div>
        </div>

        {minStayNights > 1 && (
          <p
            className="nm-body"
            style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Minimum stay: {minStayNights} nights
          </p>
        )}
      </div>
    </NeumoCard>
  )
}
