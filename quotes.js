// ============================================================
//  quotes.js — Smart Quote Engine
//  Performance-based motivational quotes.
//  High (80-100) · Medium (40-79) · Low (0-39)
// ============================================================

const QUOTES = {
  high: [
    { text: "Discipline is the bridge between goals and accomplishment.", tag: "High Performance" },
    { text: "You don't rise to the level of your goals, you fall to the level of your systems.", tag: "High Performance" },
    { text: "Excellence is not a destination but a continuous journey.", tag: "High Performance" },
    { text: "The secret of your future is hidden in your daily routine.", tag: "High Performance" },
    { text: "Consistency is the hallmark of the unbroken.", tag: "High Performance" },
    { text: "Small daily improvements over time lead to stunning results.", tag: "High Performance" },
    { text: "Win the morning, win the day.", tag: "High Performance" },
  ],
  medium: [
    { text: "Progress, not perfection, is the goal.", tag: "Keep Going" },
    { text: "Every step forward is a step in the right direction.", tag: "Keep Going" },
    { text: "You are further along than you were yesterday.", tag: "Keep Going" },
    { text: "Momentum is built one completed task at a time.", tag: "Keep Going" },
    { text: "Half done is infinitely better than never started.", tag: "Keep Going" },
    { text: "The middle of the journey is where most people quit. Don't.", tag: "Keep Going" },
    { text: "Effort today is the investment for tomorrow's results.", tag: "Keep Going" },
  ],
  low: [
    { text: "Today was hard. Tomorrow is a fresh start.", tag: "Start Fresh" },
    { text: "A journey of a thousand miles begins with a single step.", tag: "Start Fresh" },
    { text: "The best time to start was yesterday. The second best is now.", tag: "Start Fresh" },
    { text: "Every master was once a beginner who refused to give up.", tag: "Start Fresh" },
    { text: "Your only competition is who you were yesterday.", tag: "Start Fresh" },
    { text: "Rest if you must, but don't quit.", tag: "Start Fresh" },
    { text: "One task done today is one more than zero.", tag: "Start Fresh" },
  ]
};

function getQuote(pct) {
  let pool;
  if (pct >= 80)      pool = QUOTES.high;
  else if (pct >= 40) pool = QUOTES.medium;
  else                pool = QUOTES.low;
  return pool[Math.floor(Math.random() * pool.length)];
}
