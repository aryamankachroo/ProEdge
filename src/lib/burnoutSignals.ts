import type { BurnoutCategory } from '../types/journal'

export type BurnoutSignalDef = {
  id: string
  label: string
  category: BurnoutCategory
  /** Shown after session debrief when this signal is checked */
  debriefFollowUp: string
  /** Optional extra angle for weekly reflection */
  weeklyAngle?: string
}

export const BURNOUT_CATEGORY_LABELS: Record<BurnoutCategory, string> = {
  physical: 'Physical',
  mental: 'Mental',
  behavioral: 'Behavioral',
  emotional: 'Emotional',
}

export const BURNOUT_SIGNALS: BurnoutSignalDef[] = [
  {
    id: 'doom-scroll',
    label: 'Doom scrolling instead of studying',
    category: 'behavioral',
    debriefFollowUp:
      'Roughly how long did you scroll vs. how long you meant to study?',
    weeklyAngle: 'Did scrolling win over blocks more than once?',
  },
  {
    id: 'same-paragraph',
    label: 'Reading the same paragraph over and over',
    category: 'mental',
    debriefFollowUp:
      'What were you trying to read (topic or resource), and what pulled you out of flow?',
    weeklyAngle: 'Did rereading without progress happen on multiple days?',
  },
  {
    id: 'dread-app',
    label: 'Dreading opening the app / prep materials',
    category: 'behavioral',
    debriefFollowUp:
      'What did you tell yourself right before you opened (or avoided) them?',
    weeklyAngle: 'Was the dread stronger certain days of the week?',
  },
  {
    id: 'sleep-off',
    label: 'Sleeping too much or too little',
    category: 'physical',
    debriefFollowUp:
      'How many hours felt typical for you lately vs. what you think you need?',
    weeklyAngle: 'Any pattern with test days, caffeine, or stress spikes?',
  },
  {
    id: 'eat-off',
    label: 'Eating too much or too little',
    category: 'physical',
    debriefFollowUp: 'Was this more about stress, time, or not noticing hunger?',
    weeklyAngle: 'Did appetite shifts line up with heavy study days?',
  },
  {
    id: 'headaches',
    label: 'Headaches or pressure',
    category: 'physical',
    debriefFollowUp:
      'When did they tend to start — screen time, dehydration, stress?',
    weeklyAngle: 'Frequency vs. last week?',
  },
  {
    id: 'focus-20',
    label: "Can't concentrate past ~20 minutes",
    category: 'mental',
    debriefFollowUp:
      'What usually breaks your focus first — noise, fatigue, anxiety?',
    weeklyAngle: 'Did breaks help or make it harder to restart?',
  },
  {
    id: 'brain-fog',
    label: 'Brain fog',
    category: 'mental',
    debriefFollowUp: 'Was it worse in the morning, afternoon, or evening?',
    weeklyAngle: 'Fog on rest days too, or mostly study days?',
  },
  {
    id: 'cry-random',
    label: 'Crying out of nowhere',
    category: 'emotional',
    debriefFollowUp:
      'Anything you were holding in before that moment — even unrelated to the MCAT?',
    weeklyAngle: 'How often this week vs. what feels normal for you?',
  },
  {
    id: 'snap-people',
    label: 'Snapping at people around you',
    category: 'emotional',
    debriefFollowUp:
      'Was it about something they did, or more about your bandwidth?',
    weeklyAngle: 'Certain triggers repeating?',
  },
  {
    id: 'nothing-works',
    label: 'Feeling like nothing works no matter how hard you try',
    category: 'emotional',
    debriefFollowUp:
      'What evidence are you using for that thought — one session, a string of days?',
    weeklyAngle: 'Did small wins still land, or did they feel invisible?',
  },
  {
    id: 'skip-sessions',
    label: 'Skipping planned sessions without rescheduling',
    category: 'behavioral',
    debriefFollowUp:
      'Did you avoid starting, or start and bail — what was the first thought?',
    weeklyAngle: 'Which kinds of blocks got skipped most (FL, Anki, content)?',
  },
  {
    id: 'tension-body',
    label: 'Tension, tight shoulders, or jaw clenching',
    category: 'physical',
    debriefFollowUp: 'Notice it during screens, exams, or all day?',
    weeklyAngle: 'Better on movement days?',
  },
  {
    id: 'forget-read',
    label: 'Forgetting what you just read',
    category: 'mental',
    debriefFollowUp: 'Passive reading vs. questions — which was it?',
    weeklyAngle: 'Worse when tired or always?',
  },
  {
    id: 'numb-flat',
    label: 'Feeling numb or emotionally flat',
    category: 'emotional',
    debriefFollowUp: 'How long did it last — hours or days?',
    weeklyAngle: 'Any windows where you felt a little more like yourself?',
  },
  {
    id: 'guilt-spiral',
    label: 'Guilt spiral after taking a break',
    category: 'emotional',
    debriefFollowUp: 'What would you tell a friend who said the same thing?',
    weeklyAngle: 'Breaks getting shorter because of guilt?',
  },
  {
    id: 'procrastinate-blocks',
    label: 'Putting off practice blocks (not just one hard topic)',
    category: 'behavioral',
    debriefFollowUp: 'What did you do instead for the first 10 minutes?',
    weeklyAngle: 'Certain times of day easier to start?',
  },
]

export function signalById(id: string): BurnoutSignalDef | undefined {
  return BURNOUT_SIGNALS.find((s) => s.id === id)
}

export function signalsForCategory(cat: BurnoutCategory): BurnoutSignalDef[] {
  return BURNOUT_SIGNALS.filter((s) => s.category === cat)
}
