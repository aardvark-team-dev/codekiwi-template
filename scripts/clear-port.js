/**
 * 빌드 전 3000번 포트를 사용하는 프로세스를 종료하는 스크립트
 * Windows, Mac, Linux 모두 지원
 * 포트가 해제될 때까지 폴링하여 안정성을 높임
 */
const { exec, execSync } = require('child_process');
const os = require('os');

const PORT = 3000;
const MAX_WAIT_MS = 5000; // 최대 5초 대기
const CHECK_INTERVAL_MS = 200; // 0.2초마다 확인

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
 * 포트 정리 메인 함수
 */
async function killPort() {
  const platform = os.platform();

  if (platform === 'win32') {
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
    
    if (pids.size > 0) {
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`✓ PID ${pid} 종료됨`);
        } catch (e) {
          console.log(`⚠ PID ${pid} 종료 실패`);
        }
      });

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
  } else {
    console.log(`포트 ${PORT}을(를) 사용하는 프로세스를 종료하는 중...`);
    try {
      try {
        execSync('which lsof', { stdio: 'ignore' });
      } catch (e) {
        console.log(`⚠ lsof 명령어를 찾을 수 없습니다. 포트 정리를 건너뜁니다.`);
        return;
      }

      let pids = '';
      try {
        pids = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' }).trim();
      } catch (e) {
        console.log(`포트 ${PORT}을(를) 사용하는 프로세스가 없습니다.`);
        return;
      }

      if (pids) {
        const pidList = pids.split('\n').filter(p => p.trim());
        pidList.forEach(pid => {
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
            console.log(`✓ PID ${pid} 종료됨`);
          } catch (e) {
            console.log(`⚠ PID ${pid} 종료 실패`);
          }
        });
        console.log(`✓ 포트 ${PORT} 정리 완료`);
      } else {
        console.log(`포트 ${PORT}을(를) 사용하는 프로세스가 없습니다.`);
      }
    } catch (error) {
      console.log(`포트 정리 중 오류 발생: ${error.message}`);
    }
  }
}

(async () => {
  try {
    await killPort();
  } catch (error) {
    console.error('포트 정리 중 오류 발생:', error.message);
  }
})();