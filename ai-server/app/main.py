from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import os
import io
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

from app.services.chatbot_resume import process_cover_letter_chatbot
from app.services.word_file_handler import create_word_file_and_url
from app.services.file_analysis import analyze_project_from_formdata
from app.services.chatbot_meta_field import process_project_refine_chatbot

# .env 파일 로드
load_dotenv(verbose=True)

app = FastAPI(title="AI Server", version="1.0.0")

# 정적 파일 디렉토리 생성
files_dir = Path("files")
files_dir.mkdir(exist_ok=True)
resumes_dir = files_dir / "resumes"
resumes_dir.mkdir(exist_ok=True)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 세션 저장소 (메모리 기반, 프로덕션에서는 Redis 등 사용 권장)
sessions: Dict[str, Dict[str, Any]] = {}

# 요청 모델
class Project(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    summary: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    roles: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    description: Optional[str] = None

class StartRequest(BaseModel):
    state: str
    purpose: str
    projects: List[Project]

class ChatRequest(BaseModel):
    answer: str
    session_id: Optional[str] = None

class ProjectRefineRequest(BaseModel):
    state: str
    project: Dict[str, Any]

class ProjectRefineChatRequest(BaseModel):
    answer: str
    session_id: Optional[str] = None

# 응답 모델
class AssistantResponse(BaseModel):
    message: str
    session_id: Optional[str] = None
    url: Optional[str] = None  # Word 파일 다운로드 URL (AI 서버 URL)

def merge_projects_to_cover_letter_data(projects: List[Project]) -> Dict[str, Any]:
    """여러 프로젝트를 자기소개서 데이터로 통합합니다."""
    cover_letter_data = {
        "position": None,
        "skills": [],
        "experience": None,
        "achievements": [],
        "motivation": None,
        "strengths": [],
        "personality": None,
        "future_plans": None,
        "projects": []  # 각 프로젝트 정보를 배열로 저장
    }
    
    all_skills = set()
    all_achievements = []
    all_roles = []
    experience_parts = []
    
    # 각 프로젝트를 개별적으로 저장
    for project in projects:
        project_dict = {
            "title": project.title,
            "category": project.category,
            "tags": project.tags or [],
            "summary": project.summary,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "roles": project.roles or [],
            "achievements": project.achievements or [],
            "tools": project.tools or [],
            "description": project.description
        }
        cover_letter_data["projects"].append(project_dict)
        
        # tools → skills 통합
        if project.tools:
            for tool in project.tools:
                if tool:
                    all_skills.add(tool)
        
        # achievements 통합
        if project.achievements:
            for achievement in project.achievements:
                if achievement:
                    all_achievements.append(achievement)
        
        # roles 통합
        if project.roles:
            for role in project.roles:
                if role:
                    all_roles.append(role)
        
        # 경험 정보 수집
        if project.title and project.description:
            exp_text = f"{project.title}: {project.description}"
            experience_parts.append(exp_text)
        elif project.title:
            experience_parts.append(project.title)
        elif project.description:
            experience_parts.append(project.description)
        elif project.summary:
            experience_parts.append(project.summary)
    
    # 데이터 할당
    cover_letter_data["skills"] = list(all_skills)
    
    if all_achievements:
        cover_letter_data["achievements"] = all_achievements
    
    if all_roles:
        # 첫 번째 역할을 직무로
        cover_letter_data["position"] = all_roles[0]
        # 나머지를 경력으로
        if len(all_roles) > 1:
            if cover_letter_data["experience"]:
                cover_letter_data["experience"] += " | " + ", ".join(all_roles[1:])
            else:
                cover_letter_data["experience"] = ", ".join(all_roles[1:])
    
    if experience_parts:
        if cover_letter_data["experience"]:
            cover_letter_data["experience"] += " | " + " | ".join(experience_parts)
        else:
            cover_letter_data["experience"] = " | ".join(experience_parts)
    
    return cover_letter_data

@app.post("/ai/projects/assistant")
async def projects_assistant(request: Request):
    """프로젝트 기반 자기소개서 작성 어시스턴트"""
    try:
        # Request body를 JSON으로 파싱
        body = await request.json()
        
        # START 요청 처리
        if body.get("state") == "start":
            start_req = StartRequest(**body)
            
            # 프로젝트들을 자기소개서 데이터로 변환
            cover_letter_data = merge_projects_to_cover_letter_data(start_req.projects)
            
            # 세션 ID 생성
            session_id = str(uuid.uuid4())
            
            # 챗봇 처리 (초기 상태)
            result = process_cover_letter_chatbot(
                user_message=None,
                cover_letter_data=cover_letter_data,
                conversation_history=[],
                current_state="intent_confirmation",
                writing_style=None,
                draft_cover_letter=None,
                metadata=None
            )
            
            # 세션 저장
            sessions[session_id] = {
                "cover_letter_data": result.get("updated_data", cover_letter_data),
                "conversation_history": [],
                "current_state": result.get("next_state", "intent_confirmation"),
                "writing_style": result.get("writing_style"),
                "draft_cover_letter": result.get("draft_cover_letter"),
                "created_at": datetime.now().isoformat()
            }
            
            # 응답 생성
            return {
                "message": "안녕하세요! 저는 자기소개서 작성을 도와주는 넥스터입니다. 자기소개서 작성을 원하시나요?"
            }
        
        # 대화 진행 요청 처리
        elif "answer" in body:
            # 가장 최근 세션 자동 사용 (유저가 1명이므로)
            if sessions:
                session_id = max(sessions.keys(), key=lambda k: sessions[k].get("created_at", ""))
            else:
                raise HTTPException(status_code=400, detail="세션을 찾을 수 없습니다. 먼저 START 요청을 보내주세요.")
            
            session = sessions[session_id]
            
            # 사용자 답변 가져오기
            user_answer = body.get("answer", "")
            
            # 대화 히스토리 업데이트
            if user_answer:
                session["conversation_history"].append({
                    "role": "user",
                    "content": user_answer
                })
            
            # 챗봇 처리
            result = process_cover_letter_chatbot(
                user_message=user_answer,
                cover_letter_data=session["cover_letter_data"],
                conversation_history=session["conversation_history"],
                current_state=session["current_state"],
                writing_style=session.get("writing_style"),
                draft_cover_letter=session.get("draft_cover_letter"),
                metadata=None
            )
            
            # 세션 업데이트
            session["cover_letter_data"] = result.get("updated_data", session["cover_letter_data"])
            session["current_state"] = result.get("next_state", session["current_state"])
            session["writing_style"] = result.get("writing_style", session.get("writing_style"))
            session["draft_cover_letter"] = result.get("draft_cover_letter", session.get("draft_cover_letter"))
            
            # AI 응답을 대화 히스토리에 추가
            if result.get("message"):
                session["conversation_history"].append({
                    "role": "assistant",
                    "content": result.get("message")
                })
            
            response_data = {
                "message": result.get("message", "응답을 생성하는 중 오류가 발생했습니다.")
            }
            
            # Word 파일 생성 및 URL 생성 (완료 상태일 때)
            if result.get("status") == "completed" and result.get("draft_cover_letter"):
                try:
                    print("📝 Word 파일 생성 및 URL 변환 시작...")
                    
                    # Word 파일 생성 및 AI 서버 URL 생성
                    word_result = create_word_file_and_url(
                        result["draft_cover_letter"],
                        session["cover_letter_data"]
                    )
                    
                    if word_result.get("status") == "completed" and word_result.get("url"):
                        response_data["url"] = word_result["url"]
                        response_data["filename"] = word_result.get("filename")  # 파일명도 함께 반환
                        
                        # 성공 메시지 업데이트
                        filename = word_result.get("filename", "자기소개서.docx")
                        response_data["message"] = f"완료 ✅\n\nWord 파일을 생성했습니다.\n\n파일명: {filename}\n\n다음에는 Settings에 '활동·공모전 수상 내역'도 추가하면 더 풍부한 자기소개서가 만들어질 거예요."
                        
                        print(f"✅ Word 파일 URL 생성 완료: {word_result.get('url')}")
                    else:
                        print(f"⚠️ Word 파일 URL 생성 실패: {word_result.get('error', '알 수 없는 오류')}")
                        # 실패해도 기본 메시지는 유지
                        
                except Exception as e:
                    print(f"❌ 파일 생성/URL 생성 오류: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # 파일 생성 실패해도 메시지는 반환
                    pass
            
            # 응답 반환 (session_id를 body에 포함)
            return response_data
        
        else:
            raise HTTPException(status_code=400, detail="잘못된 요청 형식입니다.")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"에러 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

def parse_multipart_manually(body: bytes, boundary: str) -> tuple:
    """
    multipart/form-data를 수동으로 파싱
    Supabase Edge Function Proxy를 통한 요청 처리
    """
    file_data = None
    url_data = None
    text_data = None
    
    # boundary로 분리
    boundary_bytes = f"--{boundary}".encode()
    parts = body.split(boundary_bytes)
    
    for part in parts:
        if not part or part == b'--\r\n' or part == b'--':
            continue
        
        # 헤더와 본문 분리
        try:
            header_end = part.find(b'\r\n\r\n')
            if header_end == -1:
                continue
            
            headers = part[:header_end].decode('utf-8', errors='ignore')
            content = part[header_end + 4:]
            
            # 마지막 \r\n 제거
            if content.endswith(b'\r\n'):
                content = content[:-2]
            
            # Content-Disposition 파싱
            if 'Content-Disposition' in headers:
                # name 추출
                if 'name="file"' in headers:
                    filename = None
                    if 'filename=' in headers:
                        # filename 추출
                        filename_start = headers.find('filename="') + 10
                        filename_end = headers.find('"', filename_start)
                        filename = headers[filename_start:filename_end]
                    
                    file_data = {
                        'content': content,
                        'filename': filename
                    }
                
                elif 'name="url"' in headers:
                    url_data = content.decode('utf-8', errors='ignore').strip()
                
                elif 'name="text"' in headers:
                    text_data = content.decode('utf-8', errors='ignore').strip()
        
        except Exception as e:
            print(f"파트 파싱 오류: {e}")
            continue
    
    return file_data, url_data, text_data

@app.post("/ai/projects/analyze")
async def analyze_project(request: Request):
    """
    프로젝트 파일/URL/텍스트를 분석하여 메타데이터를 추출합니다.
    
    Supabase Edge Function Proxy를 통한 multipart 요청 지원
    python-multipart 파서 우회하여 직접 파싱
    
    FormData로 다음 중 하나 이상을 받습니다:
    - file: 업로드된 파일
    - url: 분석할 URL
    - text: 분석할 텍스트
    
    Returns:
        {
            "project": {
                "title": "분석된 프로젝트 제목",
                "category": "웹 개발",
                "summary": "project.pdf 업로드됨",
                "tags": ["React", "AI"],
                "roles": ["프론트엔드 개발자", "팀리더"],
                "achievements": ["개발 효율 30% 증가", "성과2"],
                "tools": ["React", "Node.js"],
                "description": "상세 내용"
            }
        }
    """
    try:
        # Content-Type 헤더 확인
        content_type = request.headers.get("content-type", "")
        
        # multipart/form-data인 경우
        if "multipart/form-data" in content_type:
            # 원시 body를 직접 읽기
            body = await request.body()
            
            # boundary 추출
            boundary = None
            if "boundary=" in content_type:
                boundary = content_type.split("boundary=")[1].strip()
            
            if not boundary:
                raise HTTPException(status_code=400, detail="boundary not found")
            
            # multipart 데이터를 수동으로 파싱
            file_data, url_data, text_data = parse_multipart_manually(body, boundary)
            
            # analyze_project_from_formdata 호출
            if file_data:
                # bytes를 파일처럼 처리
                file_like = io.BytesIO(file_data['content'])
                file_like.name = file_data.get('filename', 'uploaded_file')
                file_like.filename = file_data.get('filename', 'uploaded_file')
                file_like.file = file_like  # shutil.copyfileobj를 위해 자기 자신을 file 속성으로 설정
                metadata = analyze_project_from_formdata(
                    file=file_like,
                    url=None,
                    text=None
                )
            elif url_data:
                metadata = analyze_project_from_formdata(
                    file=None,
                    url=url_data,
                    text=None
                )
            elif text_data:
                metadata = analyze_project_from_formdata(
                    file=None,
                    url=None,
                    text=text_data
                )
            else:
                raise HTTPException(status_code=400, detail="No file, url, or text provided")
        
        # JSON인 경우
        elif "application/json" in content_type:
            data = await request.json()
            metadata = analyze_project_from_formdata(
                file=None,
                url=data.get("url"),
                text=data.get("text")
            )
        
        # 일반 form-data인 경우 (기존 방식 - Direct 호출)
        else:
            try:
                form = await request.form()
                file = form.get("file")
                url = form.get("url")
                text = form.get("text")
                metadata = analyze_project_from_formdata(file, url, text)
            except Exception as form_error:
                print(f"Form 파싱 실패, multipart 수동 파싱 시도: {form_error}")
                # Form 파싱 실패 시 multipart 수동 파싱 시도
                body = await request.body()
                boundary = None
                if "boundary=" in content_type:
                    boundary = content_type.split("boundary=")[1].strip()
                
                if boundary:
                    file_data, url_data, text_data = parse_multipart_manually(body, boundary)
                    if file_data:
                        file_like = io.BytesIO(file_data['content'])
                        file_like.name = file_data.get('filename', 'uploaded_file')
                        file_like.filename = file_data.get('filename', 'uploaded_file')
                        file_like.file = file_like  # shutil.copyfileobj를 위해 자기 자신을 file 속성으로 설정
                        metadata = analyze_project_from_formdata(file=file_like, url=None, text=None)
                    elif url_data:
                        metadata = analyze_project_from_formdata(file=None, url=url_data, text=None)
                    elif text_data:
                        metadata = analyze_project_from_formdata(file=None, url=None, text=text_data)
                    else:
                        raise HTTPException(status_code=400, detail="No file, url, or text provided")
                else:
                    raise form_error
        
        # 응답 형식 맞추기 (status 제거하고 project만 반환)
        if "project" in metadata:
            return {"project": metadata["project"]}
        else:
            # 에러가 발생한 경우
            return {
                "project": {
                    "title": None,
                    "category": None,
                    "summary": None,
                    "tags": [],
                    "roles": [],
                    "achievements": [],
                    "tools": [],
                    "description": None
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"프로젝트 분석 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"프로젝트 분석 중 오류가 발생했습니다: {str(e)}"
        )

@app.post("/ai/projects/refine")
async def refine_project(request: Request):
    """
    프로젝트 메타데이터를 대화를 통해 수정하는 챗봇 엔드포인트
    
    START 요청:
    {
        "state": "start",
        "project": {
            "title": "포트폴리오 자동 생성기",
            "category": "웹 개발",
            ...
        }
    }
    
    대화 진행 요청:
    {
        "answer": "사용자 답변"
    }
    """
    try:
        body = await request.json()
        
        # START 요청 처리
        if body.get("state") == "start":
            refine_req = ProjectRefineRequest(**body)
            
            # 세션 ID 생성 (내부 관리용)
            session_id = str(uuid.uuid4())
            
            # 챗봇 처리 (첫 메시지)
            result = process_project_refine_chatbot(
                project=refine_req.project,
                user_message=None,
                conversation_history=[]
            )
            
            # 세션 저장 (내부 관리용)
            sessions[session_id] = {
                "project": result.get("project", refine_req.project),
                "conversation_history": [],
                "status": result.get("status", "conversing"),
                "created_at": datetime.now().isoformat()
            }
            
            # 응답: message만 반환 (session_id 없음)
            return {
                "message": result.get("message", "좋아요! 우선 이 프로젝트에서 가장 핵심이 되는 기능이 무엇인가요?")
            }
        
        # 대화 진행 요청 처리
        elif "answer" in body:
            # session_id가 없으므로, 헤더나 쿠키에서 세션 정보를 가져오거나
            # 가장 최근 세션을 사용 (실제로는 Supabase에서 세션 관리)
            session_id = None
            
            # 헤더에서 세션 ID 확인 (X-Session-Id 등)
            session_id = request.headers.get("X-Session-Id")
            
            # 헤더에 없으면 쿠키에서 확인
            if not session_id:
                session_id = request.cookies.get("session_id")
            
            # 여전히 없으면 가장 최근 세션 사용 (임시 해결책)
            if not session_id or session_id not in sessions:
                # 가장 최근 세션 찾기
                if sessions:
                    session_id = max(sessions.keys(), key=lambda k: sessions[k].get("created_at", ""))
                else:
                    raise HTTPException(status_code=400, detail="세션을 찾을 수 없습니다. 먼저 START 요청을 보내주세요.")
            
            session = sessions[session_id]
            
            # 대화 히스토리 업데이트
            if body.get("answer"):
                session["conversation_history"].append({
                    "role": "user",
                    "content": body.get("answer")
                })
            
            # 챗봇 처리
            result = process_project_refine_chatbot(
                project=session["project"],
                user_message=body.get("answer"),
                conversation_history=session["conversation_history"]
            )
            
            # 세션 업데이트
            session["project"] = result.get("project", session["project"])
            
            # AI 응답을 대화 히스토리에 추가
            if result.get("message"):
                session["conversation_history"].append({
                    "role": "assistant",
                    "content": result.get("message")
                })
            
            # 응답 구성
            response_data = {
                "message": result.get("message", "응답을 생성하는 중 오류가 발생했습니다.")
            }
            
            # 완료 메시지가 포함되면 프로젝트 데이터도 함께 반환
            message = result.get("message", "")
            if result.get("project") and ("보강했어" in message or "저장되었습니다" in message):
                response_data["project"] = result.get("project")
            
            return response_data
        
        else:
            raise HTTPException(status_code=400, detail="잘못된 요청 형식입니다.")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"프로젝트 수정 챗봇 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AI Server is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# 파일 다운로드 엔드포인트
@app.get("/files/resumes/{filename}")
async def download_resume(filename: str):
    """
    Word 파일 다운로드 엔드포인트
    """
    try:
        file_path = resumes_dir / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        # 파일명에 한글이 포함되어 있을 수 있으므로 FileResponse 사용
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 다운로드 오류: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

