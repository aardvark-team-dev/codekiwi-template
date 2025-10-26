import type { Plugin } from "@opencode-ai/plugin"

// diagnostics 버그 대응
export const EditDiagnosticsPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit") {
        return
      }

      // metadata에서 diagnostics 확인
      const diagnostics = output.metadata?.diagnostics
      if (!diagnostics) {
        return
      }

      // output에서 진단 찾기
      const emptyDiagnosticsMatch = output.output.match(
        /This file has errors, please fix\n<file_diagnostics>\s*<\/file_diagnostics>/
      )

      if (emptyDiagnosticsMatch) {
        // 비어있는 진단을 교체
        output.output = output.output.replace(
          /\nThis file has errors, please fix\n<file_diagnostics>\s*<\/file_diagnostics>\n/g,
          '\n✓ File edited successfully. No critical errors found (only warnings/hints).\n'
        )
      }
    },
  }
}