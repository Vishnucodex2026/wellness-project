export type Gender = 'male' | 'female' | 'prefer_not_to_say';

export interface PersonalInfo {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  age: string;
}

export interface BodyDetails {
  weight: string; // kg
  height: string; // cm
  gender: Gender | '';
}

export interface AssessmentAnswers {
  // Health
  healthRating: number | null; // 1-10
  healthReason: string;
  // Energy
  energyLevel: string; // very_low, low, okay, good, excellent
  tiredOften: string; // yes, sometimes, no
  // Nutrition
  eatingHabits: string; // need_improvement, could_be_better, good, very_good, excellent
  mealsPerDay: string; // 1,2,3,4,5+
  fruitsVeg: string; // rarely, sometimes, daily, almost_every_meal
  processedFood: string; // rarely, sometimes, often, very_often
  // Hydration
  waterIntake: string; // less_1, 1_2, 2_3, more_3, not_sure
  // Activity
  activityLevel: string; // mostly_inactive, lightly, moderately, very
  activeDays: string; // 0, 1_2, 3_4, 5_6, every_day
  // Sleep
  sleepHours: string; // less_5, 5_6, 6_7, 7_8, more_8
  wakeFeeling: string; // still_tired, okay, refreshed, full_energy
  // Stress
  stressLevel: number | null; // 1-10
  overwhelmed: string; // rarely, sometimes, often, very_often
  // Goal
  mainGoal: string;
  goalAchieve: string;
  // Stopping
  stoppingYou: string;
  // Readiness
  readiness: number | null; // 1-10
}

export interface CategoryScore {
  key: string;
  label: string;
  emoji: string;
  score: number; // 0-100
  rating: ScoreRating;
}

export type ScoreRating = 'strong' | 'good' | 'needs_attention' | 'priority';

export interface WellnessReport {
  overall: number; // 0-100
  categories: CategoryScore[];
  strengths: CategoryScore[];
  attentionAreas: CategoryScore[];
  biggestOpportunity: CategoryScore;
  whyItMatters: { emoji: string; text: string }[];
  nextSteps: string[];
}

export const emptyAnswers: AssessmentAnswers = {
  healthRating: null,
  healthReason: '',
  energyLevel: '',
  tiredOften: '',
  eatingHabits: '',
  mealsPerDay: '',
  fruitsVeg: '',
  processedFood: '',
  waterIntake: '',
  activityLevel: '',
  activeDays: '',
  sleepHours: '',
  wakeFeeling: '',
  stressLevel: null,
  overwhelmed: '',
  mainGoal: '',
  goalAchieve: '',
  stoppingYou: '',
  readiness: null,
};

export const emptyPersonal: PersonalInfo = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  age: '',
};

export const emptyBody: BodyDetails = {
  weight: '',
  height: '',
  gender: '',
};
