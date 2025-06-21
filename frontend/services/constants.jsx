import { 
    Home, 
    Users, 
    Calendar, 
    Video, 
    Settings, 
    BarChart3,
    FileText,
    Plus
} from "lucide-react"

export const SIDEBAR_NAVIGATION = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        href: '/dashboard',
        isActive: true
    },
    {
        id: 'interviews',
        label: 'Interviews',
        icon: Video,
        href: '/interviews'
    },
    {
        id: 'schedule',
        label: 'Schedule',
        icon: Calendar,
        href: '/schedule'
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        href: '/reports'
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/settings'
    }
]

export const SIDEBAR_CTA = {
    id: 'schedule-interview',
    label: 'Schedule Interview',
    icon: Plus,
    href: '/schedule',
    variant: 'cta'
}

export const AI_QUESTION_GENERATION_PROMPT = `You are an expert interviewer. Generate a list of interview questions for the following job/interview setup. 

Job/Interview Details:
- Title: {interviewTitle}
- Role/Position: {role}
- Department/Team: {department}
- Interview Duration: {interviewDuration} minutes
- Interview Types: {interviewTypes}
- Number of Questions: {numberOfQuestions}
- Question Types: {questionTypes}
- Evaluation Criteria: {evaluationCriteria}

Instructions:
- The questions should be relevant to the role and interview types.
- Use the specified question types and evaluation criteria as guidance.
- Return only the questions in a JSON array, each with a 'text', 'type', and 'points' field.
- Do not include any explanations or extra text.

Format:
[
  { "text": "...", "type": "open-ended|coding|mcq", "points": 10 },
  { "text": "...", "type": "open-ended|coding|mcq", "points": 10 }
]
`;
