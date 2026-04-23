#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dayjs = require('dayjs');

const LOG_FILE = path.join(os.homedir(), '.pomo-log.json');
const CLI_PATH = path.join(__dirname, 'index.js');

const server = new Server(
  { name: 'pomo', version: '1.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'pomo_start',
      description: '포모도로 타이머를 시작합니다. 단일 세션 또는 세트(work+break 자동 진행) 모드를 선택할 수 있습니다.',
      inputSchema: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: '작업명 (미입력 시 "unnamed")',
          },
          mode: {
            type: 'string',
            enum: ['single', 'set'],
            description: 'single: 단일 세션, set: work+break 자동 진행',
          },
          duration: {
            type: 'number',
            description: 'work 시간 (분, 기본값 25)',
          },
          short_break: {
            type: 'number',
            description: 'break 시간 (분, 기본값 5, set 모드에서만 사용)',
          },
        },
        required: ['mode'],
      },
    },
    {
      name: 'pomo_log_read',
      description: '세션 로그를 조회합니다. 오늘/주간/월간/전체 범위를 선택할 수 있습니다.',
      inputSchema: {
        type: 'object',
        properties: {
          range: {
            type: 'string',
            enum: ['today', 'week', 'month', 'all'],
            description: '조회 범위 (기본값 today)',
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'pomo_start') {
    const task = args.task || 'unnamed';
    const mode = args.mode;
    const duration = args.duration || 25;
    const shortBreak = args.short_break || 5;

    const cliArgs = mode === 'set'
      ? ['set', task, '-t', String(duration), '-s', String(shortBreak)]
      : ['start', task, '-t', String(duration)];

    const child = spawn(process.execPath, [CLI_PATH, ...cliArgs], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    const modeLabel = mode === 'set'
      ? `세트 (work ${duration}분 + break ${shortBreak}분)`
      : `단일 세션 (${duration}분)`;

    return {
      content: [{ type: 'text', text: `"${task}" 타이머 시작! ${modeLabel} — 완료 시 알림이 옵니다. 🍅` }],
    };
  }

  if (name === 'pomo_log_read') {
    const range = args.range || 'today';

    if (!fs.existsSync(LOG_FILE)) {
      return { content: [{ type: 'text', text: '기록된 세션이 없습니다.' }] };
    }

    let logs;
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch {
      return { content: [{ type: 'text', text: '로그 파일을 읽을 수 없습니다.' }], isError: true };
    }

    const now = dayjs();
    const filtered = logs.filter(log => {
      const logDate = dayjs(log.date, 'YYYY-MM-DD HH:mm');
      if (range === 'today') return logDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');
      if (range === 'week') return logDate.isAfter(now.subtract(7, 'day'));
      if (range === 'month') return logDate.isAfter(now.subtract(30, 'day'));
      return true;
    });

    if (filtered.length === 0) {
      return { content: [{ type: 'text', text: `해당 기간(${range})에 기록된 세션이 없습니다.` }] };
    }

    const totalMinutes = filtered.reduce((sum, l) => sum + l.minutes, 0);
    const lines = filtered.map(l =>
      `${l.date}  ${l.task}  ${l.minutes}분  [${l.mode === 'set' ? '세트' : '단일'}]`
    );
    lines.push('');
    lines.push(`총 ${filtered.length}세션 · ${totalMinutes}분 (${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분)`);

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  return { content: [{ type: 'text', text: `알 수 없는 툴: ${name}` }], isError: true };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
