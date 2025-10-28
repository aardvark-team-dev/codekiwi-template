// .opencode/plugin/auto-background.ts
import type { Plugin } from "@opencode-ai/plugin"

export default (async ({ $ }) => {
  return {
    async "tool.execute.before"(input, output) {
      // bash tool만 처리
      if (input.tool !== "bash") return
      
      const command = output.args.command as string
      
      // npm run dev가 포함된 경우 감지 (체이닝, 세미콜론, 파이프 포함)
      const longRunningPatterns = [
        /npm\s+run\s+dev(\s|$)/,  // dev 뒤에 공백이나 끝
      ]
      
      const isLongRunning = longRunningPatterns.some(pattern => 
        pattern.test(command.trim())
      )
      
      if (isLongRunning) {
        const isWindows = process.platform === "win32"
        
        // 플랫폼에 맞게 백그라운드 명령어로 변환
        if (isWindows) {
          output.args.command = `start /B cmd /c "npm run dev"`
        } else {
          // macOS/Linux
          output.args.command = `npm run dev &`
        }
      }
    }
  }
}) satisfies Plugin