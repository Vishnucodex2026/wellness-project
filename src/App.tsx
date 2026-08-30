import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck, Clock, BarChart3, Lock, MessageCircle, ChevronLeft, Phone, CalendarPlus, CheckCircle2 } from 'lucide-react';
import { NavButtons, ProgressBar } from '@/components/NavButtons';
import { StepCard, TextField } from '@/components/StepCard';
import { OptionGroup } from '@/components/OptionGroup';
import { RatingScale } from '@/components/RatingScale';
import {
  emptyAnswers,
  emptyBody,
  emptyPersonal,
  type AssessmentAnswers,
  type BodyDetails,
  type PersonalInfo,
} from '@/types';
import { buildReport, computeBMI, bmiLabel, ratingLabel } from '@/scoring';
import { WHATSAPP_NUMBER, PRIVACY_NOTICE } from '@/config';
import { saveLead, saveContactRequest, getPublicBusinessSettings } from '@/lib/supabase';
import { LANGUAGES, getTranslation, type LanguageCode } from '@/i18n';

type Phase = 'landing' | 'intro' | 'personal' | 'body' | 'health' | 'energy' | 'nutrition' | 'hydration' | 'activity' | 'sleep' | 'stress' | 'goal' | 'stopping' | 'readiness' | 'report' | 'ready' | 'guidance' | 'callback' | 'appointment';

const ASSESSMENT_STEPS: Phase[] = [
  'personal', 'body', 'health', 'energy', 'nutrition', 'hydration', 'activity', 'sleep', 'stress', 'goal', 'stopping', 'readiness',
];
const TOTAL_STEPS = ASSESSMENT_STEPS.length + 1;

const STORAGE_KEY = 'bhw_state_v2';
const LANG_KEY = 'bhw_lang';

function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [personal, setPersonal] = useState<PersonalInfo>(emptyPersonal);
  const [body, setBody] = useState<BodyDetails>(emptyBody);
  const [answers, setAnswers] = useState<AssessmentAnswers>(emptyAnswers);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leadSaved, setLeadSaved] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(WHATSAPP_NUMBER);
  const topRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => getTranslation(lang), [lang]);

  useEffect(() => {
    getPublicBusinessSettings().then((settings) => {
      if (settings?.whatsapp_number) setWhatsappNumber(settings.whatsapp_number.replace(/\D/g, ''));
    });
    const savedLang = localStorage.getItem(LANG_KEY) as LanguageCode | null;
    if (savedLang) setLang(savedLang);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.phase) setPhase(s.phase);
        if (s.personal) setPersonal(s.personal);
        if (s.body) setBody(s.body);
        if (s.answers) setAnswers(s.answers);
        if (s.privacyAgreed) setPrivacyAgreed(s.privacyAgreed);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase, personal, body, answers, privacyAgreed }));
  }, [phase, personal, body, answers, privacyAgreed]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [phase]);

  const report = useMemo(() => buildReport(answers, body), [answers, body]);
  const bmi = computeBMI(parseFloat(body.weight) || 0, parseFloat(body.height) || 0);

  const currentStepIndex = ASSESSMENT_STEPS.indexOf(phase);
  const stepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : TOTAL_STEPS;

  function setAnswer<K extends keyof AssessmentAnswers>(key: K, value: AssessmentAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext(p: Phase) {
    setErrors({});
    setPhase(p);
  }

  function validatePersonal(): boolean {
    const e: Record<string, string> = {};
    if (!personal.fullName.trim()) e.fullName = t.fullName;
    if (!personal.phone.trim()) e.phone = t.phone;
    else if (personal.phone.replace(/\D/g, '').length < 7) e.phone = t.phone;
    if (!personal.age.trim()) e.age = t.age;
    else if (parseInt(personal.age) < 5 || parseInt(personal.age) > 120) e.age = t.age;
    if (personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) e.email = t.email;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateBody(): boolean {
    const e: Record<string, string> = {};
    if (!body.weight.trim()) e.weight = t.weight;
    else if (parseFloat(body.weight) <= 0 || parseFloat(body.weight) > 500) e.weight = t.weight;
    if (!body.height.trim()) e.height = t.height;
    else if (parseFloat(body.height) <= 0 || parseFloat(body.height) > 300) e.height = t.height;
    if (!body.gender) e.gender = t.gender;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    switch (phase) {
      case 'health':
        if (answers.healthRating == null) e.healthRating = t.healthQuestion;
        break;
      case 'energy':
        if (!answers.energyLevel) e.energyLevel = t.energyQuestion;
        if (!answers.tiredOften) e.tiredOften = t.tiredQuestion;
        break;
      case 'nutrition':
        if (!answers.eatingHabits) e.eatingHabits = t.eatingQuestion;
        if (!answers.mealsPerDay) e.mealsPerDay = t.mealsQuestion;
        if (!answers.fruitsVeg) e.fruitsVeg = t.fruitsQuestion;
        if (!answers.processedFood) e.processedFood = t.processedQuestion;
        break;
      case 'hydration':
        if (!answers.waterIntake) e.waterIntake = t.waterQuestion;
        break;
      case 'activity':
        if (!answers.activityLevel) e.activityLevel = t.activityQuestion;
        if (!answers.activeDays) e.activeDays = t.activeDaysQuestion;
        break;
      case 'sleep':
        if (!answers.sleepHours) e.sleepHours = t.sleepQuestion;
        if (!answers.wakeFeeling) e.wakeFeeling = t.wakeQuestion;
        break;
      case 'stress':
        if (answers.stressLevel == null) e.stressLevel = t.stressQuestion;
        if (!answers.overwhelmed) e.overwhelmed = t.overwhelmedQuestion;
        break;
      case 'goal':
        if (!answers.mainGoal) e.mainGoal = t.goalQuestion;
        break;
      case 'stopping':
        if (!answers.stoppingYou) e.stoppingYou = t.stoppingQuestion;
        break;
      case 'readiness':
        if (answers.readiness == null) e.readiness = t.readinessQuestion;
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (phase === 'personal') {
      if (!validatePersonal()) return;
      goNext('body');
      return;
    }
    if (phase === 'body') {
      if (!validateBody()) return;
      goNext('health');
      return;
    }
    if (!validateStep()) return;
    const idx = ASSESSMENT_STEPS.indexOf(phase);
    if (idx >= 0 && idx < ASSESSMENT_STEPS.length - 1) {
      goNext(ASSESSMENT_STEPS[idx + 1]);
    } else if (phase === 'readiness') {
      if (!leadSaved) {
        saveLead({
          full_name: personal.fullName,
          phone: personal.phone,
          email: personal.email,
          city: personal.city,
          age: personal.age,
          weight: body.weight,
          height: body.height,
          gender: body.gender,
          answers: answers as unknown as Record<string, unknown>,
          overall_score: report.overall,
          category_scores: Object.fromEntries(report.categories.map((c) => [c.key, c.score])),
          readiness: answers.readiness ?? 0,
          main_goal: answers.mainGoal,
          language: lang,
        }).then(() => setLeadSaved(true));
      }
      goNext('report');
    }
  }

  function handleBack() {
    if (phase === 'ready' || phase === 'guidance' || phase === 'callback' || phase === 'appointment') { setPhase('report'); return; }
    if (phase === 'report') { setPhase('readiness'); return; }
    const idx = ASSESSMENT_STEPS.indexOf(phase);
    if (idx > 0) setPhase(ASSESSMENT_STEPS[idx - 1]);
    else if (phase === 'personal') setPhase('intro');
    else if (phase === 'body') setPhase('personal');
    else if (phase === 'intro') setPhase('landing');
  }

  function buildWhatsAppLink(extra?: string): string {
    const firstName = personal.fullName.trim().split(' ')[0] || '';
    let msg = `Hi, I completed the Be Honest With Yourself wellness assessment${firstName ? `, ${firstName} here` : ''} and would like to discuss my results.`;
    if (extra) msg += ` ${extra}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  const showProgress = ASSESSMENT_STEPS.includes(phase);
  const showNav = phase !== 'landing' && phase !== 'intro' && phase !== 'report' && phase !== 'ready' && phase !== 'guidance' && phase !== 'callback' && phase !== 'appointment';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-slate-50 to-slate-50">
      <div ref={topRef} />
      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
        {showProgress && <ProgressBar current={stepNumber} total={TOTAL_STEPS} />}

        {phase === 'landing' && <Landing onStart={() => setPhase('intro')} lang={lang} setLang={(l) => { setLang(l); localStorage.setItem(LANG_KEY, l); }} t={t} />}

        {phase === 'intro' && (
          <div className="animate-fade-in text-center">
            <div className="mb-6 text-6xl" aria-hidden="true">🤔</div>
            <h1 className="mb-3 text-3xl font-bold text-slate-800">{t.readyHeading}</h1>
            <p className="mb-8 text-lg text-slate-600">{t.readyText}</p>
            <button
              type="button"
              onClick={() => setPhase('personal')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            >
              {t.letsGo} <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="mt-6 text-sm text-slate-400">{t.noRightWrong}</p>
          </div>
        )}

        {phase === 'personal' && (
          <StepCard emoji="👋" heading={t.personalHeading} stepId="personal">
            <div className="space-y-4">
              <TextField id="fullName" label={t.fullName} value={personal.fullName} onChange={(v) => setPersonal({ ...personal, fullName: v })} required error={errors.fullName} placeholder={t.fullName} />
              <TextField id="phone" label={t.phone} value={personal.phone} onChange={(v) => setPersonal({ ...personal, phone: v })} required type="tel" inputMode="tel" error={errors.phone} placeholder="+1 555 000 0000" />
              <TextField id="email" label={t.emailOptional} value={personal.email} onChange={(v) => setPersonal({ ...personal, email: v })} type="email" inputMode="email" error={errors.email} placeholder="you@example.com" />
              <TextField id="city" label={t.city} value={personal.city} onChange={(v) => setPersonal({ ...personal, city: v })} placeholder={t.city} />
              <TextField id="age" label={t.age} value={personal.age} onChange={(v) => setPersonal({ ...personal, age: v })} required type="number" inputMode="numeric" error={errors.age} placeholder={t.age} />
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 flex-shrink-0 rounded border-slate-300 text-emerald-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                />
                <span className="text-sm text-slate-600">{PRIVACY_NOTICE} <strong>{t.iUnderstand}</strong></span>
              </label>
            </div>
            {showNav && <NavButtons onBack={handleBack} onNext={privacyAgreed ? handleNext : undefined} nextDisabled={!privacyAgreed} nextLabel={t.next} />}
            {!privacyAgreed && (
              <div className="mt-6 flex justify-end">
                <button type="button" disabled className="flex items-center gap-2 rounded-full bg-slate-200 px-7 py-3.5 text-sm font-bold text-slate-400">
                  {t.next} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </StepCard>
        )}

        {phase === 'body' && (
          <StepCard emoji="📏" heading={t.bodyHeading} stepId="body">
            <div className="space-y-4">
              <TextField id="weight" label={t.weight} value={body.weight} onChange={(v) => setBody({ ...body, weight: v })} required type="number" inputMode="decimal" error={errors.weight} placeholder="e.g. 70" />
              <TextField id="height" label={t.height} value={body.height} onChange={(v) => setBody({ ...body, height: v })} required type="number" inputMode="decimal" error={errors.height} placeholder="e.g. 170" />
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">{t.gender}</span>
                <OptionGroup name="gender" label={t.gender} value={body.gender} onChange={(v) => setBody({ ...body, gender: v as BodyDetails['gender'] })}
                  options={[
                    { value: 'male', label: t.male },
                    { value: 'female', label: t.female },
                    { value: 'prefer_not_to_say', label: t.preferNotSay },
                  ]} />
                {errors.gender && <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">{errors.gender}</p>}
              </div>
            </div>
            {bmi != null && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-center">
                <p className="text-sm font-medium text-slate-500">{t.bmiLabel}</p>
                <p className="text-3xl font-bold text-emerald-600">{bmi}</p>
                <p className="text-sm text-slate-500">{bmiLabel(bmi)}</p>
              </div>
            )}
            <p className="mt-4 text-center text-xs text-slate-400">{t.bmiDisclaimer}</p>
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'health' && (
          <StepCard emoji="❤️" heading={t.healthHeading} stepId="health">
            <p className="mb-4 text-center text-slate-600">{t.healthQuestion}</p>
            <RatingScale value={answers.healthRating} onChange={(v) => setAnswer('healthRating', v)} label={t.healthQuestion} name="healthRating" minLabel={t.needsAttention} maxLabel={t.excellent} />
            {errors.healthRating && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.healthRating}</p>}
            <div className="mt-6">
              <label htmlFor="healthReason" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.healthReasonOptional}</label>
              <textarea id="healthReason" value={answers.healthReason} onChange={(e) => setAnswer('healthReason', e.target.value)} rows={3}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 transition-colors focus:border-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                placeholder="..." />
            </div>
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'energy' && (
          <StepCard emoji="⚡" heading={t.energyHeading} stepId="energy">
            <p className="mb-4 text-center text-slate-600">{t.energyQuestion}</p>
            <OptionGroup name="energyLevel" label={t.energyQuestion} value={answers.energyLevel} onChange={(v) => setAnswer('energyLevel', v)}
              options={[
                { value: 'very_low', label: t.veryLow, emoji: '😴' },
                { value: 'low', label: t.low, emoji: '😕' },
                { value: 'okay', label: t.okay, emoji: '🙂' },
                { value: 'good', label: t.good, emoji: '😊' },
                { value: 'excellent', label: t.excellent, emoji: '🔥' },
              ]} />
            {errors.energyLevel && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.energyLevel}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.tiredQuestion}</p>
            <OptionGroup name="tiredOften" label={t.tiredQuestion} value={answers.tiredOften} onChange={(v) => setAnswer('tiredOften', v)}
              options={[
                { value: 'yes', label: t.yes },
                { value: 'sometimes', label: t.sometimes },
                { value: 'no', label: t.no },
              ]} />
            {errors.tiredOften && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.tiredOften}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'nutrition' && (
          <StepCard emoji="🥗" heading={t.nutritionHeading} stepId="nutrition">
            <p className="mb-4 text-center text-slate-600">{t.eatingQuestion}</p>
            <OptionGroup name="eatingHabits" label={t.eatingQuestion} value={answers.eatingHabits} onChange={(v) => setAnswer('eatingHabits', v)}
              options={[
                { value: 'need_improvement', label: t.needImprovement },
                { value: 'could_be_better', label: t.couldBeBetter },
                { value: 'good', label: t.good },
                { value: 'very_good', label: t.veryGood },
                { value: 'excellent', label: t.excellent },
              ]} />
            {errors.eatingHabits && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.eatingHabits}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.mealsQuestion}</p>
            <OptionGroup name="mealsPerDay" label={t.mealsQuestion} value={answers.mealsPerDay} onChange={(v) => setAnswer('mealsPerDay', v)} columns={2}
              options={[
                { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5+', label: '5+' },
              ]} />
            {errors.mealsPerDay && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.mealsPerDay}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.fruitsQuestion}</p>
            <OptionGroup name="fruitsVeg" label={t.fruitsQuestion} value={answers.fruitsVeg} onChange={(v) => setAnswer('fruitsVeg', v)}
              options={[
                { value: 'rarely', label: t.rarely }, { value: 'sometimes', label: t.sometimes }, { value: 'daily', label: t.daily }, { value: 'almost_every_meal', label: t.almostEveryMeal },
              ]} />
            {errors.fruitsVeg && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.fruitsVeg}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.processedQuestion}</p>
            <OptionGroup name="processedFood" label={t.processedQuestion} value={answers.processedFood} onChange={(v) => setAnswer('processedFood', v)}
              options={[
                { value: 'rarely', label: t.rarely }, { value: 'sometimes', label: t.sometimes }, { value: 'often', label: t.often }, { value: 'very_often', label: t.veryOften },
              ]} />
            {errors.processedFood && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.processedFood}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'hydration' && (
          <StepCard emoji="💧" heading={t.hydrationHeading} stepId="hydration">
            <p className="mb-4 text-center text-slate-600">{t.waterQuestion}</p>
            <OptionGroup name="waterIntake" label={t.waterQuestion} value={answers.waterIntake} onChange={(v) => setAnswer('waterIntake', v)}
              options={[
                { value: 'less_1', label: t.lessThan1L },
                { value: '1_2', label: t.oneTo2L },
                { value: '2_3', label: t.twoTo3L },
                { value: 'more_3', label: t.moreThan3L },
                { value: 'not_sure', label: t.notSure },
              ]} />
            {errors.waterIntake && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.waterIntake}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'activity' && (
          <StepCard emoji="🏃" heading={t.activityHeading} stepId="activity">
            <p className="mb-4 text-center text-slate-600">{t.activityQuestion}</p>
            <OptionGroup name="activityLevel" label={t.activityQuestion} value={answers.activityLevel} onChange={(v) => setAnswer('activityLevel', v)}
              options={[
                { value: 'mostly_inactive', label: t.mostlyInactive },
                { value: 'lightly', label: t.lightlyActive },
                { value: 'moderately', label: t.moderatelyActive },
                { value: 'very', label: t.veryActive },
              ]} />
            {errors.activityLevel && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.activityLevel}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.activeDaysQuestion}</p>
            <OptionGroup name="activeDays" label={t.activeDaysQuestion} value={answers.activeDays} onChange={(v) => setAnswer('activeDays', v)}
              options={[
                { value: '0', label: '0' }, { value: '1_2', label: '1–2' }, { value: '3_4', label: '3–4' }, { value: '5_6', label: '5–6' }, { value: 'every_day', label: t.everyDay },
              ]} />
            {errors.activeDays && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.activeDays}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'sleep' && (
          <StepCard emoji="😴" heading={t.sleepHeading} stepId="sleep">
            <p className="mb-4 text-center text-slate-600">{t.sleepQuestion}</p>
            <OptionGroup name="sleepHours" label={t.sleepQuestion} value={answers.sleepHours} onChange={(v) => setAnswer('sleepHours', v)}
              options={[
                { value: 'less_5', label: t.lessThan5 },
                { value: '5_6', label: t.fiveTo6 },
                { value: '6_7', label: t.sixTo7 },
                { value: '7_8', label: t.sevenTo8 },
                { value: 'more_8', label: t.moreThan8 },
              ]} />
            {errors.sleepHours && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.sleepHours}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.wakeQuestion}</p>
            <OptionGroup name="wakeFeeling" label={t.wakeQuestion} value={answers.wakeFeeling} onChange={(v) => setAnswer('wakeFeeling', v)}
              options={[
                { value: 'still_tired', label: t.stillTired, emoji: '😴' },
                { value: 'okay', label: t.okay, emoji: '😐' },
                { value: 'refreshed', label: t.refreshed, emoji: '🙂' },
                { value: 'full_energy', label: t.fullEnergy, emoji: '🔥' },
              ]} />
            {errors.wakeFeeling && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.wakeFeeling}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'stress' && (
          <StepCard emoji="🧠" heading={t.stressHeading} stepId="stress">
            <p className="mb-4 text-center text-slate-600">{t.stressQuestion}</p>
            <RatingScale value={answers.stressLevel} onChange={(v) => setAnswer('stressLevel', v)} label={t.stressQuestion} name="stressLevel" minLabel={t.lowStress} maxLabel={t.highStress} />
            {errors.stressLevel && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.stressLevel}</p>}
            <p className="mb-4 mt-6 text-center text-slate-600">{t.overwhelmedQuestion}</p>
            <OptionGroup name="overwhelmed" label={t.overwhelmedQuestion} value={answers.overwhelmed} onChange={(v) => setAnswer('overwhelmed', v)}
              options={[
                { value: 'rarely', label: t.rarely }, { value: 'sometimes', label: t.sometimes }, { value: 'often', label: t.often }, { value: 'very_often', label: t.veryOften },
              ]} />
            {errors.overwhelmed && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.overwhelmed}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'goal' && (
          <StepCard emoji="🎯" heading={t.goalHeading} stepId="goal">
            <p className="mb-4 text-center text-slate-600">{t.goalQuestion}</p>
            <OptionGroup name="mainGoal" label={t.goalQuestion} value={answers.mainGoal} onChange={(v) => setAnswer('mainGoal', v)}
              options={[
                { value: 'weight', label: t.weightMgmt, emoji: '⚖️' },
                { value: 'energy', label: t.moreEnergy, emoji: '⚡' },
                { value: 'nutrition', label: t.betterNutrition, emoji: '🥗' },
                { value: 'fitness', label: t.betterFitness, emoji: '💪' },
                { value: 'activity', label: t.moreActivity, emoji: '🏃' },
                { value: 'sleep', label: t.betterSleep, emoji: '😴' },
                { value: 'hydration', label: t.betterHydration, emoji: '💧' },
                { value: 'stress', label: t.betterStress, emoji: '🧠' },
                { value: 'lifestyle', label: t.healthierLifestyle, emoji: '🌱' },
                { value: 'other', label: t.other },
              ]} />
            {errors.mainGoal && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.mainGoal}</p>}
            <div className="mt-6">
              <label htmlFor="goalAchieve" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.goalAchieve}</label>
              <textarea id="goalAchieve" value={answers.goalAchieve} onChange={(e) => setAnswer('goalAchieve', e.target.value)} rows={2}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 transition-colors focus:border-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                placeholder="..." />
            </div>
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'stopping' && (
          <StepCard emoji="💭" heading={t.stoppingHeading} stepId="stopping">
            <p className="mb-4 text-center text-slate-600">{t.stoppingQuestion}</p>
            <OptionGroup name="stoppingYou" label={t.stoppingQuestion} value={answers.stoppingYou} onChange={(v) => setAnswer('stoppingYou', v)}
              options={[
                { value: 'time', label: t.lackTime, emoji: '⏰' },
                { value: 'motivation', label: t.lackMotivation, emoji: '😴' },
                { value: 'food_habits', label: t.foodHabits, emoji: '🍔' },
                { value: 'dont_know', label: t.dontKnowStart, emoji: '📚' },
                { value: 'consistency', label: t.cantConsistent, emoji: '🔄' },
                { value: 'budget', label: t.budget, emoji: '💰' },
                { value: 'guidance', label: t.needGuidance, emoji: '🤝' },
                { value: 'ready', label: t.nothingReady, emoji: '✅' },
                { value: 'other', label: t.other },
              ]} />
            {errors.stoppingYou && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.stoppingYou}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.next} />}
          </StepCard>
        )}

        {phase === 'readiness' && (
          <StepCard emoji="🔥" heading={t.readinessHeading} stepId="readiness">
            <p className="mb-4 text-center text-slate-600">{t.readinessQuestion}</p>
            <RatingScale value={answers.readiness} onChange={(v) => setAnswer('readiness', v)} label={t.readinessQuestion} name="readiness" minLabel={t.notReady} maxLabel={t.readyToStart} />
            {errors.readiness && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.readiness}</p>}
            {showNav && <NavButtons onBack={handleBack} onNext={handleNext} nextLabel={t.seeReport} isLast />}
          </StepCard>
        )}

        {phase === 'report' && (
          <ReportView report={report} bmi={bmi} personal={personal} onReady={() => setPhase('ready')} onBack={handleBack} t={t} />
        )}

        {phase === 'ready' && (
          <ReadyQuestion onYes={() => setPhase('guidance')} onNotSure={() => setPhase('guidance')} onBack={() => setPhase('report')} t={t} />
        )}

        {phase === 'guidance' && (
          <GuidanceSection
            whatsappLink={buildWhatsAppLink()}
            onCallback={() => setPhase('callback')}
            onAppointment={() => setPhase('appointment')}
            onBack={() => setPhase('report')}
            t={t}
          />
        )}

        {phase === 'callback' && (
          <ContactForm type="callback" personal={personal} lang={lang} t={t} onBack={() => setPhase('guidance')} />
        )}

        {phase === 'appointment' && (
          <ContactForm type="appointment" personal={personal} lang={lang} t={t} onBack={() => setPhase('guidance')} />
        )}
      </main>
      <Footer t={t} />
    </div>
  );
}

function Landing({ onStart, lang, setLang, t }: { onStart: () => void; lang: LanguageCode; setLang: (l: LanguageCode) => void; t: ReturnType<typeof getTranslation> }) {
  return (
    <div className="animate-fade-in text-center">
      <div className="mb-6 text-6xl" aria-hidden="true">🌱</div>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-slate-800 sm:text-4xl">{t.brand}</h1>
      <p className="mb-2 text-lg font-medium text-emerald-600">{t.tagline}</p>
      <p className="mb-6 text-base text-slate-600">{t.subtitle}</p>
      <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500">{t.supporting}</p>

      {/* Language selector */}
      <div className="mx-auto mb-8 max-w-md">
        <label htmlFor="lang-select" className="mb-2 block text-sm font-semibold text-slate-600">{t.selectLanguage}</label>
        <div className="flex flex-wrap justify-center gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
                lang === l.code
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              {l.nativeLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FeatureCard icon={<Clock className="h-6 w-6" />} title={t.feature1} />
        <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title={t.feature2} />
        <FeatureCard icon={<Lock className="h-6 w-6" />} title={t.feature3} />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        {t.startCta} <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="mt-6 text-sm text-slate-400">{t.noRightWrong}</p>
    </div>
  );
}

function FeatureCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
      <span className="text-emerald-500" aria-hidden="true">{icon}</span>
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
  );
}

function ReportView({ report, bmi, personal, onReady, onBack, t }: {
  report: ReturnType<typeof buildReport>;
  bmi: number | null;
  personal: PersonalInfo;
  onReady: () => void;
  onBack: () => void;
  t: ReturnType<typeof getTranslation>;
}) {
  const scoreColorHex = report.overall >= 70 ? '#059669' : report.overall >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">📊 {t.reportHeading}</h1>

      <div className="mb-8 flex flex-col items-center">
        <div className="relative h-44 w-44">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" stroke={scoreColorHex} strokeLinecap="round"
              strokeDasharray={`${(report.overall / 100) * 327} 327`} style={{ transition: 'stroke-dasharray 1s ease-out' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold" style={{ color: scoreColorHex }}>{report.overall}</span>
            <span className="text-sm font-medium text-slate-400">{t.outOf}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">{t.overallScore}</p>
        {personal.fullName && <p className="mt-1 text-sm font-medium text-slate-600">{personal.fullName.split(' ')[0]}, this is your snapshot today.</p>}
        {bmi != null && <p className="mt-1 text-xs text-slate-400">BMI: {bmi} — {bmiLabel(bmi)}</p>}
      </div>

      <div className="mb-8 space-y-3">
        <h2 className="mb-3 text-lg font-bold text-slate-700">{t.yourCategories}</h2>
        {report.categories.map((cat) => <CategoryBar key={cat.key} cat={cat} t={t} />)}
      </div>

      <div className="mb-8 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-700">🌟 {t.strengths}</h2>
        <p className="mb-4 text-sm text-slate-600">
          {report.strengths.map((s) => s.label.toLowerCase()).join(', ')} {t.strengths.toLowerCase()}.
        </p>
        <div className="flex flex-wrap gap-2">
          {report.strengths.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
              <span aria-hidden="true">{s.emoji}</span> {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-amber-100 bg-amber-50/50 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-700">🎯 {t.areasToWork}</h2>
        <div className="space-y-3">
          {report.attentionAreas.map((a) => (
            <div key={a.key} className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{a.emoji}</span>
              <div>
                <p className="font-semibold text-slate-700">{a.label} — {ratingLabel(a.rating, t)}</p>
                <p className="text-sm text-slate-500">{attentionText(a.key)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-700">⚠️ {t.whyMatters}</h2>
        <div className="space-y-3">
          {report.whyItMatters.map((w, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl" aria-hidden="true">{w.emoji}</span>
              <p className="text-sm text-slate-600">{w.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">{t.medicalDisclaimer}</p>
      </div>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">🚀 {t.biggestOpportunity}</h2>
        <p className="text-sm text-emerald-50">{opportunityText(report.biggestOpportunity.key)}</p>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-700">🌱 {t.startSmall}</h2>
        <ol className="space-y-2">
          {report.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600">{i + 1}</span>
              <span className="text-sm text-slate-600">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={onReady}
          className="w-full rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          🔥 {t.continue}
        </button>
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t.back}
        </button>
      </div>
    </div>
  );
}

function CategoryBar({ cat, t }: { cat: ReturnType<typeof buildReport>['categories'][number]; t: ReturnType<typeof getTranslation> }) {
  const barColor = cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 60 ? 'bg-emerald-400' : cat.score >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span aria-hidden="true">{cat.emoji}</span> {cat.label}
        </span>
        <span className="text-sm font-bold text-slate-600">{cat.score} <span className="font-normal text-slate-400">· {ratingLabel(cat.rating, t)}</span></span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${cat.label}: ${cat.score} out of 100, ${ratingLabel(cat.rating, t)}`}>
        <div className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${cat.score}%` }} />
      </div>
    </div>
  );
}

function attentionText(key: string): string {
  const map: Record<string, string> = {
    health: 'Tuning into your health now can help you make better choices.',
    energy: 'Small changes to sleep and activity can lift your daily energy.',
    nutrition: 'A few adjustments to your meals can make a real difference.',
    hydration: 'Drinking more water is one of the easiest wins to start with.',
    activity: 'Adding movement to your day can quickly improve how you feel.',
    sleep: 'A consistent sleep routine can transform your recovery.',
    lifestyle: 'Finding ways to manage stress can improve your overall wellbeing.',
  };
  return map[key] || 'Small, consistent changes can improve this area.';
}

function opportunityText(key: string): string {
  const map: Record<string, string> = {
    health: 'Your biggest opportunity right now is tuning into your health and building awareness of your daily habits.',
    energy: 'Your biggest opportunity right now is improving the habits that fuel your daily energy — sleep, activity and nutrition.',
    nutrition: 'Your biggest opportunity right now is making your meals more balanced and consistent.',
    hydration: 'Your biggest opportunity right now is building a simple daily hydration habit.',
    activity: 'Your biggest opportunity right now is building regular physical activity into your week.',
    sleep: 'Your biggest opportunity right now is building a more consistent sleep routine.',
    lifestyle: 'Your biggest opportunity right now is finding simple ways to manage stress day to day.',
  };
  return map[key] || 'Your biggest opportunity right now is building one consistent healthy habit at a time.';
}

function ReadyQuestion({ onYes, onNotSure, onBack, t }: { onYes: () => void; onNotSure: () => void; onBack: () => void; t: ReturnType<typeof getTranslation> }) {
  return (
    <div className="animate-fade-in text-center">
      <div className="mb-6 text-6xl" aria-hidden="true">🔥</div>
      <h1 className="mb-4 text-3xl font-bold text-slate-800">{t.readyChangeHeading}</h1>
      <p className="mb-2 text-base text-slate-600">{t.readyChangeText1}</p>
      <p className="mb-8 text-base text-slate-600">{t.readyChangeText2}</p>
      <p className="mb-6 text-lg font-medium text-slate-700">{t.readyChangeQuestion}</p>
      <div className="space-y-3">
        <button type="button" onClick={onYes} className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          🔥 {t.yesReady}
        </button>
        <button type="button" onClick={onNotSure} className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-6 py-4 text-base font-bold text-emerald-700 transition-all hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          💬 {t.wantGuidance}
        </button>
        <button type="button" onClick={onNotSure} className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-600 transition-all hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          🤔 {t.notSure}
        </button>
        <button type="button" onClick={onNotSure} className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-500 transition-all hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          ⏳ {t.maybeLater}
        </button>
      </div>
      <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t.backToReport}
      </button>
    </div>
  );
}

function GuidanceSection({ whatsappLink, onCallback, onAppointment, onBack, t }: {
  whatsappLink: string;
  onCallback: () => void;
  onAppointment: () => void;
  onBack: () => void;
  t: ReturnType<typeof getTranslation>;
}) {
  return (
    <div className="animate-fade-in text-center">
      <div className="mb-6 text-6xl" aria-hidden="true">🌿</div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">{t.guidanceHeading}</h1>
      <p className="mb-8 text-base text-slate-600">{t.guidanceText}</p>

      <div className="space-y-3">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> {t.talkToMe}
        </a>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-6 py-4 text-base font-bold text-emerald-700 transition-all hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> {t.contactWhatsapp}
        </a>
        <button type="button" onClick={onCallback}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-6 py-4 text-base font-bold text-emerald-700 transition-all hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
          <Phone className="h-5 w-5" aria-hidden="true" /> {t.requestCallback}
        </button>
        <button type="button" onClick={onAppointment}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-600 transition-all hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          <CalendarPlus className="h-5 w-5" aria-hidden="true" /> {t.scheduleAppointment}
        </button>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t.backToReport}
        </button>
      </div>
    </div>
  );
}

function ContactForm({ type, personal, lang, t, onBack }: {
  type: 'callback' | 'appointment';
  personal: PersonalInfo;
  lang: LanguageCode;
  t: ReturnType<typeof getTranslation>;
  onBack: () => void;
}) {
  const [name, setName] = useState(personal.fullName);
  const [phone, setPhone] = useState(personal.phone);
  const [email, setEmail] = useState(personal.email);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t.fullName;
    if (!phone.trim()) e.phone = t.phone;
    if (type === 'appointment' && !date) e.date = t.preferredDate;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    await saveContactRequest({
      full_name: name,
      phone,
      email: email || undefined,
      request_type: type,
      preferred_date: date || undefined,
      preferred_time: time || undefined,
      notes: notes || undefined,
      language: lang,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">✅</div>
        <h1 className="mb-4 text-2xl font-bold text-slate-800">{type === 'callback' ? t.requestCallback : t.scheduleAppointment}</h1>
        <div className="mb-8 flex items-center justify-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          <p className="text-base font-medium">{type === 'callback' ? t.callbackSuccess : t.appointmentSuccess}</p>
        </div>
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t.backToReport}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">{type === 'callback' ? '📞' : '📅'}</span>
      </div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">{type === 'callback' ? t.requestCallback : t.scheduleAppointment}</h1>
      <div className="space-y-4">
        <TextField id="cb-name" label={t.fullName} value={name} onChange={setName} required error={errors.name} placeholder={t.fullName} />
        <TextField id="cb-phone" label={t.phone} value={phone} onChange={setPhone} required type="tel" inputMode="tel" error={errors.phone} placeholder="+1 555 000 0000" />
        <TextField id="cb-email" label={t.emailOptional} value={email} onChange={setEmail} type="email" inputMode="email" placeholder="you@example.com" />
        {type === 'appointment' && (
          <>
            <div>
              <label htmlFor="cb-date" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.preferredDate} *</label>
              <input id="cb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                className={`w-full rounded-2xl border-2 px-4 py-3.5 text-base text-slate-800 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-emerald-400'}`} />
              {errors.date && <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">{errors.date}</p>}
            </div>
            <div>
              <label htmlFor="cb-time" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.preferredTime}</label>
              <input id="cb-time" type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base text-slate-800 transition-colors focus:border-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300" />
            </div>
          </>
        )}
        <div>
          <label htmlFor="cb-notes" className="mb-1.5 block text-sm font-semibold text-slate-700">{t.notes}</label>
          <textarea id="cb-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 transition-colors focus:border-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            placeholder="..." />
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t.back}
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className={`flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
            submitting ? 'cursor-wait bg-slate-300 text-slate-500' : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-xl'
          }`}>
          {submitting ? '...' : t.submit}
        </button>
      </div>
    </div>
  );
}

function Footer({ t }: { t: ReturnType<typeof getTranslation> }) {
  return (
    <footer className="border-t border-slate-100 py-6 text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {t.footerNote}
      </p>
    </footer>
  );
}

export default App;
