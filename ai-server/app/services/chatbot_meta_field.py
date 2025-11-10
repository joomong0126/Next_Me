## 프로젝트 메타데이터 챗봇 AI
## file_analysis.py를 통해 분석된 메타데이터를 기반으로 대화를 통해 보완하는 챗봇

import os
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from openai import OpenAI

# .env 파일 로드
load_dotenv(verbose=True)

# OpenAI API 키 확인
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.")

client = OpenAI(api_key=openai_api_key)

# 필드별 한글 이름 매핑
FIELD_NAMES = {
    "title": "프로젝트 제목",
    "category": "프로젝트 카테고리",
    "tags": "태그",
    "roles": "역할",
    "achievements": "주요 성과",
    "tools": "사용된 기술/도구",
    "description": "상세 설명"
}

# 완료를 나타내는 키워드
COMPLETION_KEYWORDS = ["완료", "저장", "끝", "종료", "done", "save", "finish", "complete"]

# 확인을 나타내는 키워드
CONFIRMATION_KEYWORDS = ["맞아", "네", "예", "ok", "okay", "좋아", "맞아요", "네요", "예요", "그래", "그래요", "확인", "yes", "y"]

def find_null_fields(metadata: Dict[str, Any]) -> List[str]:
    """메타데이터에서 null 값인 필드를 찾습니다."""
    null_fields = []
    project = metadata.get("project", {})
    
    # 단일 값 필드 확인
    for field in ["title", "category", "description"]:
        if project.get(field) is None or project.get(field) == "":
            null_fields.append(field)
    
    # 배열 필드 확인 (빈 배열도 null로 간주)
    for field in ["tags", "roles", "achievements", "tools"]:
        value = project.get(field, [])
        if not value or len(value) == 0:
            null_fields.append(field)
    
    return null_fields

def is_completion_request(user_message: str) -> bool:
    """사용자 메시지가 완료 요청인지 확인합니다."""
    if not user_message:
        return False
    message_lower = user_message.strip().lower()
    return any(keyword in message_lower for keyword in COMPLETION_KEYWORDS)

def is_confirmation(user_message: str) -> bool:
    """사용자 메시지가 확인 응답인지 확인합니다."""
    if not user_message:
        return False
    message_lower = user_message.strip().lower()
    return any(keyword in message_lower for keyword in CONFIRMATION_KEYWORDS)

def format_metadata_summary(metadata: Dict[str, Any]) -> str:
    """메타데이터를 요약 형식으로 포맷팅합니다."""
    project = metadata.get("project", {})
    summary_parts = []
    
    if project.get("title"):
        summary_parts.append(f"제목: {project['title']}")
    if project.get("category"):
        summary_parts.append(f"카테고리: {project['category']}")
    if project.get("tags") and len(project["tags"]) > 0:
        summary_parts.append(f"태그: {', '.join(project['tags'])}")
    if project.get("roles") and len(project["roles"]) > 0:
        summary_parts.append(f"역할: {', '.join(project['roles'])}")
    if project.get("achievements") and len(project["achievements"]) > 0:
        summary_parts.append(f"주요 성과: {', '.join(project['achievements'])}")
    if project.get("tools") and len(project["tools"]) > 0:
        summary_parts.append(f"사용 기술/도구: {', '.join(project['tools'])}")
    if project.get("description"):
        summary_parts.append(f"상세 설명: {project['description']}")
    
    return "\n".join(summary_parts) if summary_parts else "아직 입력된 정보가 없습니다."

def extract_and_update_metadata_with_llm(
    metadata: Dict[str, Any],
    user_message: str,
    conversation_history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """LLM을 사용하여 사용자 메시지에서 메타데이터를 추출하고 업데이트합니다."""
    try:
        project = metadata.get("project", {})
        current_metadata_str = json.dumps(project, ensure_ascii=False, indent=2)
        
        # 대화 히스토리 요약
        history_summary = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in conversation_history[-3:]  # 최근 3개만
        ])
        
        prompt = f"""당신은 프로젝트 메타데이터를 대화를 통해 정리하는 AI입니다.

현재 메타데이터 상태:
{current_metadata_str}

최근 대화:
{history_summary}

사용자 메시지: {user_message}

사용자의 메시지를 분석하여 다음 정보를 추출하고 업데이트하세요:
- title: 프로젝트 제목
- category: 프로젝트 카테고리 (예: 웹 개발, 앱 개발, 데이터 분석 등)
- tags: 태그 (배열)
- roles: 역할 (배열)
- achievements: 주요 성과 (배열)
- tools: 사용된 기술/도구 (배열)
- description: 상세 설명

사용자가 불완전한 정보를 제공했거나 기억이 안 난다고 하면, 대화를 통해 자연스럽게 추가 정보를 물어보세요.
사용자가 "이걸 기반으로 정리해줘야지" 같은 요청을 하면, 제공된 정보를 바탕으로 메타데이터를 정리하세요.

JSON 형식으로 응답하세요:
{{
  "updated_metadata": {{
    "title": "업데이트된 제목 또는 null",
    "category": "업데이트된 카테고리 또는 null",
    "tags": ["태그1", "태그2"] 또는 [],
    "roles": ["역할1"] 또는 [],
    "achievements": ["성과1"] 또는 [],
    "tools": ["도구1"] 또는 [],
    "description": "업데이트된 설명 또는 null"
  }},
  "response_message": "사용자에게 자연스럽게 대화를 이어갈 수 있는 메시지",
  "needs_more_info": true/false (추가 정보가 필요한지 여부)
}}

기존 값이 있으면 유지하되, 새로운 정보가 제공되면 업데이트하세요."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # 메타데이터 업데이트 (null이 아닌 값만 업데이트)
        updated_metadata = json.loads(json.dumps(metadata))
        project = updated_metadata.get("project", {})
        
        llm_metadata = result.get("updated_metadata", {})
        
        for field, value in llm_metadata.items():
            if value is not None:
                if isinstance(value, list) and len(value) > 0:
                    # 배열 필드: 기존 값과 병합 (중복 제거)
                    existing = set(project.get(field, []))
                    new_values = set(value)
                    project[field] = list(existing | new_values)
                elif not isinstance(value, list) and value != "":
                    # 단일 값 필드
                    project[field] = value
        
        updated_metadata["project"] = project
        
        return {
            "updated_metadata": updated_metadata,
            "response_message": result.get("response_message", ""),
            "needs_more_info": result.get("needs_more_info", False)
        }
        
    except Exception as e:
        print(f"메타데이터 추출 오류: {str(e)}")
        return {
            "updated_metadata": metadata,
            "response_message": "죄송합니다. 이해하지 못했습니다. 다시 말씀해주실 수 있을까요?",
            "needs_more_info": True
        }

def generate_conversational_response(
    metadata: Dict[str, Any],
    user_message: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """LLM을 사용하여 자연스러운 대화형 응답을 생성합니다."""
    if conversation_history is None:
        conversation_history = []
    
    # 완료 요청 확인
    if user_message and is_completion_request(user_message):
        null_fields = find_null_fields(metadata)
        if len(null_fields) == 0:
            # 모든 필드가 채워짐 - 최종 확인
            final_summary = format_metadata_summary(metadata)
            return {
                "message": f"좋아요! 지금까지 정리한 내용을 보면:\n\n{final_summary}\n\n이렇게 업데이트 해도 될까요? (맞으면 '네' 또는 '완료', 수정이 필요하면 수정할 내용을 알려주세요)",
                "updated_metadata": metadata,
                "status": "final_confirmation"
            }
        else:
            # 아직 빈 필드가 있지만 사용자가 완료를 원함
            final_summary = format_metadata_summary(metadata)
            return {
                "message": f"지금까지 정리한 내용:\n\n{final_summary}\n\n이렇게 업데이트 해도 될까요? (맞으면 '네' 또는 '완료', 수정이 필요하면 수정할 내용을 알려주세요)",
                "updated_metadata": metadata,
                "status": "final_confirmation"
            }
    
    # 사용자 메시지가 있는 경우 - LLM으로 메타데이터 추출 및 업데이트
    if user_message:
        result = extract_and_update_metadata_with_llm(
            metadata,
            user_message,
            conversation_history
        )
        
        updated_metadata = result["updated_metadata"]
        response_message = result["response_message"]
        needs_more_info = result["needs_more_info"]
        
        # 추가 정보가 필요하고 사용자가 확인을 요청하지 않은 경우
        if needs_more_info and not is_confirmation(user_message):
            return {
                "message": response_message,
                "updated_metadata": updated_metadata,
                "status": "conversing"
            }
        else:
            # 정보가 충분하거나 확인 요청인 경우
            null_fields = find_null_fields(updated_metadata)
            if len(null_fields) == 0:
                # 모든 필드가 채워짐
                final_summary = format_metadata_summary(updated_metadata)
                return {
                    "message": f"{response_message}\n\n그리고 지금까지 정리한 내용을 보면:\n\n{final_summary}\n\n이렇게 업데이트 해도 될까요?",
                    "updated_metadata": updated_metadata,
                    "status": "final_confirmation"
                }
            else:
                # 아직 빈 필드가 있음
                return {
                    "message": response_message,
                    "updated_metadata": updated_metadata,
                    "status": "conversing"
                }
    else:
        # 첫 메시지 - 빈 필드에 대해 질문
        null_fields = find_null_fields(metadata)
        if len(null_fields) == 0:
            # 모든 필드가 채워짐
            final_summary = format_metadata_summary(metadata)
            return {
                "message": f"좋아요! 지금까지 정리한 내용을 보면:\n\n{final_summary}\n\n이렇게 업데이트 해도 될까요?",
                "updated_metadata": metadata,
                "status": "final_confirmation"
            }
        else:
            # 첫 번째 빈 필드에 대해 자연스럽게 질문
            target_field = null_fields[0]
            field_name = FIELD_NAMES.get(target_field, target_field)
            
            questions = {
                "title": "안녕하세요! 이 프로젝트에 대해 알려주세요. 먼저 프로젝트 제목이 무엇인가요?",
                "category": "이 프로젝트는 어떤 카테고리에 속하나요?",
                "tags": "이 프로젝트와 관련된 키워드나 태그가 있나요?",
                "roles": "이 프로젝트에서 맡으신 역할이 무엇이었나요?",
                "achievements": "이 프로젝트에서 달성한 주요 성과가 있나요?",
                "tools": "이 프로젝트에서 사용하신 기술이나 도구가 무엇인가요?",
                "description": "이 프로젝트에 대해 자세히 설명해주세요."
            }
            
            return {
                "message": questions.get(target_field, f"{field_name}에 대해 알려주세요."),
                "updated_metadata": metadata,
                "status": "conversing"
            }

def process_chatbot_message(
    metadata_json: Dict[str, Any], 
    user_message: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """챗봇 메시지를 처리하고 응답을 반환합니다."""
    try:
        result = generate_conversational_response(
            metadata_json,
            user_message,
            conversation_history
        )
        
        return result
        
    except Exception as e:
        print(f"챗봇 처리 오류: {str(e)}")
        return {
            "message": "죄송합니다. 처리 중 오류가 발생했습니다.",
            "updated_metadata": metadata_json,
            "status": "error"
        }

def main():
    """메인 함수 - 테스트용"""
    import sys
    
    # Windows 콘솔 인코딩 설정
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    # file_analysis.py를 통해 분석된 메타데이터 예시
    test_metadata = {
        "project": {
            "title": "AI 기반 프로젝트 관리 시스템",
            "category": "웹 개발",
            "tags": ["AI", "웹"],
            "roles": [],
            "achievements": [],
            "tools": ["Python"],
            "description": None
        },
        "status": "analyzed"
    }
    
    print("=" * 60)
    print("프로젝트 메타데이터 챗봇 AI")
    print("=" * 60)
    print()
    print("현재 메타데이터:")
    print(json.dumps(test_metadata, ensure_ascii=False, indent=2))
    print()
    print("=" * 60)
    print()
    
    # 대화 시뮬레이션
    current_metadata = test_metadata
    conversation_history = []
    user_message = None
    
    while True:
        result = process_chatbot_message(
            current_metadata, 
            user_message,
            conversation_history
        )
        
        # 최종 확인 단계
        if result.get("status") == "final_confirmation":
            print(f"Nexter: {result['message']}")
            print()
            
            user_input = input("사용자: ").strip()
            if not user_input:
                continue
            
            if user_message:
                conversation_history.append({"role": "user", "content": user_message})
            conversation_history.append({"role": "assistant", "content": result['message']})
            
            if is_confirmation(user_input) or is_completion_request(user_input):
                print("\n최종 메타데이터:")
                print(json.dumps(result['updated_metadata'], ensure_ascii=False, indent=2))
                print("\n메타데이터 저장 준비 완료!")
                break
            else:
                # 수정 요청 - 대화로 처리
                user_message = user_input
                current_metadata = result['updated_metadata']
                continue
        
        if result.get("message"):
            print(f"Nexter: {result['message']}")
            print()
        
        # 대화 히스토리 업데이트
        if user_message:
            conversation_history.append({"role": "user", "content": user_message})
        if result.get("message"):
            conversation_history.append({"role": "assistant", "content": result['message']})
        
        current_metadata = result['updated_metadata']
        user_input = input("사용자: ").strip()
        
        if not user_input:
            continue
        
        user_message = user_input

if __name__ == "__main__":
    main()
