// .opencode/plugin/auto-background.ts
import type { Plugin } from "@opencode-ai/plugin"

export default (async ({ $ }) => {
  return {
    async "tool.execute.before"(input, output) {
      // bash tool만 처리
      if (input.tool !== "bash") return
      
      const command = output.args.command as string
      
      // 장시간 실행될 것 같은 명령어 감지
      // npm run dev가 포함된 경우 감지 (체이닝, 세미콜론, 파이프 포함)
      const longRunningPatterns = [
        /npm\s+run\s+dev(\s|$)/,  // dev 뒤에 공백이나 끝
      ]
      
      const isLongRunning = longRunningPatterns.some(pattern => 
        pattern.test(command.trim())
      )
      
      if (isLongRunning) {
        const isWindows = process.platform === "win32"
        
        // 이미 백그라운드 명령어로 시작하면 스킵
        if (isWindows && command.startsWith("start ")) return
        if (!isWindows && command.endsWith(" &")) return
        
        // 플랫폼에 맞게 백그라운드 명령어로 변환
        if (isWindows) {
          // Windows에서 체이닝된 명령어는 cmd /c로 감싸야 함
          output.args.command = `start /B cmd /c "${command}"`
        } else {
          // macOS/Linux
          output.args.command = `${command} &`
        }
      }
    }
  }
}) satisfies Plugin