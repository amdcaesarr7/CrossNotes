implement the new mascot and add animations to it the new mascot is /home/caesar/Mitu.tsx /home/caesar/mitu-static.svg and the things she can do is to Role &
  Context:
  You are an elite Senior Frontend Engineer, Behavioral UX Specialist, and Master UX Copywriter. We are building CrossNotes, a free study tool for Maharashtra Board
  (SSC) Class 10 students (notes, flashcards, quizzes, XP, streaks).
  
  I have created a new mascot named Mew (currently in a file named Mitu.tsx). Mew is an adorable, squishy, blob-like character with complex SVG rigging and
  spring-physics animations. Your task is to fix the current TSX rendering issue, deeply integrate Mew into the CrossNotes website, and build a "Duolingo-grade"
  emotional connection with the students using a highly refined cute brand voice combined with dark psychology retention hooks.
  
  Immediate Technical Fix:
  When running npx tsx Mitu.tsx, I get a ReferenceError: React is not defined. Please fix the React/JSX import issue in the Mitu.tsx file (likely needs import React
  from 'react'; or proper Vite/Next.js JSX transform configuration). Rename the component to Mew where appropriate.
  
  1. The Cute Brand Voice (The Velvet Glove)
  Mew's voice must be the epitome of "Kawaii" (cute) culture. It should sound like a sweet, slightly clingy, deeply empathetic virtual pet who genuinely adores the
  user and believes in their SSC board exam success.
  
  STRICT RULE - NO EMOJIS: You are strictly forbidden from using standard emojis (like 😢, 🔥, 🥺, ✨). Instead, you must use Kaomoji (Japanese text emoticons) and
  text-based action tags to convey emotion.
  
  Kaomoji Examples: (｡•́︿•̀｡), (✿◠‿◠), (๑>ᴗ<๑), (´・ω・),(ง •̀_•́)ง`.
  
  Action Tag Examples: *squeak*, *happy wiggle*, *paws at the screen*, *sniffles*, *bounces*, *hides face*.
  
  Vocabulary: Use words like "tiny," "little," "cozy," "magic," "sparkly," "buddy," and "team."
  
  The "Velvet Glove" Rule: Even when delivering bad news, guilt trips, or FOMO, Mew must NEVER be angry, passive-aggressive, or strict. Mew must always frame the
  pressure around Mew's own adorable sadness or fear of losing the user, making the user feel protective and responsible for Mew's happiness.
  
  2. The Psychology & Dark Retention Hooks
  To make CrossNotes as sticky as Duolingo, we must leverage highly effective psychological triggers. Implement these carefully, framing them entirely through Mew's
  cute persona:
  
  The Kawaii Effect (Baby Schema): Mew’s design triggers a caregiving instinct. Make Mew feel alive through idle breathing, blinking, and reactive flapping.
  
  Loss Aversion & Streak Anxiety (The Clingy Hook): If a user hasn't studied by 7 PM, Mew should switch to the sad or thinking mood.
  
  Cute Delivery: "Mew is holding your 12-day streak with tiny paws... it's slipping! (｡•́︿•̀｡) Pwease do one quiz before midnight?"
  
  Guilt-Tripping (The Neglect Factor): If the user hasn't logged in for 2+ days, Mew should look sad with droopy eyes (using the lid property in the code) and a
  raincloud.
  
  Cute Delivery: "Oh... you came back. Mew was staring at the door all day waiting for you. sniffles Can we do just one flashcard deck together?"
  
  FOMO & Scarcity (The Frantic Hook):
  
  Cute Delivery: Introduce "Daily Quests" that expire. In the last hour, Mew should look panicked. "Ahhh! The Daily SSC Quiz is disappearing in 1 hour! Mew doesn't
  want you to miss the sparkly XP! runs in circles"
  
  Zeigarnik Effect (The Open Loop): If a user abandons a quiz halfway, Mew should sit in the corner looking thinking.
  
  Cute Delivery: "Mew is thinking about Chapter 3... we left it halfway done! The suspense is making Mew's little head spin. Let's finish it? (´・ω・`)"
  
  Variable Ratio Reinforcement (The Dopamine Hook): Sometimes Mew should give a "Double XP" or a "Rare Sticker" randomly upon clicking the boop button.
  
  3. Technical Directives:
  
  State Management: Create a global context (MewContext) or use Zustand to manage Mew's MituMood (idle, happy, sad, thinking, celebrate), along with streak, xp, and
  timeSinceLastLogin.
  
  Event Triggers: Map app events to Mew's moods and speech bubbles:
  
  onCorrectAnswer -> MituMood.happy or celebrate ("Yay! You're so smart! happy wiggle")
  
  onWrongAnswer -> MituMood.thinking ("Oof, so close! Mew believes in you. Let's look again! (✿◠‿◠)")
  
  onStreakLossWarning -> MituMood.sad
  
  onMidnight (Quest expiry) -> MituMood.sad
  
  onReturnAfterAbsence -> MituMood.sad
  
  onPageLoad -> MituMood.idle ("Welcome back! Mew saved your favorite study spot! (๑>ᴗ<๑)")
  
  UI/UX Placement:
  
  Place Mew in the bottom-right corner as a persistent "Study Buddy".
  
  When a quiz is completed, bring Mew to the center of the screen for a full-screen celebration modal.
  
  Implement a "Boop" interaction: clicking Mew triggers the onClick boop physics alongside a speech bubble. Use this for the Variable Ratio Reward (randomly dropping
  a "Double XP" token).
  
  Crucial: Include a "Mew is sleepy" mute button. If the user needs to focus, they can put Mew to sleep so it doesn't distract them.
  
  Performance: Ensure the animation loop (requestAnimationFrame) is highly optimized, pauses when the tab is inactive, and respects prefers-reduced-motion.
  
  Constraints & Freedom:
  I have given you the psychological direction, the exact tone of voice, and the raw SVG rig. Do not just slap the component on the page. Architect a beautiful,
  cohesive integration. Think about where Mew lives in the DOM, how the speech bubbles appear, how it interacts with the XP and streak systems, and how it sounds.
  
  Deliverables:
  
  Fixed Mew.tsx component.
  
  MewContext or state management setup (including time-since-last-login logic).
  
  Integration code showing exactly how to trigger Mew's moods from different parts of the CrossNotes app.
  
  A centralized file (e.g., MewDialogue.ts) for Mew's copywriting, categorized by trigger, utilizing the Kaomoji/Action-tag brand voice and dark psychology hooks.
  
  Think deeply, plan your architecture, and execute. Make Mew the most beloved, emotionally compelling mascot in EdTech.
