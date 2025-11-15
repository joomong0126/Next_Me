/**
 * 값을 항상 string[] 배열로 정규화하는 유틸 함수
 * Supabase의 text[] 타입 컬럼에 값을 전송할 때 사용
 * 
 * @param value - 정규화할 값 (string | string[] | null | undefined)
 * @returns string[] 배열 (null/undefined인 경우 빈 배열 반환)
 * 
 * @example
 * normalizeToArray("프론트엔드 개발자") // ["프론트엔드 개발자"]
 * normalizeToArray(["프론트엔드 개발자", "백엔드 개발자"]) // ["프론트엔드 개발자", "백엔드 개발자"]
 * normalizeToArray(null) // []
 * normalizeToArray(undefined) // []
 */
export function normalizeToArray(value: string | string[] | null | undefined): string[] {
  // null 또는 undefined인 경우 빈 배열 반환
  if (value === null || value === undefined) {
    return [];
  }

  // 이미 배열인 경우 그대로 반환
  if (Array.isArray(value)) {
    return value;
  }

  // 문자열인 경우 배열로 감싸서 반환
  if (typeof value === 'string') {
    // 빈 문자열인 경우 빈 배열 반환
    if (value.trim() === '') {
      return [];
    }
    // 쉼표로 구분된 문자열인 경우 분리 (예: "React, TypeScript, Node.js")
    if (value.includes(',')) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    // 줄바꿈으로 구분된 문자열인 경우 분리 (예: "개발 효율 30% 증가\n성과2")
    if (value.includes('\n')) {
      return value.split('\n').map((item) => item.trim()).filter(Boolean);
    }
    // 단일 문자열인 경우 배열로 감싸서 반환
    return [value];
  }

  // 그 외의 경우 빈 배열 반환 (안전장치)
  return [];
}

