import type {
  AssessmentAnswers,
  BodyDetails,
  CategoryScore,
  ScoreRating,
  WellnessReport,
} from './types';

function ratingFromScore(score: number): ScoreRating {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs_attention';
  return 'priority';
}

function scale(value: number, max: number): number {
  return Math.round((value / max) * 100);
}

// Health Awareness: self-rated health (1-10) + reason length bonus
function scoreHealth(a: AssessmentAnswers): number {
  if (a.healthRating == null) return 0;
  let s = scale(a.healthRating, 10);
  if (a.healthReason.trim().length > 0) s = Math.min(100, s + 5);
  return s;
}

// Energy: energyLevel + tiredOften
function scoreEnergy(a: AssessmentAnswers): number {
  const map: Record<string, number> = {
    very_low: 0,
    low: 25,
    okay: 55,
    good: 80,
    excellent: 100,
  };
  let s = map[a.energyLevel] ?? 0;
  const tired: Record<string, number> = { yes: -20, sometimes: -5, no: 10 };
  s += tired[a.tiredOften] ?? 0;
  return clamp(s);
}

// Nutrition: eatingHabits + meals + fruitsVeg - processedFood
function scoreNutrition(a: AssessmentAnswers): number {
  const habits: Record<string, number> = {
    need_improvement: 0,
    could_be_better: 35,
    good: 65,
    very_good: 85,
    excellent: 100,
  };
  const meals: Record<string, number> = {
    '1': 20, '2': 50, '3': 85, '4': 75, '5+': 60,
  };
  const fv: Record<string, number> = {
    rarely: 0, sometimes: 40, daily: 80, almost_every_meal: 100,
  };
  const pf: Record<string, number> = {
    rarely: 100, sometimes: 70, often: 30, very_often: 0,
  };
  const s =
    (habits[a.eatingHabits] ?? 0) * 0.4 +
    (meals[a.mealsPerDay] ?? 0) * 0.2 +
    (fv[a.fruitsVeg] ?? 0) * 0.25 +
    (pf[a.processedFood] ?? 0) * 0.15;
  return clamp(Math.round(s));
}

// Hydration
function scoreHydration(a: AssessmentAnswers): number {
  const map: Record<string, number> = {
    less_1: 0, '1_2': 55, '2_3': 90, more_3: 100, not_sure: 40,
  };
  return map[a.waterIntake] ?? 0;
}

// Activity: activityLevel + activeDays
function scoreActivity(a: AssessmentAnswers): number {
  const level: Record<string, number> = {
    mostly_inactive: 0, lightly: 45, moderately: 75, very: 100,
  };
  const days: Record<string, number> = {
    '0': 0, '1_2': 35, '3_4': 70, '5_6': 90, every_day: 100,
  };
  const s = (level[a.activityLevel] ?? 0) * 0.5 + (days[a.activeDays] ?? 0) * 0.5;
  return clamp(Math.round(s));
}

// Sleep: hours + wake feeling
function scoreSleep(a: AssessmentAnswers): number {
  const hours: Record<string, number> = {
    less_5: 10, '5_6': 45, '6_7': 75, '7_8': 100, more_8: 80,
  };
  const wake: Record<string, number> = {
    still_tired: 10, okay: 55, refreshed: 90, full_energy: 100,
  };
  const s = (hours[a.sleepHours] ?? 0) * 0.5 + (wake[a.wakeFeeling] ?? 0) * 0.5;
  return clamp(Math.round(s));
}

// Lifestyle / Stress: inverse stress + overwhelmed
function scoreLifestyle(a: AssessmentAnswers): number {
  if (a.stressLevel == null) return 0;
  const stress = scale(11 - a.stressLevel, 10); // lower stress = higher score
  const over: Record<string, number> = {
    rarely: 100, sometimes: 65, often: 30, very_often: 0,
  };
  const s = stress * 0.6 + (over[a.overwhelmed] ?? 0) * 0.4;
  return clamp(Math.round(s));
}

// Readiness
function scoreReadiness(a: AssessmentAnswers): number {
  if (a.readiness == null) return 0;
  return scale(a.readiness, 10);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function computeBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(bmi: number | null): string {
  if (bmi == null) return '—';
  if (bmi < 18.5) return 'Underweight range';
  if (bmi < 25) return 'Healthy range';
  if (bmi < 30) return 'Overweight range';
  return 'Obesity range';
}

export function buildReport(a: AssessmentAnswers, _b: BodyDetails): WellnessReport {
  const defs = [
    { key: 'health', label: 'Health Awareness', emoji: '❤️', fn: scoreHealth },
    { key: 'energy', label: 'Energy', emoji: '⚡', fn: scoreEnergy },
    { key: 'nutrition', label: 'Nutrition', emoji: '🥗', fn: scoreNutrition },
    { key: 'hydration', label: 'Hydration', emoji: '💧', fn: scoreHydration },
    { key: 'activity', label: 'Activity', emoji: '🏃', fn: scoreActivity },
    { key: 'sleep', label: 'Sleep', emoji: '😴', fn: scoreSleep },
    { key: 'lifestyle', label: 'Lifestyle', emoji: '🧠', fn: scoreLifestyle },
  ];

  const categories: CategoryScore[] = defs.map((d) => {
    const score = d.fn(a);
    return { key: d.key, label: d.label, emoji: d.emoji, score, rating: ratingFromScore(score) };
  });

  // Overall: average of 7 lifestyle categories + readiness weighted 15%
  const lifestyleAvg =
    categories.reduce((s, c) => s + c.score, 0) / categories.length;
  const readiness = scoreReadiness(a);
  const overall = clamp(Math.round(lifestyleAvg * 0.85 + readiness * 0.15));

  const sorted = [...categories].sort((x, y) => y.score - x.score);
  const strengths = sorted.slice(0, 3).filter((c) => c.score >= 55);
  const attentionAreas = [...sorted].reverse().slice(0, 3);

  const biggestOpportunity =
    [...categories].sort((x, y) => x.score - y.score)[0];

  const whyItMatters = buildWhyItMatters(categories);
  const nextSteps = buildNextSteps(attentionAreas);

  return {
    overall,
    categories,
    strengths: strengths.length ? strengths : sorted.slice(0, 2),
    attentionAreas,
    biggestOpportunity,
    whyItMatters,
    nextSteps,
  };
}

function buildWhyItMatters(cats: CategoryScore[]): { emoji: string; text: string }[] {
  const out: { emoji: string; text: string }[] = [];
  const byKey = Object.fromEntries(cats.map((c) => [c.key, c]));

  if (byKey.activity.score < 50) {
    out.push({
      emoji: '🏃',
      text: 'Low physical activity maintained over time may negatively affect fitness and overall health and is associated with higher risk of several chronic conditions.',
    });
  }
  if (byKey.sleep.score < 50) {
    out.push({
      emoji: '😴',
      text: 'Consistently poor sleep can affect energy, mood and daily functioning and may contribute to longer-term health risks.',
    });
  }
  if (byKey.nutrition.score < 50) {
    out.push({
      emoji: '🥗',
      text: 'A consistently poor-quality diet can make it harder to meet nutritional needs and may contribute to long-term health risks.',
    });
  }
  if (byKey.hydration.score < 50) {
    out.push({
      emoji: '💧',
      text: 'Persistent low hydration can affect concentration, energy and how your body functions day to day.',
    });
  }
  if (byKey.lifestyle.score < 50) {
    out.push({
      emoji: '🧠',
      text: 'Ongoing high stress, when unmanaged, can affect mood, sleep and overall wellbeing over time.',
    });
  }
  if (byKey.energy.score < 50) {
    out.push({
      emoji: '⚡',
      text: 'Continually low energy often signals that one or more lifestyle habits may need attention.',
    });
  }

  if (out.length === 0) {
    out.push({
      emoji: '🌱',
      text: 'Over time, consistently poor diet, low physical activity, inadequate sleep and other unhealthy patterns can contribute to poorer overall wellbeing and may increase the risk of certain chronic health conditions.',
    });
  }
  return out;
}

function buildNextSteps(attention: CategoryScore[]): string[] {
  const steps: string[] = [];
  const keys = attention.map((a) => a.key);

  if (keys.includes('nutrition'))
    steps.push('Try to make your meals more balanced and consistent.');
  if (keys.includes('activity'))
    steps.push('Build regular physical activity into your week, even short walks.');
  if (keys.includes('sleep'))
    steps.push('Create a consistent sleep routine with a regular bedtime.');
  if (keys.includes('hydration'))
    steps.push('Keep a water bottle nearby and sip throughout the day.');
  if (keys.includes('lifestyle'))
    steps.push('Take a few minutes daily to pause, breathe and reset.');
  if (keys.includes('energy'))
    steps.push('Notice what drains your energy and adjust one habit at a time.');

  while (steps.length < 3) {
    steps.push('Pick one small change and practice it consistently for a week.');
  }
  return steps.slice(0, 3);
}

export function ratingLabel(r: ScoreRating): string {
  switch (r) {
    case 'strong': return 'Strong';
    case 'good': return 'Good';
    case 'needs_attention': return 'Needs Attention';
    case 'priority': return 'Priority Area';
  }
}
