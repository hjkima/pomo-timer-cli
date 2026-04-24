---
description: Pomodoro timer — start or check session logs. Use when the user's message includes "pomodoro", "timer", "focus session", or "pomo".
---

Use the pomo CLI to run a pomodoro timer.

## CLI Commands

```bash
pomo start "task" -t [min]             # Single session (default 25 min)
pomo set "task" -t [work_min] -s [break_min]  # Set: work + break auto-progression (default 25+5)
pomo log                               # Today's log
pomo log --all                         # All logs
pomo clear                             # Clear logs
```

## Natural Language → Command Rules

- **task**: what the user mentioned. Default: `"unnamed"`
- **mode**: "set", "work and break", "full" → `set` / "single", "just one" → `single` / if unclear, ask
- **duration**: extract any number mentioned. Use defaults if not specified
- **log request**: "today", "how much", "log", "focus time" → `pomo log`

## Examples

| User input | Command |
|---|---|
| "Start a timer for my report" | mode unclear → ask |
| "Single session for my report" | `pomo start "report"` |
| "Set for my report" | `pomo set "report"` |
| "30 minute set" | `pomo set "unnamed" -t 30` |
| "40 min work, 10 min break for report" | `pomo set "report" -t 40 -s 10` |
| "How much did I focus today?" | `pomo log` |
| "Show all logs" | `pomo log --all` |
