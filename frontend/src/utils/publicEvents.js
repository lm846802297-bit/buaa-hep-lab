import { publicationReviewStatus } from './publicationReview'

function parseEventDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

function isPublicEventRecord(event) {
  return !!event && event.visibility === 'public' &&
    typeof event.id === 'string' && event.id.trim() !== '' &&
    typeof event.title === 'string' && event.title.trim() !== '' &&
    parseEventDate(event.start_at) !== null &&
    parseEventDate(event.end_at) !== null &&
    parseEventDate(event.end_at) > parseEventDate(event.start_at)
}

export function listPublicUpcomingEvents(events, now = new Date()) {
  const nowMs = now.getTime()
  return (Array.isArray(events) ? events : [])
    .filter(event => isPublicEventRecord(event) &&
      event.status === 'scheduled' &&
      parseEventDate(event.end_at) >= nowMs &&
      publicationReviewStatus(event.last_verified_at, now).status === 'current')
    .sort((a, b) => parseEventDate(a.start_at) - parseEventDate(b.start_at))
}

export function listPublicArchivedEvents(events, now = new Date()) {
  const nowMs = now.getTime()
  return (Array.isArray(events) ? events : [])
    .filter(event => isPublicEventRecord(event) && (
      event.status === 'completed' ||
      event.status === 'cancelled' ||
      parseEventDate(event.end_at) < nowMs
    ))
    .sort((a, b) => parseEventDate(b.start_at) - parseEventDate(a.start_at))
}

function escapeIcsText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line) {
  const encoder = new TextEncoder()
  const output = []
  let current = ''
  let octets = 0
  for (const character of line) {
    const characterOctets = encoder.encode(character).length
    if (octets + characterOctets > 75) {
      output.push(current)
      current = ` ${character}`
      octets = 1 + characterOctets
    } else {
      current += character
      octets += characterOctets
    }
  }
  output.push(current)
  return output.join('\r\n')
}

function formatIcsDate(value) {
  const date = new Date(value)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function buildPublicIcsCalendar(events, now = new Date()) {
  const items = listPublicUpcomingEvents(events, now)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BUAA HEP Hub//Public Academic Events//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BUAA HEP Hub - Public Academic Events',
  ]

  for (const event of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${encodeURIComponent(event.id)}@buaa-hep-hub.pages.dev`,
      `DTSTAMP:${formatIcsDate(now.toISOString())}`,
      `DTSTART:${formatIcsDate(event.start_at)}`,
      `DTEND:${formatIcsDate(event.end_at)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      ...(event.speaker ? [`X-SPEAKER:${escapeIcsText(event.speaker)}`] : []),
      ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
      ...(event.abstract ? [`DESCRIPTION:${escapeIcsText(event.abstract)}`] : []),
      ...(event.source_url ? [`URL:${escapeIcsText(event.source_url)}`] : []),
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}
