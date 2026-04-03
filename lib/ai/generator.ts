import type { PlannerBlock, Category, DayOfWeek } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';
import { v4 as uuidv4 } from 'uuid';

interface AIBlock {
  title: string;
  category: string;   // matches category label (case-insensitive)
  day: string;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
}

export function parseAIResponse(
  raw: string,
  categories: Category[]
): PlannerBlock[] {
  let parsed: AIBlock[];

  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Expected array');
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  const blocks: PlannerBlock[] = [];

  for (const item of parsed) {
    // Validate day
    const dayLower = (item.day || '').trim().slice(0, 3);
    const dayCapitalized = dayLower.charAt(0).toUpperCase() + dayLower.slice(1).toLowerCase();
    if (!DAY_LABELS.includes(dayCapitalized as DayOfWeek)) continue;

    // Parse times
    const startTime = timeToMinutes(item.startTime);
    const endTime = timeToMinutes(item.endTime);
    if (startTime < 0 || endTime <= startTime) continue;

    // Match category (fuzzy)
    const cat = matchCategory(item.category || '', categories);
    if (!cat) continue;

    blocks.push({
      id: uuidv4(),
      title: item.title || cat.label,
      category: cat.id,
      color: cat.color,
      day: dayCapitalized as DayOfWeek,
      startTime,
      endTime,
      createdAt: Date.now(),
    });
  }

  if (blocks.length === 0) {
    throw new Error('AI could not generate any valid blocks. Try a more specific prompt.');
  }

  return blocks;
}

function timeToMinutes(time: string): number {
  if (!time) return -1;
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
  return parts[0] * 60 + parts[1];
}

function matchCategory(label: string, categories: Category[]): Category | null {
  const lower = label.toLowerCase().trim();
  // Exact match first
  const exact = categories.find((c) => c.label.toLowerCase() === lower);
  if (exact) return exact;
  // Partial match
  const partial = categories.find(
    (c) => c.label.toLowerCase().includes(lower) || lower.includes(c.label.toLowerCase())
  );
  return partial || categories[0] || null; // fallback to first category
}
