/**
 * Next.js 서버 프로세스를 완전히 정리하는 스크립트
 * - next dev, next-server 등 모든 관련 프로세스 종료
 * - Graceful shutdown 시도 후 강제 종료
 * - 강제 종료 시 .next 캐시 정리
 */
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const GRACEFUL_TIMEOUT_MS = 3000;

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
 * Unix/Linux에서 Next.js 프로세스 정리
 */
async function clearNextProcessesUnix() {
  console.log('Next.js 관련 프로세스를 찾는 중...');
  
  const processPatterns = [
    'next dev',
    'next-server',
    'next build',
    'next start'
  ];
  
  let foundProcesses = [];
  
  const currentPid = process.pid.toString();
  
  // 각 패턴으로 프로세스 찾기
  for (const pattern of processPatterns) {
    try {
      const result = execSync(`ps aux | grep "${pattern}" | grep -v grep | grep -v clear-next-server-process`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[1];
          const command = parts.slice(10).join(' ');
          
          // 자기 자신과 부모 프로세스는 제외
          if (pid && !isNaN(pid) && pid !== currentPid) {
            foundProcesses.push({ pid, command, pattern });
          }
        }
      }
    } catch (e) {
      // 프로세스를 찾지 못한 경우 (정상)
    }
  }
  
  if (foundProcesses.length === 0) {
    console.log('✓ Next.js 관련 프로세스가 없습니다.');
    return;
  }
  
  console.log(`발견된 프로세스 ${foundProcesses.length}개:`);
  foundProcesses.forEach(p => {
    console.log(`  - PID ${p.pid}: ${p.command.substring(0, 80)}`);
  });
  
  let needsCleanup = false;
  
  // 프로세스 종료
  for (const proc of foundProcesses) {
    try {
      // 1단계: Graceful shutdown (SIGTERM)
      console.log(`\n종료 시도: PID ${proc.pid}`);
      execSync(`kill ${proc.pid}`, { stdio: 'ignore' });
      
      // 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 프로세스가 아직 살아있는지 확인
      try {
        execSync(`kill -0 ${proc.pid}`, { stdio: 'ignore' });
        
        // 2단계: 강제 종료 (SIGKILL)
        console.warn(`⚠ PID ${proc.pid} graceful 종료 실패, 강제 종료 중...`);
        try {
          execSync(`kill -9 ${proc.pid}`, { stdio: 'ignore' });
          console.log(`✓ PID ${proc.pid} 강제 종료됨`);
          needsCleanup = true;
        } catch (killError) {
          // 프로세스가 이미 종료되었을 수 있음
          console.log(`✓ PID ${proc.pid} 종료됨`);
        }
      } catch {
        // 프로세스가 이미 종료됨
        console.log(`✓ PID ${proc.pid} gracefully 종료됨`);
      }
    } catch (error) {
      // 초기 kill 명령 실패 - 프로세스가 이미 없을 수 있음
      try {
        execSync(`kill -0 ${proc.pid}`, { stdio: 'ignore' });
        console.log(`⚠ PID ${proc.pid} 종료 실패: ${error.message}`);
      } catch {
        // 프로세스가 이미 없음
        console.log(`✓ PID ${proc.pid} 이미 종료됨`);
      }
    }
  }
  
  // 강제 종료가 발생했으면 .next 정리
  if (needsCleanup) {
    cleanNextDirectory();
  }
  
  console.log('\n✓ Next.js 프로세스 정리 완료');
}

/**
 * Windows에서 Next.js 프로세스 정리
 */
async function clearNextProcessesWindows() {
  console.log('Next.js 관련 프로세스를 찾는 중...');
  
  const processPatterns = [
    'next.cmd',
    'next dev',
    'next-server',
    'next build',
    'next start'
  ];
  
  let foundPids = new Set();
  
  // 각 패턴으로 프로세스 찾기
  for (const pattern of processPatterns) {
    try {
      const result = execSync(`wmic process where "commandline like '%${pattern}%'" get processid`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      
      const lines = result.split('\n').slice(1); // 헤더 제거
      for (const line of lines) {
        const pid = line.trim();
        if (pid && !isNaN(pid) && pid !== '0') {
          foundPids.add(pid);
        }
      }
    } catch (e) {
      // 프로세스를 찾지 못한 경우 (정상)
    }
  }
  
  if (foundPids.size === 0) {
    console.log('✓ Next.js 관련 프로세스가 없습니다.');
    return;
  }
  
  console.log(`발견된 프로세스 ${foundPids.size}개`);
  
  let needsCleanup = false;
  
  // 프로세스 종료
  for (const pid of foundPids) {
    try {
      // 1단계: Graceful shutdown
      console.log(`종료 시도: PID ${pid}`);
      execSync(`taskkill /PID ${pid}`, { 
        timeout: GRACEFUL_TIMEOUT_MS,
        stdio: 'ignore' 
      });
      console.log(`✓ PID ${pid} gracefully 종료됨`);
    } catch (error) {
      // 2단계: 강제 종료
      try {
        console.warn(`⚠ PID ${pid} graceful 종료 실패, 강제 종료 중...`);
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
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
  
  console.log('\n✓ Next.js 프로세스 정리 완료');
}

/**
 * 메인 함수
 */
async function main() {
  const platform = os.platform();
  
  console.log('='.repeat(60));
  console.log('Next.js 서버 프로세스 정리 시작');
  console.log('='.repeat(60));
  
  try {
    if (platform === 'win32') {
      await clearNextProcessesWindows();
    } else {
      await clearNextProcessesUnix();
    }
  } catch (error) {
    console.error('프로세스 정리 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 실행
main();
