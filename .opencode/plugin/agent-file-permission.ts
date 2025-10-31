import type { Plugin } from "@opencode-ai/plugin"
import type { AssistantMessage } from "@opencode-ai/sdk"

const wildcardMatch = (str: string, pattern: string): boolean => {
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".")
    + "$",
    "s",
  )
  return regex.test(str)
}

// Wildcard.all 로직 - 가장 구체적인(긴) 패턴이 우선
const wildcardAll = (input: string, patterns: Record<string, any>): any => {
  const sorted = Object.entries(patterns).sort((a, b) => {
    if (a[0].length !== b[0].length) {
      return a[0].length - b[0].length
    }
    return a[0].localeCompare(b[0])
  })
  
  let result = undefined
  let matchedPattern: string | undefined = undefined
  for (const [pattern, value] of sorted) {
    if (wildcardMatch(input, pattern)) {
      result = value
      matchedPattern = pattern
    }
  }
  return { result, pattern: matchedPattern }
}

export const FilePermissionPlugin: Plugin = async ({ client, directory, worktree }) => {
  const agentFilePermissions = {
    "kiwi": {
      deny: [".opencode/**", ".codekiwi/tasks.yaml", "src/app/codekiwi-dashboard/**", "src/app/actions/**", "src/domain/**", "src/lib/shared/database/**", "src/auth.ts", "src/middleware.ts", "src/app/api/**", "src/app/login/page.tsx", "src/app/signup/page.tsx", "src/components/auth/**"],
      allow: ["*"]
    },
    "build-prototype": {
      deny: [".opencode/**", ".codekiwi/tasks.yaml", "src/app/codekiwi-dashboard/**", "src/app/actions/**", "src/domain/**", "src/lib/shared/database/**", "src/auth.ts", "src/middleware.ts", "src/app/api/**", "src/app/login/page.tsx", "src/app/signup/page.tsx", "src/components/auth/**"],
      allow: ["*"]
    },
    "codie": {
      deny: [".opencode/**", ".codekiwi/tasks.yaml", "src/app/codekiwi-dashboard/**"],
      allow: ["*"]
    },
    "init": {
      deny: [".opencode/**", ".codekiwi/tasks.yaml", "src/app/codekiwi-dashboard/**", "src/app/actions/**", "src/domain/**", "src/lib/shared/database/**", "src/auth.ts", "src/middleware.ts", "src/app/api/**", "src/app/login/page.tsx", "src/app/signup/page.tsx", "src/components/auth/**"],
      allow: ["*"]
    }
  }

  // 공통 로직을 함수로 분리
  const checkFilePermission = async (filePath: string, sessionID: string) => {
    // 현재 세션의 메시지들을 가져와서 agent 확인
    const messagesResult = await client.session.messages({
      path: { id: sessionID }
    })
    if (messagesResult.error) return null

    const messages = messagesResult.data
    const assistantMessages = messages.filter((m) => m.info.role === "assistant")
    const currentMessage = assistantMessages[assistantMessages.length - 1]
    
    let agent = "build"
    if (currentMessage && currentMessage.info.role === "assistant") {
      agent = (currentMessage.info as AssistantMessage).mode
    }

    const rules = agentFilePermissions[agent]
    if (!rules || (!rules.deny && !rules.allow)) return null

    const relativePath = filePath
      .replace(worktree + "/", "")
      .replace(worktree + "\\", "")
      .replace(directory + "/", "")
      .replace(directory + "\\", "")
      .replace(/\\/g, "/")

    // 모든 패턴을 하나의 Record로 합치기
    const allPatterns: Record<string, "allow" | "deny"> = {}
    
    if (rules.deny) {
      const denyPatterns = Array.isArray(rules.deny) ? rules.deny : [rules.deny]
      for (const pattern of denyPatterns) {
        allPatterns[pattern] = "deny"
      }
    }
    
    if (rules.allow) {
      const allowPatterns = Array.isArray(rules.allow) ? rules.allow : [rules.allow]
      for (const pattern of allowPatterns) {
        allPatterns[pattern] = "allow"
      }
    }

    const { result: decision, pattern: matchedPattern } = wildcardAll(relativePath, allPatterns)
    
    return {
      agent,
      decision,
      matchedPattern,
      relativePath,
      denyPatterns: rules.deny 
        ? (Array.isArray(rules.deny) ? rules.deny : [rules.deny])
        : [],
      allowPatterns: rules.allow
        ? (Array.isArray(rules.allow) ? rules.allow : [rules.allow])
        : []
    }
  }

  return {
    // ✅ permission.ask: allow 패턴 자동 승인
    "permission.ask": async (input, output) => {
      if (input.type !== "edit" && input.type !== "write") {
        return
      }

      const filePath = input.metadata?.filePath as string | undefined
      if (!filePath) return

      const result = await checkFilePermission(filePath, input.sessionID)
      if (!result) return

      if (result.decision === "allow") {
        // ✅ allow 패턴에 걸리면 자동으로 승인
        output.status = "allow"
        return
      }
    },

    // 🚫 tool.execute.before: deny 패턴 상세하게 차단
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }

      const filePath = output.args.filePath as string | undefined
      if (!filePath) return

      const result = await checkFilePermission(filePath, input.sessionID)
      if (!result) return

      if (result.decision === "deny") {
        const errorMessage = 
          `According to the agent's rules, file editing is denied for agent '${result.agent}'.\n\n` +
          `File: ${result.relativePath}\n` +
          `Matched deny pattern: '${result.matchedPattern}'\n\n` +
          `It is not desirable to edit files that match this pattern.\n\n` +
          `All restricted patterns for this agent:\n${result.denyPatterns.map(p => `  - ${p}`).join('\n')}\n\n` +
          (result.allowPatterns.length > 0 
            ? `You CAN edit files matching these patterns:\n${result.allowPatterns.map(p => `  - ${p}`).join('\n')}\n\n`
            : '') +
          `Please choose a different file or request permission from the user.`

        throw new Error(errorMessage)
      }
    }
  }
}