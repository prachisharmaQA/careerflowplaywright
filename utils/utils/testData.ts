export const USERS = {
  existing: {
    email: process.env.CF_EMAIL ?? 'test@gmail.com',
    password: process.env.CF_PASSWORD ?? 'Arya@07062021',
  },
};
export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer';
export const JOBS = {
  google: {
    company: 'Google',
    role: 'Senior Frontend Engineer',
    location: 'Remote',
    url: 'https://careers.google.com/jobs/results/123',
    status: 'Applied' as JobStatus,
    notes: 'Applied via referral.',
  },
};
export function uniqueJob(base = 'TestCo') {
  return { company: `${base}_${Date.now()}`, role: 'QA Automation Lead' };
}