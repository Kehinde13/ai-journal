import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyseEntry, weeklySummary } from '../../services/ai'

const BACKEND_URL = 'https://test-backend.example.com'

beforeEach(() => {
  vi.unstubAllGlobals()
  process.env.EXPO_PUBLIC_BACKEND_URL = BACKEND_URL
})

describe('analyseEntry', () => {
  it('calls the correct backend URL with Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ mood: 'happy', moodScore: 8, insights: 'You seem positive.' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await analyseEntry('Today was a great day!', 'test-token')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BACKEND_URL}/api/analyse-entry`)
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe('Bearer test-token')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ content: 'Today was a great day!' })
  })

  it('returns the parsed JSON response', async () => {
    const mockResult = { mood: 'calm', moodScore: 6, insights: 'Reflective day.' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResult),
    }))

    const result = await analyseEntry('Feeling calm.', 'test-token')
    expect(result).toEqual(mockResult)
  })
})

describe('weeklySummary', () => {
  it('calls the correct backend URL with entries array', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ summary: 'A good week.', dominantMood: 'happy', insights: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const entries = [
      { content: 'Day one.', created_at: '2026-03-26T10:00:00.000Z' },
      { content: 'Day two.', created_at: '2026-03-27T10:00:00.000Z' },
    ]

    await weeklySummary(entries, 'test-token')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BACKEND_URL}/api/weekly-summary`)
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe('Bearer test-token')
    expect(JSON.parse(options.body)).toEqual({ entries })
  })

  it('returns the parsed JSON response', async () => {
    const mockResult = {
      summary: 'Mostly positive week.',
      dominantMood: 'content',
      insights: ['You journaled consistently.'],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResult),
    }))

    const result = await weeklySummary([], 'test-token')
    expect(result).toEqual(mockResult)
  })
})
