#!/usr/bin/env node

const { program } = require('commander');
const notifier = require('node-notifier');
const chalk = require('chalk');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.homedir(), '.pomo-log.json');
const SETUP_FLAG = path.join(os.homedir(), '.pomo-setup');

let currentInterval = null;

function sendStartNotification(taskName) {
  const isFirstRun = !fs.existsSync(SETUP_FLAG);

  if (isFirstRun) {
    if (process.platform === 'darwin') {
      console.log(chalk.yellow('Mac 알림 권한 요청이 나타나면 "허용"을 눌러주세요. 이후엔 자동으로 알림이 옵니다.'));
    } else if (process.platform === 'win32') {
      console.log(chalk.yellow('Windows 알림이 차단된 경우: 설정 > 시스템 > 알림에서 node를 찾아 켜주세요.'));
    }
    fs.writeFileSync(SETUP_FLAG, '');
  }

  notifier.notify({ title: 'pomo', message: `"${taskName}" 타이머가 시작되었습니다.` });
}

process.on('SIGINT', () => {
  if (currentInterval) clearInterval(currentInterval);
  process.stdout.write('\n');
  console.log(chalk.red('타이머가 중단되었습니다.'));
  process.exit(0);
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function runTimer(label, minutes, onComplete) {
  const totalSeconds = minutes * 60;
  const startTime = Date.now();

  const tick = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, totalSeconds - elapsed);
    process.stdout.write(`\r${label} ${chalk.yellow(formatTime(remaining))}  `);

    if (remaining <= 0) {
      clearInterval(currentInterval);
      currentInterval = null;
      process.stdout.write('\n');
      onComplete();
    }
  };

  tick();
  currentInterval = setInterval(tick, 1000);
}

function loadLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveLog(entry) {
  const logs = loadLogs();
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// pomo start
program
  .command('start [task]')
  .description('단일 세션 시작')
  .option('-t, --time <minutes>', '세션 시간 (분)', '25')
  .action((task = 'unnamed', options) => {
    const minutes = parseInt(options.time);
    const taskName = task;

    console.log(chalk.green(`"${taskName}" 시작 — ${minutes}분 🍅`));
    sendStartNotification(taskName);
    runTimer(chalk.cyan(`${taskName} 🍅`), minutes, () => {
      notifier.notify({
        title: 'pomo',
        message: '집중 세션이 끝났습니다. 잠시 쉬어가세요.',
        sound: true,
      });
      saveLog({
        date: dayjs().format('YYYY-MM-DD HH:mm'),
        task: taskName,
        minutes,
        mode: 'single',
      });
      console.log(chalk.green(`"${taskName}" 완료! ✅`));
      process.exit(0);
    });
  });

// pomo set
program
  .command('set [task]')
  .description('세트 시작 (work + break 자동 진행)')
  .option('-t, --time <minutes>', 'work 시간 (분)', '25')
  .option('-s, --short-break <minutes>', 'break 시간 (분)', '5')
  .action((task = 'unnamed', options) => {
    const workMinutes = parseInt(options.time);
    const breakMinutes = parseInt(options.shortBreak);
    const taskName = task;

    console.log(chalk.green(`"${taskName}" 세트 시작 — work ${workMinutes}분 + break ${breakMinutes}분 🍅`));
    sendStartNotification(taskName);
    runTimer(chalk.cyan(`${taskName} 🍅`), workMinutes, () => {
      notifier.notify({
        title: 'pomo',
        message: '집중 세션이 끝났습니다. 잠시 쉬어가세요.',
        sound: true,
      });
      console.log(chalk.blue(`휴식 시작 — ${breakMinutes}분 ☕`));

      runTimer(chalk.blue('휴식 ☕'), breakMinutes, () => {
        notifier.notify({
          title: 'pomo',
          message: '휴식이 끝났습니다. 다시 시작할 준비가 되셨나요?',
          sound: true,
        });
        saveLog({
          date: dayjs().format('YYYY-MM-DD HH:mm'),
          task: taskName,
          minutes: workMinutes,
          mode: 'set',
        });
        console.log(chalk.green(`"${taskName}" 세트 완료! ✅`));
        process.exit(0);
      });
    });
  });

// pomo log
program
  .command('log')
  .description('세션 로그 조회')
  .option('--all', '전체 로그 조회')
  .action((options) => {
    const logs = loadLogs();

    if (logs.length === 0) {
      console.log(chalk.gray('기록된 세션이 없습니다.'));
      return;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const filtered = options.all ? logs : logs.filter(l => l.date.startsWith(today));

    if (filtered.length === 0) {
      console.log(chalk.gray('오늘 기록된 세션이 없습니다.'));
      return;
    }

    const label = options.all ? '전체 로그' : '오늘 로그';
    console.log(chalk.bold(`\n${label} 📋`));
    console.log(chalk.gray('─'.repeat(44)));

    filtered.forEach(log => {
      const modeLabel = log.mode === 'set' ? '세트' : '단일';
      console.log(
        `${chalk.gray(log.date)}  ${chalk.cyan(log.task.padEnd(12))}  ${chalk.yellow(String(log.minutes).padStart(3) + '분')}  ${chalk.gray('[' + modeLabel + ']')}`
      );
    });

    const totalMinutes = filtered.reduce((sum, l) => sum + l.minutes, 0);
    console.log(chalk.gray('─'.repeat(44)));
    console.log(chalk.bold(`총 집중 시간: ${chalk.yellow(totalMinutes + '분')} (${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분)\n`));
  });

// pomo clear
program
  .command('clear')
  .description('로그 삭제')
  .action(() => {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
      console.log(chalk.red('로그가 삭제되었습니다.'));
    } else {
      console.log(chalk.gray('삭제할 로그가 없습니다.'));
    }
  });

program.parse();
