# pomodoro

Claude Code에서 자연어로 트리거하는 포모도로 타이머 CLI + MCP 서버

## 설치

```bash
npm install
npm link
```

## CLI 사용법

```bash
pomo start "작업명"              # 단일 세션 (기본 25분)
pomo start "작업명" -t 45        # 커스텀 시간
pomo set "작업명"                # 세트 (25분 work + 5분 break, 자동 진행)
pomo set "작업명" -t 30 -s 10    # 커스텀 세트
pomo log                         # 오늘 로그
pomo log --all                   # 전체 로그
pomo clear                       # 로그 삭제
```

## Claude Code MCP 등록

```bash
claude mcp add -s user pomo node /절대경로/pomo-cli/mcp.js
```

등록 후 Claude Code에서 자연어로 사용:

```
"자소서 작업 타이머 켜줘"
"오늘 집중 시간 얼마야?"
"30분짜리 세트로 켜줘"
```

## 기술 스택

- Node.js
- commander, chalk, dayjs, node-notifier
- @modelcontextprotocol/sdk
