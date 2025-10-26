import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import * as fs from "fs/promises"
import * as yaml from "yaml"
import * as path from "path"

// ============ Types ============

/**
 * Acceptance Criteria (확정된 요구사항)
 * - description: 요구사항 설명
 * - acRisk: 이 요구사항이 가진 복잡도 (≥ 0) [optional: 사용자가 최초 입력 시 비워둘 수 있음]
 */
export type AcceptanceCriteria = {
  description: string
  acRisk?: number
}

/**
 * Acceptance Criteria Candidate (불확실성의 선택지)
 * - description: 선택지 설명
 * - acRiskIfSelected: 이 선택지를 선택했을 때의 복잡도 (≥ 0) [optional: 사용자가 최초 입력 시 비워둘 수 있음]
 */
export type AcCandidate = {
  description: string
  acRiskIfSelected?: number
  pros?: string[]
  cons?: string[]
}

/**
 * Uncertainty (불확실성)
 * - description: 불확실성에 대한 설명
 * - uncertRisk: 이 불확실성의 위험도 = max(acRiskIfSelected for all candidates) [optional: 계산 불가능한 경우 undefined]
 * - acCandidates: 선택 가능한 후보들 [optional: 사용자가 최초 입력 시 비워둘 수 있음]
 */
export type Uncertainty = {
  description: string
  uncertRisk?: number
  acCandidates?: AcCandidate[]
}

/**
 * Task (작업 항목)
 * - title: 작업 제목
 * - userStoryId: 고유 ID
 * - userStory: 사용자 스토리
 * - acceptanceCriteria: 확정된 요구사항들
 * - uncertainties: 아직 해결되지 않은 불확실성들 [optional: 사용자 최초 입력 시 비워둘 수 있음]
 * - risk: 전체 복잡도 = min(sum(acRisk) + sum(uncertRisk), 1.0) [optional: 계산 불가능한 경우 undefined]
 * - priority: P0, P1, P2 [optional: 사용자 최초 입력 시 비워둘 수 있음]
 * - dependencies: 의존하는 다른 작업 ID들 [optional: 사용자 최초 입력 시 비워둘 수 있음]
 * - status: "개발 전", "개발 중", "개발 완료"
 * - isInitialTask: 최초 생성 시 true, 버그 확률 산정 전 [optional]
 */
export type Task = {
  title: string
  userStoryId: string
  userStory: string
  acceptanceCriteria: AcceptanceCriteria[]
  uncertainties?: Uncertainty[]
  risk?: number
  priority?: "P0" | "P1" | "P2"
  dependencies?: string[]
  status: "개발 전" | "개발 중" | "개발 완료"
  isInitialTask?: boolean
}

// ============ Helpers ============

const TASKS_YAML_PATH = path.join(process.cwd(), ".codekiwi", "tasks.yaml")

async function readTasks(): Promise<Task[]> {
  const content = await fs.readFile(TASKS_YAML_PATH, "utf-8")
  const parsed = yaml.parse(content)
  return Array.isArray(parsed) ? parsed : []
}

async function writeTasks(tasks: Task[]): Promise<void> {
  const content = yaml.stringify(tasks)
  await fs.writeFile(TASKS_YAML_PATH, content, "utf-8")
}

function calculateRisk(task: Task): number | undefined {
  // acRisk 중 하나라도 undefined면 계산 불가능
  if (task.acceptanceCriteria.some(ac => ac.acRisk === undefined)) {
    return undefined
  }
  
  // uncertainties가 있는 경우, uncertRisk 중 하나라도 undefined면 계산 불가능
  if (task.uncertainties && task.uncertainties.some(uncert => uncert.uncertRisk === undefined)) {
    return undefined
  }
  
  const acRiskSum = task.acceptanceCriteria.reduce((sum, ac) => sum + (ac.acRisk || 0), 0)
  const uncertRiskSum = (task.uncertainties || []).reduce((sum, uncert) => sum + (uncert.uncertRisk || 0), 0)
  const totalRisk = acRiskSum + uncertRiskSum
  const cappedRisk = Math.min(totalRisk, 1.0)  // Cap at 1.0 (100% bug probability)
  return Math.round(cappedRisk * 100) / 100  // Round to 2 decimal places
}

function calculateUncertRisk(acCandidates: AcCandidate[]): number | undefined {
  // acCandidates가 없거나 비어있으면 계산 불가능
  if (!acCandidates || acCandidates.length === 0) {
    return undefined
  }
  
  // acRiskIfSelected 중 하나라도 undefined면 계산 불가능
  if (acCandidates.some(c => c.acRiskIfSelected === undefined)) {
    return undefined
  }
  
  const maxRisk = Math.max(...acCandidates.map(c => c.acRiskIfSelected!), 0)
  return Math.round(maxRisk * 100) / 100  // Round to 2 decimal places
}

// ============ Tools ============

/**
 * resolveUncertainty
 * 
 * 불확실성을 해소하는 도구
 * - userStoryId로 task를 찾고
 * - uncertaintyIndex로 불확실성을 찾고
 * - candidateIndex로 선택된 후보를 찾아
 * - 불확실성을 삭제하고, 선택된 후보를 acceptanceCriteria에 추가
 * - risk를 재계산
 */
export const resolveUncertainty = tool({
  description: "불확실성을 해소하고 선택된 후보를 acceptanceCriteria로 추가합니다. risk가 자동으로 재계산됩니다.",
  args: {
    userStoryId: z.string().describe("작업의 userStoryId (예: US-001)"),
    uncertaintyIndex: z.number().int().min(0).describe("해소할 불확실성의 인덱스 (0부터 시작)"),
    candidateIndex: z.number().int().min(0).describe("선택된 후보의 인덱스 (0부터 시작)"),
  },
  async execute(args) {
    const tasks = await readTasks()
    const taskIndex = tasks.findIndex(t => t.userStoryId === args.userStoryId)
    
    if (taskIndex === -1) {
      return `오류: ${args.userStoryId}를 찾을 수 없습니다.`
    }

    const task = tasks[taskIndex]
    
    if (!task.uncertainties || args.uncertaintyIndex >= task.uncertainties.length) {
      return `오류: 불확실성 인덱스 ${args.uncertaintyIndex}가 유효하지 않습니다.`
    }

    const uncertainty = task.uncertainties[args.uncertaintyIndex]
    
    if (!uncertainty.acCandidates || args.candidateIndex >= uncertainty.acCandidates.length) {
      return `오류: 후보 인덱스 ${args.candidateIndex}가 유효하지 않습니다.`
    }

    const selectedCandidate = uncertainty.acCandidates[args.candidateIndex]

    // 불확실성 삭제
    task.uncertainties.splice(args.uncertaintyIndex, 1)

    // acceptanceCriteria에 추가
    if (!task.acceptanceCriteria) {
      task.acceptanceCriteria = []
    }
    task.acceptanceCriteria.push({
      description: selectedCandidate.description,
      acRisk: selectedCandidate.acRiskIfSelected,
    })

    // risk 재계산
    task.risk = calculateRisk(task)

    tasks[taskIndex] = task
    await writeTasks(tasks)

    return `성공: "${selectedCandidate.description}"를 acceptanceCriteria에 추가했습니다. 새로운 risk: ${task.risk}`
  },
})

/**
 * addTask
 * 
 * 새로운 작업을 추가하는 도구
 * - 구조화된 입력을 받아 tasks.yaml에 추가
 * - agent가 yaml 구조를 직접 변경하지 못하도록 가드레일 역할
 */
export const addTask = tool({
  description: "새로운 작업을 tasks.yaml에 추가합니다. Agent는 모든 필드를 완전히 채워야 합니다.",
  args: {
    title: z.string().describe("작업 제목"),
    userStoryId: z.string().describe("고유 ID (예: US-007)"),
    userStory: z.string().describe("[사용자]로서, [목적]을 위해 [기능]을 할 수 있다."),
    acceptanceCriteria: z.array(z.object({
      description: z.string(),
      acRisk: z.number().min(0).optional().describe("복잡도 (≥ 0). Agent는 반드시 이 값을 채워야 합니다."),
    })).describe("확정된 요구사항들"),
    uncertainties: z.array(z.object({
      description: z.string(),
      acCandidates: z.array(z.object({
        description: z.string(),
        acRiskIfSelected: z.number().min(0).optional().describe("선택 시 복잡도 (≥ 0). Agent는 반드시 이 값을 채워야 합니다."),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      })).optional().describe("선택지들. Agent는 반드시 이 배열을 채워야 합니다."),
    })).optional().describe("불확실성들. Agent는 반드시 이 배열을 제공해야 합니다 (불확실성이 없어도 빈 배열 [])"),
    priority: z.enum(["P0", "P1", "P2"]).describe("우선순위. Agent는 반드시 이 값을 제공해야 합니다."),
    dependencies: z.array(z.string()).optional().describe("의존하는 작업 ID들. Agent는 반드시 이 배열을 제공해야 합니다 (의존성이 없어도 빈 배열 [])"),
  },
  async execute(args) {
    const tasks = await readTasks()

    // userStoryId 중복 체크
    if (tasks.some(t => t.userStoryId === args.userStoryId)) {
      return `오류: ${args.userStoryId}는 이미 존재합니다.`
    }

    // uncertainties의 uncertRisk 계산
    const uncertainties: Uncertainty[] = (args.uncertainties || []).map(u => ({
      description: u.description,
      uncertRisk: u.acCandidates ? calculateUncertRisk(u.acCandidates) : undefined,
      acCandidates: u.acCandidates,
    }))

    const newTask: Task = {
      title: args.title,
      userStoryId: args.userStoryId,
      userStory: args.userStory,
      acceptanceCriteria: args.acceptanceCriteria,
      uncertainties: uncertainties.length > 0 ? uncertainties : undefined,
      risk: undefined, // 아래에서 계산됨
      priority: args.priority,
      dependencies: args.dependencies && args.dependencies.length > 0 ? args.dependencies : undefined,
      status: "개발 전",
    }

    // risk 계산
    newTask.risk = calculateRisk(newTask)

    tasks.push(newTask)
    await writeTasks(tasks)

    return `성공: ${args.userStoryId} "${args.title}"를 추가했습니다. risk: ${newTask.risk}`
  },
})

/**
 * editTask
 * 
 * 기존 작업을 수정하는 도구
 * - userStoryId로 작업을 찾아 필드를 업데이트
 * - acceptanceCriteria나 uncertainties 수정 시 risk 자동 재계산
 */
export const editTask = tool({
  description: "기존 작업을 수정합니다. acceptanceCriteria나 uncertainties 수정 시 risk가 자동으로 재계산됩니다.",
  args: {
    userStoryId: z.string().describe("수정할 작업의 userStoryId"),
    title: z.string().optional().describe("새 제목"),
    userStory: z.string().optional().describe("새 사용자 스토리"),
    acceptanceCriteria: z.array(z.object({
      description: z.string(),
      acRisk: z.number().min(0).optional().describe("복잡도 (≥ 0). Agent는 반드시 이 값을 채워야 합니다."),
    })).optional().describe("새 acceptanceCriteria (전체 대체)"),
    uncertainties: z.array(z.object({
      description: z.string(),
      acCandidates: z.array(z.object({
        description: z.string(),
        acRiskIfSelected: z.number().min(0).optional().describe("선택 시 복잡도 (≥ 0). Agent는 반드시 이 값을 채워야 합니다."),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      })).optional().describe("선택지들. Agent는 반드시 이 배열을 채워야 합니다."),
    })).optional().describe("새 uncertainties (전체 대체)"),
    priority: z.enum(["P0", "P1", "P2"]).optional().describe("새 우선순위"),
    dependencies: z.array(z.string()).optional().describe("새 의존성 목록 (전체 대체)"),
    status: z.enum(["개발 전", "개발 중", "개발 완료"]).optional().describe("새 상태"),
  },
  async execute(args) {
    const tasks = await readTasks()
    const taskIndex = tasks.findIndex(t => t.userStoryId === args.userStoryId)

    if (taskIndex === -1) {
      return `오류: ${args.userStoryId}를 찾을 수 없습니다.`
    }

    const task = tasks[taskIndex]

    // 필드 업데이트
    if (args.title !== undefined) task.title = args.title
    if (args.userStory !== undefined) task.userStory = args.userStory
    if (args.priority !== undefined) task.priority = args.priority
    if (args.dependencies !== undefined) task.dependencies = args.dependencies
    if (args.status !== undefined) task.status = args.status

    if (args.acceptanceCriteria !== undefined) {
      task.acceptanceCriteria = args.acceptanceCriteria
    }

    if (args.uncertainties !== undefined) {
      task.uncertainties = args.uncertainties.map(u => ({
        description: u.description,
        uncertRisk: u.acCandidates ? calculateUncertRisk(u.acCandidates) : undefined,
        acCandidates: u.acCandidates,
      }))
    }

    // status가 "개발 완료"로 변경되면 모든 risk를 0으로 설정
    if (args.status === "개발 완료") {
      // 모든 acceptanceCriteria의 acRisk를 0으로
      task.acceptanceCriteria = task.acceptanceCriteria.map(ac => ({
        ...ac,
        acRisk: 0,
      }))

      // 개발 완료 시 불확실성은 모두 해소되므로 undefined로 설정
      task.uncertainties = undefined
    }

    // risk 재계산
    task.risk = calculateRisk(task)

    // isInitialTask 필드 제거 (editTask 호출 시 항상 삭제)
    delete task.isInitialTask

    tasks[taskIndex] = task
    await writeTasks(tasks)

    return `성공: ${args.userStoryId}를 수정했습니다. 새로운 risk: ${task.risk}`
  },
})

