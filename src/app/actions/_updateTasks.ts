// src/app/actions/updateTasks.ts
'use server'

import fs from 'fs/promises'
import path from 'path'
import { parse } from 'yaml'

export async function updateTasksYaml(yamlText: string) {
  const filePath = path.join(process.cwd(), '.codekiwi', 'tasks.yaml')
  
  try {
    // YAML 유효성 검사 (파싱만 하고 결과는 사용하지 않음)
    parse(yamlText)
    
    // 유효성 검사 통과하면 입력받은 텍스트 그대로 저장
    await fs.writeFile(filePath, yamlText, 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Failed to update tasks.yaml:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `YAML 형식 오류: ${errorMessage}` }
  }
}


export async function checkTasksYamlExists() {
  const filePath = path.join(process.cwd(), '.codekiwi', 'tasks.yaml')
  
  try {
    const content = await fs.readFile(filePath, 'utf8')
    // 파일이 존재하고 내용이 있으면 true (공백/개행만 있어도 false)
    return { exists: content.trim().length > 0 }
  } catch {
    // 파일이 없거나 읽기 실패하면 false
    return { exists: false }
  }
}