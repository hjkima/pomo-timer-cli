# pomo-timer-cli

Pomodoro timer CLI for Claude Code. Trigger timers with natural language — no screen switching, just Mac/Windows notifications.

## Installation

```bash
git clone https://github.com/hjkima/pomo-timer-cli
cd pomo-timer-cli
npm install
npm link
```

## Claude Code Skill Setup

Add the skill file to enable natural language triggers in Claude Code:

```bash
curl -o ~/.claude/skills/pomo-timer.md \
  https://raw.githubusercontent.com/hjkima/pomo-timer-cli/main/pomo-timer.skill.md
```

Then just talk to Claude Code:

```
"Start a pomodoro timer for my resume"
"Set a 30-minute work session"
"How much did I focus today?"
```

## CLI Usage

```bash
pomo start "task"              # Single session (default 25 min)
pomo start "task" -t 45        # Custom duration
pomo set "task"                # Set: 25 min work + 5 min break (auto)
pomo set "task" -t 30 -s 10    # Custom set
pomo log                       # Today's log
pomo log --all                 # All logs
pomo clear                     # Clear logs
```

## Requirements

- Node.js 18+
- macOS or Windows
