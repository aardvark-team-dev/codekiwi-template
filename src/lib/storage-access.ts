/**
 * Storage Access API 유틸리티
 * 
 * cross-origin iframe 환경에서 서드파티 쿠키 접근을 위한 헬퍼 함수들
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API
 */

/**
 * 브라우저가 Storage Access API를 지원하는지 확인
 */
export function isStorageAccessAPISupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    'hasStorageAccess' in document &&
    'requestStorageAccess' in document
  )
}

/**
 * 현재 컨텍스트가 iframe 내부인지 확인
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false
  return window.self !== window.top
}

/**
 * 이미 Storage Access 권한이 부여되었는지 확인
 */
export async function hasStorageAccess(): Promise<boolean> {
  if (!isStorageAccessAPISupported()) {
    // API를 지원하지 않는 브라우저는 기본적으로 접근 가능하다고 가정
    return true
  }

  try {
    return await document.hasStorageAccess()
  } catch (error) {
    console.warn('hasStorageAccess 확인 실패:', error)
    return false
  }
}

/**
 * iframe 내에서 Storage Access API를 사용하여 쿠키 접근 권한 요청
 * 
 * ⚠️ 주의: 이 함수는 반드시 사용자 인터랙션(클릭 등) 내에서 호출되어야 합니다.
 * 
 * @returns 권한 부여 성공 여부
 */
export async function requestStorageAccessIfNeeded(): Promise<boolean> {
  // iframe이 아닌 경우 권한 요청 불필요
  if (!isInIframe()) {
    return true
  }

  // Storage Access API를 지원하지 않는 경우
  if (!isStorageAccessAPISupported()) {
    console.warn('Storage Access API를 지원하지 않는 브라우저입니다.')
    return true // 구형 브라우저는 기본적으로 쿠키 접근 가능
  }

  try {
    // 이미 권한이 있는지 확인
    const hasAccess = await document.hasStorageAccess()
    if (hasAccess) {
      console.log('✅ 이미 쿠키 접근 권한이 있습니다.')
      return true
    }

    // 권한 요청 (사용자 인터랙션 필요)
    console.log('🔑 쿠키 접근 권한을 요청합니다...')
    await document.requestStorageAccess()
    console.log('✅ 쿠키 접근 권한이 승인되었습니다.')
    return true
  } catch (error: any) {
    // NotAllowedError: iframe 샌드박스 제한 또는 브라우저 정책으로 거부됨
    // e2b 같은 동적 iframe 환경에서는 예상되는 동작
    console.warn('⚠️ Storage Access API 실패:', error?.name || error?.message || error)
    console.info(
      '→ partitioned 쿠키로 로그인을 시도합니다.\n' +
      '  (Chrome/Edge의 CHIPS를 통해 작동하며, e2b iframe 환경에서는 정상적인 동작입니다)'
    )
    
    // sameSite=none + secure=true + partitioned=true 설정이 있으므로
    // API 없이도 쿠키가 작동할 수 있음 (특히 Chrome/Edge의 CHIPS)
    // 실제로 쿠키가 작동하지 않으면 NextAuth가 알아서 에러 처리
    return true
  }
}

/**
 * Storage Access 상태 정보를 반환
 */
export async function getStorageAccessStatus(): Promise<{
  isInIframe: boolean
  isSupported: boolean
  hasAccess: boolean
}> {
  return {
    isInIframe: isInIframe(),
    isSupported: isStorageAccessAPISupported(),
    hasAccess: await hasStorageAccess(),
  }
}

