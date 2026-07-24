export interface SchedulePromptInput {
  examDate: string;
  subjects: string[];
  dailyHours: number;
  noteTitles: string[];
  weakTopics: string[];
}

export const buildSchedulePrompt = (input: SchedulePromptInput): string => {
  const { examDate, subjects, dailyHours, noteTitles, weakTopics } = input;
  return `You are EduBridge AI Schedule Planner.
Generate an optimized, daily study timetable leading up to an upcoming exam.

Student Details:
- Exam Date: ${examDate}
- Subjects: ${subjects.join(', ')}
- Daily Available Study Hours: ${dailyHours} hours
- Available Uploaded Notes: ${noteTitles.join(', ') || 'General Notes'}
- Identified Weak Topics Needing Revision: ${weakTopics.join(', ') || 'Fundamentals'}

INSTRUCTIONS:
Return a JSON array of daily study blocks for the next 7 days. Each block must have:
- day: e.g. "Day 1", "Day 2"
- date: e.g. "Tomorrow"
- title: clear study block title
- focusTopic: specific concept/topic
- linkedNoteTitle: title of note to read (if available)
- actionType: "read_note" | "take_quiz" | "review_flashcards"
- durationMinutes: estimated duration in minutes

Output ONLY valid JSON array with no markdown formatting.`;
};
