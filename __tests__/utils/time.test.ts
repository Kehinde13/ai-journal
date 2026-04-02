import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getRelativeTime } from '../../utils/time'

describe('getRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString()
    expect(getRelativeTime(thirtySecondsAgo)).toBe('just now')
  })

  it('returns "X minutes ago" for timestamps less than 1 hour ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    expect(getRelativeTime(oneMinuteAgo)).toBe('1 minute ago')
  })

  it('returns "X hours ago" for timestamps less than 24 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(getRelativeTime(threeHoursAgo)).toBe('3 hours ago')

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    expect(getRelativeTime(oneHourAgo)).toBe('1 hour ago')
  })

  it('returns "yesterday" for timestamps exactly 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(getRelativeTime(oneDayAgo)).toBe('yesterday')
  })

  it('returns "X days ago" for timestamps 2–6 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(getRelativeTime(twoDaysAgo)).toBe('2 days ago')

    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    expect(getRelativeTime(sixDaysAgo)).toBe('6 days ago')
  })

  it('returns a formatted date for timestamps older than 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = getRelativeTime(tenDaysAgo)
    expect(result).toBe('Mar 23, 2026')
  })
})
