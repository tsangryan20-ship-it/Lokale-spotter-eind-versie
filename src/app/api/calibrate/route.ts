import { NextResponse } from 'next/server';
import { getRecentFeedback, updateCalibration } from '@/lib/db';

// Nightly calibration — call via cron or manually from admin UI.
// Computes hit/miss ratio per category and stores weights for future few-shot prompting.
export async function POST() {
  try {
    const feedback = getRecentFeedback(500);
    if (feedback.length === 0) {
      return NextResponse.json({ message: 'Geen feedback om te kalibreren', calibrated: false });
    }

    const hits = feedback.filter(f => f.feedback_type === 'hit');
    const misses = feedback.filter(f => f.feedback_type === 'miss');
    const hitRate = hits.length / feedback.length;
    const missRate = misses.length / feedback.length;

    // Compute per-category hit rate
    const categoryHits: Record<string, number> = {};
    const categoryTotal: Record<string, number> = {};

    for (const f of feedback) {
      const cats: string[] = JSON.parse(f.categories || '[]');
      for (const cat of cats) {
        categoryTotal[cat] = (categoryTotal[cat] ?? 0) + 1;
        if (f.feedback_type === 'hit') categoryHits[cat] = (categoryHits[cat] ?? 0) + 1;
      }
    }

    const categoryWeights: Record<string, number> = {};
    for (const [cat, total] of Object.entries(categoryTotal)) {
      categoryWeights[cat] = total > 0 ? (categoryHits[cat] ?? 0) / total : 0.5;
    }

    updateCalibration({
      hit_rate: hitRate,
      miss_rate: missRate,
      category_weights: categoryWeights,
      total_feedback: feedback.length,
    });

    return NextResponse.json({
      success: true,
      hitRate: Math.round(hitRate * 100),
      missRate: Math.round(missRate * 100),
      totalFeedback: feedback.length,
      categoryWeights,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { getCalibration } = await import('@/lib/db');
    const cal = getCalibration();
    return NextResponse.json(cal);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
