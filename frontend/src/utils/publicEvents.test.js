import { describe, expect, it } from 'vitest'
import { buildPublicIcsCalendar, listPublicUpcomingEvents, listPublicArchivedEvents } from './publicEvents'

const now = new Date('2026-10-21T00:00:00.000Z')
const event = (overrides = {}) => ({
  id: 'seminar-2026-11',
  title: 'Public HEP seminar, EFT; neutrinos',
  speaker: 'A. Researcher',
  start_at: '2026-11-02T10:00:00+08:00',
  end_at: '2026-11-02T11:00:00+08:00',
  timezone: 'Asia/Shanghai',
  location: 'Room 101',
  abstract: 'A public talk\nwith a second line.',
  series_id: 'theory-seminar',
  visibility: 'public',
  status: 'scheduled',
  source_url: 'https://example.org/event',
  last_verified_at: '2026-10-20',
  ...overrides,
})

describe('public event allowlist and calendar export', () => {
  it('only lists verified future public events', () => {
    expect(listPublicUpcomingEvents([event()], now)).toHaveLength(1)
    expect(listPublicUpcomingEvents([event({ visibility: 'members' })], now)).toHaveLength(0)
    expect(listPublicUpcomingEvents([event({ last_verified_at: '' })], now)).toHaveLength(0)
    expect(listPublicUpcomingEvents([event({ last_verified_at: '2026-01-01' })], now)).toHaveLength(0)
    expect(listPublicUpcomingEvents([event({ status: 'cancelled' })], now)).toHaveLength(0)
  })

  it('rejects invalid dates and non-positive event durations', () => {
    expect(listPublicUpcomingEvents([event({ start_at: 'not-a-date' })], now)).toHaveLength(0)
    expect(listPublicUpcomingEvents([event({ end_at: '2026-11-02T10:00:00+08:00' })], now)).toHaveLength(0)
  })

  it('exports RFC 5545 text with UTC times and escaped content', () => {
    const calendar = buildPublicIcsCalendar([event()], now)
    expect(calendar).toContain('BEGIN:VCALENDAR\r\n')
    expect(calendar).toContain('DTSTART:20261102T020000Z')
    expect(calendar).toContain('DTEND:20261102T030000Z')
    expect(calendar).toContain('SUMMARY:Public HEP seminar\\, EFT\\; neutrinos')
    expect(calendar).toContain('DESCRIPTION:A public talk\\nwith a second line.')
    expect(calendar).toContain('LOCATION:Room 101')
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('never exports private, cancelled, past or stale events', () => {
    const events = [
      event({ visibility: 'members', id: 'private' }),
      event({ status: 'cancelled', id: 'cancelled' }),
      event({ end_at: '2026-10-20T11:00:00+08:00', start_at: '2026-10-20T10:00:00+08:00', id: 'past' }),
      event({ last_verified_at: '2026-01-01', id: 'stale' }),
    ]
    const calendar = buildPublicIcsCalendar(events, now)
    expect(calendar).not.toContain('private')
    expect(calendar).not.toContain('cancelled')
    expect(calendar).not.toContain('past')
    expect(calendar).not.toContain('stale')
  })

  it('archives public completed or elapsed events without exposing member-only records', () => {
    const archive = listPublicArchivedEvents([
      event({ status: 'completed', id: 'past-public', start_at: '2026-10-10T10:00:00+08:00', end_at: '2026-10-10T11:00:00+08:00' }),
      event({ id: 'member-private', visibility: 'members', status: 'completed', start_at: '2026-10-10T10:00:00+08:00', end_at: '2026-10-10T11:00:00+08:00' }),
    ], now)
    expect(archive.map(item => item.id)).toEqual(['past-public'])
  })
})
