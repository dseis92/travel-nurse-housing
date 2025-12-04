import { useState } from 'react'
import { NeumoCard } from '../../neumo/NeumoKit'

interface CalendarDatePickerProps {
  selectedStartDate?: Date | null
  selectedEndDate?: Date | null
  onDateRangeChange: (startDate: Date, endDate: Date | null) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  blockedDateRanges?: Array<{ start: Date; end: Date }>
}

export function CalendarDatePicker({
  selectedStartDate,
  selectedEndDate,
  onDateRangeChange,
  minDate,
  maxDate,
  disabledDates = [],
  blockedDateRanges = [],
}: CalendarDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const isDateDisabled = (date: Date): boolean => {
    // Check if before minDate
    if (minDate && date < minDate) return true

    // Check if after maxDate
    if (maxDate && date > maxDate) return true

    // Check if in disabledDates array
    if (disabledDates.some(d => isSameDay(d, date))) return true

    // Check if in blocked date ranges
    if (blockedDateRanges.some(range => date >= range.start && date <= range.end)) {
      return true
    }

    return false
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const isDateSelected = (date: Date): boolean => {
    if (selectedStartDate && isSameDay(date, selectedStartDate)) return true
    if (selectedEndDate && isSameDay(date, selectedEndDate)) return true
    return false
  }

  const isDateInRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false
    return date > selectedStartDate && date < selectedEndDate
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      onDateRangeChange(date, null)
    } else {
      // Complete range selection
      if (date > selectedStartDate) {
        onDateRangeChange(selectedStartDate, date)
      } else {
        onDateRangeChange(date, selectedStartDate)
      }
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <NeumoCard>
      <div style={{ padding: 16 }}>
        {/* Month Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button
            className="nm-pill"
            style={{ fontSize: 11, padding: '6px 12px' }}
            onClick={goToPreviousMonth}
          >
            ←
          </button>
          <h3 className="nm-heading-lg" style={{ fontSize: 14 }}>
            {monthNames[month]} {year}
          </h3>
          <button
            className="nm-pill"
            style={{ fontSize: 11, padding: '6px 12px' }}
            onClick={goToNextMonth}
          >
            →
          </button>
        </div>

        {/* Day Names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
          {dayNames.map(day => (
            <div
              key={day}
              className="nm-body"
              style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color: '#6b7280' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />
            }

            const date = new Date(year, month, day)
            const disabled = isDateDisabled(date)
            const selected = isDateSelected(date)
            const inRange = isDateInRange(date)
            const isToday = isSameDay(date, new Date())

            return (
              <button
                key={day}
                onClick={() => handleDateClick(date)}
                disabled={disabled}
                style={{
                  padding: '8px',
                  borderRadius: 12,
                  border: 'none',
                  background: selected
                    ? 'linear-gradient(135deg, #14B8A6, #10B981)'
                    : inRange
                    ? 'rgba(20,184,166,0.15)'
                    : disabled
                    ? 'rgba(148,163,184,0.1)'
                    : 'rgba(255,255,255,0.9)',
                  color: selected ? 'white' : disabled ? '#cbd5e1' : '#1f2937',
                  fontSize: 11,
                  fontWeight: isToday ? 700 : selected || inRange ? 600 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  boxShadow: selected
                    ? '0 4px 12px rgba(20,184,166,0.35)'
                    : !disabled
                    ? '0 2px 6px rgba(148,163,184,0.15)'
                    : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {day}
                {isToday && !selected && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#14B8A6',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #14B8A6, #10B981)',
              }}
            />
            <span className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
              Selected
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'rgba(148,163,184,0.3)',
              }}
            />
            <span className="nm-body" style={{ fontSize: 10, color: '#6b7280' }}>
              Unavailable
            </span>
          </div>
        </div>
      </div>
    </NeumoCard>
  )
}
