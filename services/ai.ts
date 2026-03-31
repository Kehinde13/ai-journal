export type AnalyseResult = {
  mood?: string;
  moodScore?: number;
  insights?: string;
};

export type WeeklySummaryResult = {
  summary?: string;
  dominantMood?: string;
  insights?: string[];
};

export async function weeklySummary(
  entries: { content: string; created_at: string }[],
  accessToken: string
): Promise<WeeklySummaryResult> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/weekly-summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ entries }),
    }
  );
  return response.json();
}

export async function analyseEntry(content: string, accessToken: string): Promise<AnalyseResult> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analyse-entry`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
    }
  );
  return response.json();
}
