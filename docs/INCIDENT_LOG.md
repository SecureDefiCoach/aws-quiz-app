# Incident Log

Recurring problems and the fixes applied, to prevent repeat work.

---

## INC-001: Quiz Card Displays Session Stats Instead of Per-Question Stats

**Status:** Resolved (permanent fix applied)

**Symptom:** The checkmark/X counters in the upper-right of the quiz card (e.g. "✓ 5 ✗ 2") show the session running totals instead of the user's lifetime right/wrong history for that specific question. The tell: the numbers always add up to the number of questions already answered in the session.

**Root cause:** The `QuestionData` API type carried two pairs of count fields side-by-side: `countRight`/`countWrong` (per-question lifetime stats from `userProgress`) and `sessionCorrect`/`sessionWrong` (session running totals). The QuizCard front-end component wired to the wrong pair. Because both pairs were valid integers on the same object, the mistake compiled cleanly and was easy to introduce or revert accidentally.

### Timeline

| Date | Commit | What happened |
|------|--------|---------------|
| 2025-12-21 12:03 CST | `1a23e0f` | **First fix.** Changed QuizCard from `question.sessionCorrect`/`sessionWrong` to `question.countRight`/`countWrong`. Correctly showed per-question history. |
| 2026-04-29 07:16 EDT | `4b11623` | **Regression.** "Fix quiz score counter" commit reverted the Dec 21 fix back to `sessionCorrect`/`sessionWrong`. Commit message framed per-question stats as a bug ("always 0 for new questions") and switched to session totals. Also fixed an unrelated dashboard `$in` query bug. |
| 2026-04-29 09:46 EDT | `b156327` | **Second fix.** Changed QuizCard back to `countRight`/`countWrong`. Same two-line diff as the Dec 21 fix. |
| 2026-04-29 09:50 EDT | `64fd1a5` | Added inline comments clarifying per-question stats vs session totals. |
| 2026-04-29 14:39 EDT | `6e28bd7` | **Permanent fix.** Removed `sessionCorrect`/`sessionWrong` from the `QuestionData` type entirely — deleted from the Amplify GraphQL schema, the backend TypeScript interface, the `getCurrentQuestion` return object, and the frontend interface. Session totals now only exist in `AnswerFeedback.summary` (end-of-quiz). The wrong fields can no longer be accidentally referenced because they no longer exist in the API. |

### Why the fix kept reverting

The `4b11623` regression happened because a different bug (new questions showing "✓ 0 ✗ 0") was misdiagnosed. The zeros were correct — a never-before-seen question genuinely has 0 lifetime right and 0 lifetime wrong. The fix should have been to clarify the UX (or hide the counters for new questions), not to swap back to session totals. Having both field pairs on the same type made the swap a two-line change with no compiler error.

### Prevention

The `6e28bd7` fix removes the ambiguity entirely. `sessionCorrect`/`sessionWrong` no longer exist on `QuestionData` at any layer (schema, backend, frontend). Adding them back would require changes to all three files, each of which now has a doc comment explaining why session totals are excluded. Session running totals are only exposed in the `AnswerFeedback.summary` object returned at end-of-quiz.

### Files involved

- `front-end/amplify/data/resource.ts` — GraphQL schema
- `front-end/amplify/functions/mongo-connector/services/quizService.ts` — Backend interface + query
- `front-end/src/components/QuizCard.tsx` — Frontend display

---
