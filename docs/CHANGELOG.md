# Changelog

## 2026-04-24 — Fix Ever Wrong filter excluding mastered questions

**Commit:** `1624865`
**Rollback target:** `3899c7c`
**File changed:** `front-end/amplify/functions/mongo-connector/services/quizService.ts`

### Problem
Selecting only "Ever Wrong" as a question state filter caused "Failed to start quiz." Mastered questions were excluded from the query before the Ever Wrong filter ran, so any question answered wrong and later mastered was silently dropped. If all ever-wrong questions for a subdomain had been mastered, the filter returned 0 results.

### What changed
- `getQuestionCount` and `startQuiz` now skip the mastered-question exclusion when `EVER_WRONG` is in the selected states.
- The state filter still correctly includes only questions with `wrongCount > 0` for Ever Wrong.
- No behavior change for NEW, WRONG, or RIGHT filters — mastered questions are still excluded for those.

### Test plan
1. Select only "Ever Wrong" for a subdomain with mastered questions — quiz should start.
2. Select "Ever Wrong" + another state (e.g., WRONG) — quiz should start, count should include mastered-but-ever-wrong questions.
3. Select only NEW, WRONG, or RIGHT — mastered questions should still be excluded (no regression).
4. Verify question count matches the number of questions served in the quiz.

### Rollback
```bash
git revert 1624865
git push
```
Or to hard-reset (destructive — discards any later commits):
```bash
git reset --hard 3899c7c
git push --force
```
