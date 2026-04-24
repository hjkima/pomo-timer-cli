# pomodoro-cli

Claude Code에서 자연어로 트리거하는 포모도로 타이머 CLI.

## 설치

```bash
npm install -g pomodoro-cli
```

## Claude Code skill 등록

`~/.claude/skills/pomo.md` 파일을 추가하면 Claude Code에서 자연어로 사용 가능합니다.

```bash
curl -o ~/.claude/skills/pomo.md \
  https://raw.githubusercontent.com/hjkima/pomodoro/main/pomo.skill.md
```

등록 후 Claude Code에서:

```
"자소서 작업 타이머 켜줘"
"30분짜리 세트로 켜줘"
"오늘 집중 시간 얼마야?"
```

## CLI 직접 사용

```bash
pomo start "작업명"              # 단일 세션 (기본 25분)
pomo start "작업명" -t 45        # 커스텀 시간
pomo set "작업명"                # 세트 (25분 work + 5분 break)
pomo set "작업명" -t 30 -s 10    # 커스텀 세트
pomo log                         # 오늘 로그
pomo log --all                   # 전체 로그
pomo clear                       # 로그 삭제
```

## 요구사항

- Node.js 18 이상
- Mac OS 또는 Windows
