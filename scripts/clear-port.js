/**
 * 빌드 전 3000번 포트를 사용하는 프로세스를 종료하는 스크립트
 * Windows, Mac, Linux 모두 지원
 * Graceful shutdown 시도 후 실패 시 강제 종료 + .next 정리
 */
const { exec, execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MAX_WAIT_MS = 5000; // 최대 5초 대기
const CHECK_INTERVAL_MS = 200; // 0.2초마다 확인
const GRACEFUL_TIMEOUT_MS = 3000; // Graceful shutdown 대기 시간

/**
 * .next 디렉토리를 정리하는 함수
 */
function cleanNextDirectory() {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    try {
      console.log('🧹 손상된 .next 디렉토리를 정리하는 중...');
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✓ .next 디렉토리 정리 완료');
    } catch (error) {
      console.warn(`⚠ .next 디렉토리 정리 실패: ${error.message}`);
    }
  }
}

/**
 * 포트가 사용 중인지 확인하는 함수 (Windows 전용)
 * @returns {Promise<boolean>}
 */
function isPortInUseWin(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Windows에서 프로세스를 graceful하게 종료 시도
 * @param {string} pid - 프로세스 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
async function gracefulKillWindows(pid) {
  try {
    // /F 플래그 없이 종료 시도 (graceful)
    execSync(`taskkill /PID ${pid}`, { timeout: GRACEFUL_TIMEOUT_MS, stdio: 'ignore' });
    console.log(`✓ PID ${pid} gracefully 종료됨`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Unix에서 프로세스를 graceful하게 종료 시도
 * @param {string} pid - 프로세스 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
async function gracefulKillUnix(pid) {
  try {
    // SIGTERM (graceful shutdown)
    execSync(`kill ${pid}`, { timeout: GRACEFUL_TIMEOUT_MS, stdio: 'ignore' });

    // 프로세스가 종료되는지 확인
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // 프로세스가 아직 살아있는지 확인
      execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
      // 살아있으면 graceful 실패
      return false;
    } catch {
      // 죽었으면 성공
      console.log(`✓ PID ${pid} gracefully 종료됨`);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * 포트 정리 메인 함수 (Windows)
 */
async function killPortWindows() {
  if (!(await isPortInUseWin(PORT))) {
    console.log(`포트 ${PORT}에서 실행 중인 프로세스가 없습니다.`);
    return;
  }

  console.log(`포트 ${PORT}을(를) 사용하는 프로세스를 종료하는 중...`);
  const pids = new Set();

  try {
    const result = execSync(`netstat -ano | findstr ":${PORT}" | findstr "LISTENING"`, { encoding: 'utf8' });
    result.split('\n').filter(line => line.trim()).forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== '0') pids.add(pid);
    });
  } catch (e) {
    console.log(`포트 ${PORT}에서 실행 중인 프로세스를 찾지 못했습니다.`);
    return;
  }

  if (pids.size === 0) {
    console.log(`포트 ${PORT}을(를) 사용하는 프로세스가 없습니다.`);
    return;
  }

  let needsCleanup = false;

  for (const pid of pids) {
    // 1단계: Graceful shutdown 시도
    const gracefulSuccess = await gracefulKillWindows(pid);

    if (!gracefulSuccess) {
      // 2단계: 강제 종료
      try {
        console.warn(`⚠ PID ${pid} graceful 종료 실패, 강제 종료 중...`);
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`✓ PID ${pid} 강제 종료됨`);
        needsCleanup = true;
      } catch (e) {
        console.log(`⚠ PID ${pid} 종료 실패`);
      }
    }
  }

  // 강제 종료가 발생했으면 .next 정리
  if (needsCleanup) {
    cleanNextDirectory();
  }

  // 포트 해제 대기
  console.log(`포트 ${PORT}가 해제되기를 기다리는 중...`);
  const startTime = Date.now();
  while (Date.now() - startTime < MAX_WAIT_MS) {
    if (!(await isPortInUseWin(PORT))) {
      console.log(`✓ 포트 ${PORT} 정리 완료`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
  }

  console.error(`🚨 시간 초과: ${MAX_WAIT_MS / 1000}초 내에 포트 ${PORT}가 해제되지 않았습니다.`);
  process.exit(1);
}

/**
 * 포트 정리 메인 함수 (Unix/Linux/Mac)
 */
async function killPortUnix() {
  console.log(`포트 ${PORT}을(를) 사용하는 프로세스를 종료하는 중...`);

  try {
    // lsof 명령어 확인
    try {
      execSync('which lsof', { stdio: 'ignore' });
    } catch (e) {
      console.log(`⚠ lsof 명령어를 찾을 수 없습니다. 포트 정리를 건너뜁니다.`);
      return;
    }

    // 포트를 사용하는 프로세스 찾기
    let pids = '';
    try {
      pids = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' }).trim();
    } catch (e) {
      console.log(`포트 ${PORT}을(를) 사용하는 프로세스가 없습니다.`);
      return;
    }

    if (!pids) {
      console.log(`포트 ${PORT}을(를) 사용하는 프로세스가 없습니다.`);
      return;
    }

    const pidList = pids.split('\n').filter(p => p.trim());
    let needsCleanup = false;

    for (const pid of pidList) {
      // 1단계: Graceful shutdown 시도
      const gracefulSuccess = await gracefulKillUnix(pid);

      if (!gracefulSuccess) {
        // 2단계: 강제 종료 (SIGKILL)
        try {
          console.warn(`⚠ PID ${pid} graceful 종료 실패, 강제 종료 중...`);
          execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
          console.log(`✓ PID ${pid} 강제 종료됨`);
          needsCleanup = true;
        } catch (e) {
          console.log(`⚠ PID ${pid} 종료 실패`);
        }
      }
    }

    // 강제 종료가 발생했으면 .next 정리
    if (needsCleanup) {
      cleanNextDirectory();
    }

    console.log(`✓ 포트 ${PORT} 정리 완료`);
  } catch (error) {
    console.log(`포트 정리 중 오류 발생: ${error.message}`);
  }
}

/**
 * 메인 함수
 */
async function killPort() {
  const platform = os.platform();

  if (platform === 'win32') {
    await killPortWindows();
  } else {
    await killPortUnix();
  }
}

// 실행
(async () => {
  try {
    await killPort();
  } catch (error) {
    console.error('포트 정리 중 오류 발생:', error.message);
    process.exit(1);
  }
})();
