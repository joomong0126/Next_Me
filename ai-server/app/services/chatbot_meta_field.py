## 프로젝트 메타데이터 챗봇 AI
## file_analysis.py를 통해 분석된 메타데이터를 기반으로 대화를 통해 보완하는 챗봇

import os
import json
import re
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

# 완료를 나타내는 키워드 (대화 종료 및 최종 확인 요청)
COMPLETION_KEYWORDS = ["완료", "끝", "종료", "done", "finish", "complete", "미리보기", "끝낼래", "끝내", "끝내기", "그만", "종료할래"]
# 주의: "저장"과 "save"는 제외 (확인 단계에서 저장 처리하기 위함)

# 확인을 나타내는 키워드
CONFIRMATION_KEYWORDS = ["맞아", "네", "예", "ok", "okay", "좋아", "맞아요", "네요", "예요", "그래", "그래요", "확인", "yes", "y", "응", "ㅇㅇ"]

# 미리보기 요청 키워드
PREVIEW_KEYWORDS = ["미리보기", "확인", "저장 전", "보여줘", "preview"]

# 거절/생략 키워드
DECLINE_KEYWORDS = ["아니요", "아니", "괜찮", "괜찮아요", "필요없", "필요 없", "no", "nope", "그냥", "이대로"]

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

def is_preview_request(user_message: str) -> bool:
    """사용자 메시지가 미리보기 요청인지 확인합니다."""
    if not user_message:
        return False
    message_lower = user_message.strip().lower()
    return any(keyword in message_lower for keyword in PREVIEW_KEYWORDS)

def is_decline(user_message: str) -> bool:
    """사용자 메시지가 거절/생략 응답인지 확인합니다."""
    if not user_message:
        return False
    message_lower = user_message.strip().lower()
    
    # 거절 키워드가 있고 저장 키워드도 함께 있는 경우
    has_decline = any(keyword in message_lower for keyword in DECLINE_KEYWORDS)
    has_save = any(keyword in message_lower for keyword in ["저장", "save"])
    
    return has_decline and (has_save or len(user_message.strip()) < 15)  # 짧은 거절도 포함

def is_modification_request(user_message: str, last_ai_message: str = "") -> bool:
    """최종 확인 후 사용자가 수정을 요청하는지 확인합니다."""
    if not user_message:
        return False
    
    message_lower = user_message.strip().lower()
    
    # 최종 확인 메시지 이후인지 확인
    if not ("맞나요" in last_ai_message or "정리된 내용" in last_ai_message or "수정하는게" in last_ai_message):
        return False
    
    # 저장 키워드가 있으면 수정 요청이 아님 (저장 처리)
    if any(keyword in message_lower for keyword in ["저장", "save"]):
        return False
    
    # 확인 키워드가 있으면 수정 요청이 아님
    has_confirmation = any(keyword in message_lower for keyword in CONFIRMATION_KEYWORDS)
    if has_confirmation:
        return False
    
    # 거절 또는 수정 키워드 (확장)
    modification_keywords = [
        "아니", "수정", "바꿔", "변경", "고쳐", "틀렸", "다시",
        "추가", "넣어", "포함", "더", "빼", "제거", "삭제",
        "아니요", "아니야", "아니에요", "틀려", "wrong", "change"
    ]
    
    has_modification = any(keyword in message_lower for keyword in modification_keywords)
    
    # 수정 키워드가 있거나, 확인 키워드가 없으면서 5자 이상이면 수정 요청으로 간주
    return has_modification or (not has_confirmation and len(user_message.strip()) > 5)

def extract_kpis(text: str) -> List[str]:
    """텍스트에서 KPI(수치/성과)를 추출합니다."""
    kpi_patterns = [
        r'\d+%\s*(?:증가|상승|향상|개선|성장)',
        r'\d+%\s*(?:감소|단축|절감|하락)',
        r'\d+배\s*(?:증가|상승|향상)',
        r'\d+\s*(?:건|명|개|회|번)\s*(?:증가|달성|완료)',
    ]
    
    kpis = []
    for pattern in kpi_patterns:
        matches = re.findall(pattern, text)
        kpis.extend(matches)
    
    return kpis

def has_existing_data(metadata: Dict[str, Any]) -> bool:
    """메타데이터에 이미 입력된 데이터가 있는지 확인합니다."""
    project = metadata.get("project", {})
    
    # 제목이 있거나 다른 필드에 데이터가 하나라도 있으면 True
    if project.get("title"):
        return True
    
    for field in ["category", "tags", "roles", "achievements", "tools", "description"]:
        value = project.get(field)
        if value:
            if isinstance(value, list) and len(value) > 0:
                return True
            elif not isinstance(value, list) and value:
                return True
    
    return False

def detect_user_type(metadata: Dict[str, Any]) -> str:
    """메타데이터를 분석하여 사용자 유형을 추정합니다."""
    project = metadata.get("project", {})
    
    # 카테고리 기반 판단
    category = project.get("category", "").lower()
    if any(keyword in category for keyword in ["개발", "develop", "앱", "웹", "백엔드", "프론트엔드", "backend", "frontend"]):
        return "developer"
    
    if any(keyword in category for keyword in ["마케팅", "기획", "marketing", "캠페인"]):
        return "marketer"
    
    # 도구 기반 판단
    tools = project.get("tools", [])
    dev_tools = ["react", "vue", "angular", "python", "java", "javascript", "typescript", "fastapi", "django", "flask", "node.js", "next.js", "aws", "docker", "kubernetes"]
    marketing_tools = ["google analytics", "figma", "notion", "photoshop", "canva", "hubspot"]
    
    dev_count = sum(1 for tool in tools if any(dt in tool.lower() for dt in dev_tools))
    marketing_count = sum(1 for tool in tools if any(mt in tool.lower() for mt in marketing_tools))
    
    if dev_count > marketing_count:
        return "developer"
    elif marketing_count > dev_count:
        return "marketer"
    
    return "general"

def detect_tech_stack_change(user_message: str, current_tools: List[str]) -> bool:
    """기술 스택 변경 여부를 감지합니다."""
    change_keywords = ["변경", "바꿨", "바꿨어요", "업데이트", "변환", "마이그레이션", "리팩토링", "전환"]
    tech_keywords = ["기술", "스택", "프레임워크", "라이브러리", "프론트", "백엔드"]
    
    message_lower = user_message.lower()
    
    # 변경 키워드와 기술 키워드가 모두 포함되어 있는지 확인
    has_change = any(keyword in user_message for keyword in change_keywords)
    has_tech = any(keyword in user_message for keyword in tech_keywords)
    
    return has_change and has_tech

def format_metadata_summary(metadata: Dict[str, Any]) -> str:
    """메타데이터를 요약 형식으로 포맷팅합니다."""
    project = metadata.get("project", {})
    summary_parts = []
    
    if project.get("title"):
        summary_parts.append(f"제목 : {project['title']}")
    if project.get("category"):
        summary_parts.append(f"카테고리 : {project['category']}")
    if project.get("tags") and len(project["tags"]) > 0:
        summary_parts.append(f"태그 : {', '.join(project['tags'])}")
    if project.get("roles") and len(project["roles"]) > 0:
        summary_parts.append(f"역할 : {', '.join(project['roles'])}")
    if project.get("achievements") and len(project["achievements"]) > 0:
        summary_parts.append(f"주요성과 : {', '.join(project['achievements'])}")
    if project.get("tools") and len(project["tools"]) > 0:
        summary_parts.append(f"사용 기술/도구 : {', '.join(project['tools'])}")
    if project.get("description"):
        summary_parts.append(f"상세 설명 : {project['description']}")
    
    return "\n".join(summary_parts) if summary_parts else "아직 입력된 정보가 없습니다."

def extract_and_update_metadata_with_llm(
    metadata: Dict[str, Any],
    user_message: str,
    conversation_history: List[Dict[str, str]],
    style_change_request: bool = False
) -> Dict[str, Any]:
    """LLM을 사용하여 사용자 메시지에서 메타데이터를 추출하고 업데이트합니다."""
    try:
        project = metadata.get("project", {})
        current_metadata_str = json.dumps(project, ensure_ascii=False, indent=2)
        
        # 대화 히스토리 요약
        history_summary = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in conversation_history[-5:]  # 최근 5개로 확대
        ])
        
        # 사용자 유형 감지
        user_type = detect_user_type(metadata)
        user_type_note = f"\n\n감지된 사용자 유형: {user_type}"
        
        # KPI 자동 추출
        detected_kpis = extract_kpis(user_message)
        kpi_note = ""
        if detected_kpis:
            kpi_note = f"\n감지된 KPI: {', '.join(detected_kpis)}"
        
        # 기술 스택 변경 감지
        tech_change = detect_tech_stack_change(user_message, project.get("tools", []))
        tech_change_note = ""
        if tech_change:
            tech_change_note = "\n⚠️ 기술 스택 변경이 감지되었습니다. 인사이트형 질문을 해주세요."
        
        prompt = f"""당신은 프로젝트 메타데이터를 대화를 통해 정리하는 AI 'Nexter'입니다.
마케터, 개발자, 디자이너 등 다양한 사용자와 대화하며 프로젝트 경험을 정리합니다.

현재 메타데이터 상태:
{current_metadata_str}

최근 대화:
{history_summary}

사용자 메시지: {user_message}{user_type_note}{kpi_note}{tech_change_note}

사용자의 메시지를 분석하여 다음 정보를 추출하고 업데이트하세요:
- title: 프로젝트 제목
- category: 프로젝트 카테고리 (예: 마케팅/기획, 웹 개발, 앱 개발, 데이터 분석 등)
- tags: 태그 (배열)
- roles: 역할 (배열) - "캠페인 기획 및 운영", "프론트엔드 개발", "백엔드 API 설계" 등 구체적으로
- achievements: 주요 성과 (배열) - KPI가 포함된 경우 수치와 함께 기록 (예: "평균 응답 시간 30% 단축")
- tools: 사용된 기술/도구 (배열)
- description: 상세 설명 - 문제, 해결방법, 결과를 포함한 스토리텔링 형식

**특별 지시사항:**

### 1. 문체 변경
사용자가 "보고서 문체로", "전문적으로", "격식 있게" 등 문체 변경을 요청하면, 해당 필드의 내용을 요청된 문체로 변환하세요.

### 2. KPI 자동 포함
"200% 증가", "30% 단축" 같은 KPI는 반드시 achievements에 포함하세요.

### 3. 개발자 특화 대응 (중요!)
사용자가 **개발자**이고 다음 상황일 때 특별한 질문을 하세요:

a) **기술 스택 변경/업데이트 시:**
   - 먼저 기술 스택을 업데이트
   - 그 다음 "혹시 추가로 CI/CD나 분석툴, 테스트 프레임워크도 포함할까요?" 같이 관련 기술을 제안
   - 예: Next.js 언급 → "TypeScript나 Tailwind CSS도 사용하셨나요?"
   - 예: FastAPI 언급 → "CI/CD 도구나 모니터링 툴도 함께 기록할까요?"

b) **기술 변경 이유 탐색 (인사이트형 질문):**
   - 기술 스택이 변경되었다면: "기술 변경 이유를 기록해두면 프로젝트 회고에 도움이 될 거예요. 혹시 어떤 문제를 해결하기 위해 구조를 바꾸셨나요?"
   - 리팩토링 언급 시: "리팩토링으로 어떤 개선이 있었나요?"
   - 성능 개선 언급 시: "구체적으로 어떤 지표가 개선되었나요?"

c) **상세 설명 자동 생성:**
   - 문제 해결 과정이 언급되면 description을 다음 형식으로 구조화:
     "[기존 문제] → [해결 방법] → [결과/성과]"
   - 예: "기존 Node.js 백엔드의 응답 지연 문제를 FastAPI 기반으로 리팩토링하여 평균 응답 시간 30% 단축. Grafana를 통해 실시간 모니터링 체계 구축."

d) **배움/개선 포인트 추가 질문:**
   - 정보가 충분히 수집되면: "변경된 기술 스택과 성과를 반영했습니다. 추가로 배운 점이나 개선 포인트도 기록해둘까요?"
   - 이 질문은 needs_more_info를 true로 설정하되, 사용자가 거절하면 바로 종료 가능

### 4. 마케터 특화 대응
사용자가 **마케터**이고 성과를 언급하면:
- "노출수, 전환율, 예산 대비 효율 등 어떤 지표를 강조하고 싶으세요?"
- "혹시 그 캠페인에서 가장 효과적이었던 채널이나 전략이 있었나요?"

### 5. 역할 수정
역할 수정 요청 시 기존 역할을 대체하거나 추가하세요.

JSON 형식으로 응답하세요:
{{
  "updated_metadata": {{
    "title": "업데이트된 제목 또는 null",
    "category": "업데이트된 카테고리 또는 null",
    "tags": ["태그1", "태그2"] 또는 [],
    "roles": ["역할1"] 또는 [],
    "achievements": ["성과1 (KPI 포함)"] 또는 [],
    "tools": ["도구1", "도구2"] 또는 [],
    "description": "업데이트된 설명 (문제-해결-결과 형식) 또는 null"
  }},
  "response_message": "사용자에게 자연스럽게 대화를 이어갈 수 있는 메시지 (인사이트형 질문, 관련 기술 제안 포함)",
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
    
    # 미리보기 요청 확인
    if user_message and is_preview_request(user_message):
        final_summary = format_metadata_summary(metadata)
        return {
            "message": f"📋 **수정된 내용 미리보기**\n\n{final_summary}\n\n더 수정할 부분이 있을까요, 아니면 저장할까요?",
            "updated_metadata": metadata,
            "status": "preview"
        }
    
    # 완료/저장/종료 요청 확인 → 최종 확인 단계로
    if user_message and is_completion_request(user_message):
        final_summary = format_metadata_summary(metadata)
        return {
            "message": f"📋 **최종으로 올라갈 메타데이터**\n\n{final_summary}\n\n이렇게 수정하는게 맞나요?\n\n맞으면 '네'라고 말씀해주시고, 수정할 부분이 있으면 알려주세요!",
            "updated_metadata": metadata,
            "status": "preview"  # 최종 확인은 preview 상태
        }
    
    # 사용자 메시지가 있는 경우 - LLM으로 메타데이터 추출 및 업데이트
    if user_message:
        # 이전 AI 메시지 가져오기 (수정 요청 감지용)
        last_ai_message = ""
        if conversation_history:
            for msg in reversed(conversation_history):
                if msg.get("role") == "assistant":
                    last_ai_message = msg.get("content", "")
                    break
        
        # preview 상태에서 확인 응답 또는 저장 요청 → 완료
        if "최종으로 올라갈" in last_ai_message or "이렇게 수정하는게 맞나요" in last_ai_message or "미리보기" in last_ai_message:
            # "저장" 또는 확인 키워드가 있으면 저장
            has_save_keyword = any(keyword in user_message.lower() for keyword in ["저장", "save"])
            if is_confirmation(user_message) or has_save_keyword:
                final_summary = format_metadata_summary(metadata)
                return {
                    "message": f"✅ **수정사항이 저장되었습니다!**\n\n{final_summary}\n\n프로젝트 정보가 업데이트되었어요! 다음에 보자! 💪",
                    "updated_metadata": metadata,
                    "status": "completed"  # 슈퍼베이스로 전달
                }
            
            # preview 상태에서 수정 요청 → 대화 재개
            elif is_modification_request(user_message, last_ai_message):
                # 수정 내용을 LLM으로 처리
                result = extract_and_update_metadata_with_llm(
                    metadata,
                    user_message,
                    conversation_history
                )
                
                updated_metadata = result["updated_metadata"]
                response_message = result["response_message"]
                
                return {
                    "message": f"{response_message}\n\n수정이 완료되면 '저장' 이라고 말씀해주세요.",
                    "updated_metadata": updated_metadata,
                    "status": "conversing"  # 대화 재개
                }
        
        # 거절 + 저장 의사 확인 (예: "아니요, 이대로 저장할게요")
        if is_decline(user_message):
            final_summary = format_metadata_summary(metadata)
            return {
                "message": f"✅ **수정사항이 저장되었습니다!**\n\n{final_summary}",
                "updated_metadata": metadata,
                "status": "completed"
            }
        
        result = extract_and_update_metadata_with_llm(
            metadata,
            user_message,
            conversation_history
        )
        
        updated_metadata = result["updated_metadata"]
        response_message = result["response_message"]
        needs_more_info = result["needs_more_info"]
        
        # 추가 정보가 필요한 경우 - 대화 계속
        if needs_more_info and not is_confirmation(user_message):
            return {
                "message": response_message,
                "updated_metadata": updated_metadata,
                "status": "conversing"
            }
        else:
            # 정보가 충분함 → 대화 계속 (사용자가 명시적으로 끝낼 때까지)
            return {
                "message": response_message,
                "updated_metadata": updated_metadata,
                "status": "conversing"
            }
    else:
        # 첫 메시지
        # 이미 데이터가 있는 경우 - 열린 질문으로 시작
        if has_existing_data(metadata):
            project = metadata.get("project", {})
            project_title = project.get("title", "이 프로젝트")
            
            return {
                "message": f"안녕하세요! '{project_title}'에 대해 정리하고 계시네요.\n\n어떤 사항 위주로 수정하고 싶으신가요?\n\n예를 들어 '성과를 좀 더 구체적으로 적고 싶어요' 혹은 '내 역할을 새로 정리하고 싶어요'처럼 말씀해주시면 도와드릴게요.",
                "updated_metadata": metadata,
                "status": "conversing"
            }
        
        # 데이터가 없는 경우 - 빈 필드에 대해 질문
        null_fields = find_null_fields(metadata)
        if len(null_fields) == 0:
            # 모든 필드가 채워짐
            final_summary = format_metadata_summary(metadata)
            return {
                "message": f"좋아요! 지금까지 정리한 내용을 보면:\n\n{final_summary}\n\n이렇게 업데이트 해도 될까요?",
                "updated_metadata": metadata,
                "status": "preview"
            }
        else:
            # 첫 번째 빈 필드에 대해 구체적으로 질문
            target_field = null_fields[0]
            field_name = FIELD_NAMES.get(target_field, target_field)
            
            # 구체적 질문 생성
            questions = {
                "title": "안녕하세요! 이 프로젝트에 대해 알려주세요. 먼저 프로젝트 제목이 무엇인가요?",
                "category": "이 프로젝트는 어떤 카테고리에 속하나요? (예: 마케팅/기획, 웹 개발, 앱 개발 등)",
                "tags": "이 프로젝트와 관련된 키워드나 태그가 있나요?",
                "roles": "이 프로젝트에서 맡으신 역할이 무엇이었나요? (예: 캠페인 기획, 프론트엔드 개발 등)",
                "achievements": "이 프로젝트에서 달성한 주요 성과가 있나요?\n\n예를 들어 노출수, 전환율, 성능 개선율 등 어떤 지표를 강조하고 싶으세요?",
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

def process_project_refine_chatbot(
    project: Dict[str, Any],
    user_message: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    프로젝트 메타데이터를 대화를 통해 수정하는 챗봇을 처리합니다.
    
    Args:
        project: 프로젝트 메타데이터 딕셔너리
        user_message: 사용자 메시지 (None이면 첫 메시지)
        conversation_history: 대화 히스토리
    
    Returns:
        {
            "message": "AI 응답 메시지",
            "project": {업데이트된 프로젝트 메타데이터},
            "status": "conversing" | "completed" | "preview"
        }
    """
    if conversation_history is None:
        conversation_history = []
    
    # 메타데이터를 표준 형식으로 변환
    metadata = {"project": project}
    
    # 첫 메시지인 경우
    if user_message is None:
        project_title = project.get("title", "이 프로젝트")
        
        # 이미 데이터가 있는 경우 - 열린 질문
        if has_existing_data(metadata):
            return {
                "message": f"안녕하세요! '{project_title}'에 대해 정리하고 계시네요.\n\n어떤 사항 위주로 수정하고 싶으신가요?\n\n예를 들어 '성과를 좀 더 구체적으로 적고 싶어요' 혹은 '내 역할을 새로 정리하고 싶어요'처럼 말씀해주시면 도와드릴게요.",
                "project": project,
                "status": "conversing"
            }
        else:
            # 데이터가 없는 경우
            return {
                "message": "좋아요! 우선 이 프로젝트에서 가장 핵심이 되는 기능이 무엇인가요?",
                "project": project,
                "status": "conversing"
            }
    
    # 미리보기 요청 확인
    if is_preview_request(user_message):
        final_summary = format_metadata_summary(metadata)
        return {
            "message": f"📋 **수정된 내용 미리보기**\n\n{final_summary}\n\n더 수정할 부분이 있을까요, 아니면 저장할까요?",
            "project": updated_project if 'updated_project' in locals() else project,
            "status": "preview"
        }
    
    # 완료/저장/종료 요청 확인 → 최종 확인 단계로
    if is_completion_request(user_message):
        final_summary = format_metadata_summary(metadata)
        return {
            "message": f"📋 **최종으로 올라갈 메타데이터**\n\n{final_summary}\n\n이렇게 수정하는게 맞나요?\n\n맞으면 '네'라고 말씀해주시고, 수정할 부분이 있으면 알려주세요!",
            "project": updated_project if 'updated_project' in locals() else project,
            "status": "preview"
        }
    
    # 이전 AI 메시지 가져오기
    last_ai_message = ""
    if conversation_history:
        for msg in reversed(conversation_history):
            if msg.get("role") == "assistant":
                last_ai_message = msg.get("content", "")
                break
    
    # preview 상태에서 확인 응답 또는 저장 요청 → 완료
    if "최종으로 올라갈" in last_ai_message or "이렇게 수정하는게 맞나요" in last_ai_message or "미리보기" in last_ai_message:
        # "저장" 또는 확인 키워드가 있으면 저장
        has_save_keyword = any(keyword in user_message.lower() for keyword in ["저장", "save"])
        if is_confirmation(user_message) or has_save_keyword:
            # 사용자 메시지 처리
            result = extract_and_update_metadata_with_llm(
                metadata,
                user_message,
                conversation_history
            )
            updated_metadata = result["updated_metadata"]
            updated_project = updated_metadata.get("project", project)
            
            final_summary = format_metadata_summary(updated_metadata)
            return {
                "message": f"✅ **수정사항이 저장되었습니다!**\n\n{final_summary}\n\n프로젝트 내용을 보강했어! 다음에 보자!",
                "project": updated_project,
                "status": "completed"
            }
        
        # preview 상태에서 수정 요청 → 대화 재개
        elif is_modification_request(user_message, last_ai_message):
            result = extract_and_update_metadata_with_llm(
                metadata,
                user_message,
                conversation_history
            )
            
            updated_metadata = result["updated_metadata"]
            updated_project = updated_metadata.get("project", project)
            response_message = result["response_message"]
            
            return {
                "message": f"{response_message}\n\n수정이 완료되면 '저장' 또는 '끝낼래'라고 말씀해주세요.",
                "project": updated_project,
                "status": "conversing"
            }
    
    # 사용자 메시지 처리 - LLM으로 메타데이터 추출 및 업데이트
    result = extract_and_update_metadata_with_llm(
        metadata,
        user_message,
        conversation_history
    )
    
    updated_metadata = result["updated_metadata"]
    updated_project = updated_metadata.get("project", project)
    response_message = result["response_message"]
    needs_more_info = result["needs_more_info"]
    
    # 추가 정보가 필요한 경우
    if needs_more_info:
        return {
            "message": response_message,
            "project": updated_project,
            "status": "conversing"
        }
    
    # 대화 지속
    return {
        "message": response_message,
        "project": updated_project,
        "status": "conversing"
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
