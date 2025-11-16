##프로젝트 메타데이터 추출 AI
##이미지, PDF, Word, 텍스트, 링크 파일을 분석하여 프로젝트 메타데이터를 추출합니다.


import os
import json
import base64
import mimetypes
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
import requests
from urllib.parse import urlparse
from fastapi import UploadFile

# .env 파일 로드
load_dotenv(verbose=True)

# OpenAI API 키 확인
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.")

client = OpenAI(api_key=openai_api_key)


def encode_image_to_base64(image_path: str) -> Optional[str]:
    """이미지를 base64로 인코딩합니다."""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"이미지 인코딩 오류: {str(e)}")
        return None


def analyze_image(file_path: str) -> str:
    """GPT-4o Vision으로 이미지를 상세 분석합니다."""
    try:
        base64_image = encode_image_to_base64(file_path)
        if not base64_image:
            return ""
        
        # 이미지 타입 자동 감지
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type or not mime_type.startswith('image/'):
            mime_type = "image/jpeg"
        
        prompt = """이 이미지를 분석하여 프로젝트/활동 메타데이터를 추출해주세요.

다음 정보를 찾아주세요:
- 프로젝트/활동 제목
- 카테고리 (예: SNS 운영, 마케팅 캠페인, 웹 개발, 데이터 분석, AI/ML 등)
- 활동 기간 (시작일~종료일, 있다면)
- 담당 역할 (예: 개발자, 마케터, 기획자, 디자이너 등)
- 주요 성과/지표 (숫자가 있으면 구체적으로, 예: 팔로워 증가율 150%, 성능 개선 30% 등)
- 사용된 기술/도구/플랫폼 (예: React, Python, Instagram, Google Analytics 등)
- 프로젝트 상세 설명 (핵심 내용을 3-5문장으로 요약)
- 관련 키워드/태그

**중요**: 
- 이미지에 있는 차트, 그래프, 표, 스크린샷의 내용도 모두 읽어주세요
- 텍스트와 이미지를 모두 종합해서 분석해주세요
- 모든 숫자와 단위를 정확히 유지해주세요
- 발표 자료나 포스터인 경우 각 섹션의 내용을 모두 파악해주세요
- UI/디자인 요소도 설명해주세요 (색상, 레이아웃, 브랜딩 등)"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4000,
            temperature=0.2
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"이미지 분석 오류: {str(e)}")
        return ""


def analyze_pdf(file_path: str) -> str:
    """GPT-4o Vision으로 PDF를 직접 분석합니다 (이미지+텍스트 혼합 PDF 지원)."""
    try:
        # PDF 파일 크기 확인 (20MB 제한)
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        
        if file_size_mb > 20:
            print(f"PDF 파일이 너무 큽니다 ({file_size_mb:.1f}MB). 텍스트 추출 방식으로 폴백합니다.")
            return analyze_pdf_fallback(file_path)
        
        # PDF를 base64로 인코딩
        with open(file_path, "rb") as f:
            pdf_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        # GPT-4o Vision으로 PDF 분석
        prompt = """이 PDF 문서를 분석하여 프로젝트/활동 메타데이터를 추출해주세요.

다음 정보를 찾아주세요:
- 프로젝트/활동 제목
- 카테고리 (예: SNS 운영, 마케팅 캠페인, 웹 개발, 데이터 분석, AI/ML 등)
- 활동 기간 (시작일~종료일, 있다면)
- 담당 역할 (예: 개발자, 마케터, 기획자, 디자이너 등)
- 주요 성과/지표 (숫자가 있으면 구체적으로, 예: 팔로워 증가율 150%, 성능 개선 30% 등)
- 사용된 기술/도구/플랫폼 (예: React, Python, Instagram, Google Analytics 등)
- 프로젝트 상세 설명 (핵심 내용을 3-5문장으로 요약)
- 관련 키워드/태그

**중요**: 
- PDF의 모든 페이지를 확인해주세요
- 이미지에 있는 차트, 그래프, 표, 스크린샷의 내용도 모두 읽어주세요
- 텍스트와 이미지를 모두 종합해서 분석해주세요
- 모든 숫자와 단위를 정확히 유지해주세요
- 발표 자료나 포스터인 경우 각 슬라이드/섹션의 내용을 모두 파악해주세요"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:application/pdf;base64,{pdf_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4000,
            temperature=0.2
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"GPT-4o PDF 분석 오류: {str(e)}")
        print("텍스트 추출 방식으로 폴백합니다...")
        return analyze_pdf_fallback(file_path)


def analyze_pdf_fallback(file_path: str) -> str:
    """PDF 파일을 텍스트로 추출하고 벡터화하여 분석합니다 (폴백 방식)."""
    try:
        # PDF 로딩
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        if not documents:
            return ""
        
        # 텍스트 결합
        full_text = "\n\n".join([doc.page_content for doc in documents])
        
        # 텍스트가 너무 길면 벡터 DB 사용
        if len(full_text) > 10000:
            return analyze_pdf_with_vector_db(file_path, documents)
        else:
            return analyze_text_with_llm(full_text)
            
    except Exception as e:
        print(f"PDF 폴백 분석 오류: {str(e)}")
        return ""


def analyze_pdf_with_vector_db(file_path: str, documents: list) -> str:
    """벡터 DB를 사용하여 긴 PDF를 분석합니다."""
    try:
        # 텍스트 분할
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(documents)
        
        # 임시 벡터 DB 생성
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=embeddings
        )
        
        # RAG를 사용한 분석
        llm = ChatOpenAI(
            openai_api_key=openai_api_key,
            model_name="gpt-4o-mini",
            temperature=0
        )
        
        # 관련 문서 검색
        retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
        relevant_docs = retriever.invoke("프로젝트 메타데이터를 추출해주세요")
        
        # 문서 내용 결합
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        prompt_template = """다음 문서들을 분석하여 프로젝트 메타데이터를 추출해주세요.
다음 정보를 찾아주세요:
- 프로젝트 제목
- 프로젝트 카테고리
- 관련 키워드/태그
- 사용자의 역할
- 주요 성과나 결과물
- 사용된 기술/도구
- 프로젝트에 대한 상세 설명

문서 내용:
{context}

위 문서들을 종합적으로 분석하여 프로젝트 메타데이터를 추출해주세요."""
        
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | llm
        
        result = chain.invoke({"context": context})
        return result.content
        
    except Exception as e:
        print(f"PDF 벡터 분석 오류: {str(e)}")
        return ""


def analyze_word(file_path: str) -> str:
    """Word 문서를 분석합니다."""
    try:
        loader = Docx2txtLoader(file_path)
        documents = loader.load()
        
        if not documents:
            return ""
        
        full_text = "\n\n".join([doc.page_content for doc in documents])
        return analyze_text_with_llm(full_text)
        
    except Exception as e:
        print(f"Word 문서 분석 오류: {str(e)}")
        return ""


def analyze_text_file(file_path: str) -> str:
    """텍스트 파일을 분석합니다."""
    encodings = ['utf-8', 'utf-8-sig', 'cp949', 'latin-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                full_text = f.read()
            
            if not full_text.strip():
                continue
            
            return analyze_text_with_llm(full_text)
        except (UnicodeDecodeError, UnicodeError):
            continue
        except Exception as e:
            print(f"텍스트 파일 분석 오류: {str(e)}")
            return ""
    
    print("텍스트 파일을 읽을 수 없습니다. 지원하지 않는 인코딩일 수 있습니다.")
    return ""


def analyze_link(url: str) -> str:
    """링크의 내용을 가져와서 분석합니다."""
    try:
        # 웹 페이지 내용 가져오기
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # HTML에서 텍스트 추출 (간단한 버전)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 스크립트와 스타일 제거
        for script in soup(["script", "style"]):
            script.decompose()
        
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # 텍스트가 너무 길면 앞부분만 사용
        if len(text) > 50000:
            text = text[:50000]
        
        return analyze_text_with_llm(text)
        
    except Exception as e:
        print(f"링크 분석 오류: {str(e)}")
        return ""


def analyze_text_with_llm(text: str) -> str:
    """LLM을 사용하여 텍스트를 분석합니다."""
    try:
        prompt = f"""다음 텍스트를 분석하여 프로젝트 메타데이터를 추출해주세요.
다음 정보를 찾아주세요:
- 프로젝트 제목
- 프로젝트 카테고리 (예: 웹 개발, 앱 개발, 데이터 분석, 기계학습 등)
- 관련 키워드/태그
- 사용자의 역할 (예: 개발자, 디자이너, PM 등)
- 주요 성과나 결과물
- 사용된 기술/도구
- 프로젝트에 대한 상세 설명

텍스트 내용:
{text}

위 텍스트를 분석하여 프로젝트 메타데이터를 추출해주세요."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"텍스트 분석 오류: {str(e)}")
        return ""


def extract_metadata_from_analysis(analysis_text: str, source_summary: str = None) -> Dict[str, Any]:
    """분석 결과에서 구조화된 메타데이터를 추출합니다."""
    try:
        prompt = f"""다음 분석 결과를 바탕으로 JSON 형식의 메타데이터를 생성해주세요.
반드시 다음 구조를 따르세요:

{{
  "project": {{
    "title": "프로젝트 제목 또는 null",
    "category": "프로젝트 카테고리 또는 null",
    "summary": "프로젝트 요약 또는 null",
    "tags": ["키워드1", "키워드2"] 또는 [],
    "roles": ["역할1", "역할2"] 또는 [],
    "achievements": ["성과1", "성과2"] 또는 [],
    "tools": ["도구1", "도구2"] 또는 [],
    "description": "상세 설명 또는 null"
  }},
  "status": "analyzed"
}}

분석 결과:
{analysis_text}

위 분석 결과에서 추출할 수 있는 정보만 채우고, 알 수 없는 항목은 null로 설정하세요.
배열 항목이 없으면 빈 배열 []로 설정하세요.
반드시 유효한 JSON 형식으로만 응답하세요. 다른 설명은 하지 마세요."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # source_summary가 제공되면 summary 필드를 덮어씁니다
        if source_summary and "project" in result:
            result["project"]["summary"] = source_summary
        
        return result
        
    except json.JSONDecodeError:
        # JSON 파싱 실패 시 기본 구조 반환
        return {
            "project": {
                "title": None,
                "category": None,
                "summary": source_summary,
                "tags": [],
                "roles": [],
                "achievements": [],
                "tools": [],
                "description": None
            },
            "status": "analyzed"
        }
    except Exception as e:
        print(f"메타데이터 추출 오류: {str(e)}")
        return {
            "project": {
                "title": None,
                "category": None,
                "summary": source_summary,
                "tags": [],
                "roles": [],
                "achievements": [],
                "tools": [],
                "description": None
            },
            "status": "analyzed"
        }


def is_url(input_string: str) -> bool:
    """입력이 URL인지 확인합니다."""
    try:
        result = urlparse(input_string)
        return all([result.scheme, result.netloc])
    except:
        return False


def detect_file_type(file_path: str) -> str:
    """파일 타입을 감지합니다."""
    if is_url(file_path):
        return "link"
    
    mime_type, _ = mimetypes.guess_type(file_path)
    
    if mime_type:
        if mime_type.startswith('image/'):
            return "image"
        elif mime_type == 'application/pdf':
            return "pdf"
        elif mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return "word"
        elif mime_type.startswith('text/'):
            return "text"
    
    # 확장자 기반 감지
    ext = Path(file_path).suffix.lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
        return "image"
    elif ext == '.pdf':
        return "pdf"
    elif ext in ['.doc', '.docx']:
        return "word"
    elif ext in ['.txt', '.md', '.py', '.js', '.html', '.css']:
        return "text"
    
    return "unknown"


def extract_project_metadata(file_path: str, source_name: str = None) -> Dict[str, Any]:
    """프로젝트 파일을 분석하여 메타데이터를 추출합니다."""
    file_type = detect_file_type(file_path)
    
    # source_summary 생성
    if source_name:
        file_name = source_name
    else:
        file_name = os.path.basename(file_path) if not is_url(file_path) else file_path
    
    if file_type == "link":
        source_summary = f"URL: {file_path}"
    else:
        source_summary = f"{file_name} 업로드됨"
    
    if file_type == "unknown":
        return {
            "project": {
                "title": None,
                "category": None,
                "summary": source_summary,
                "tags": [],
                "roles": [],
                "achievements": [],
                "tools": [],
                "description": None
            },
            "status": "error",
            "error": "지원하지 않는 파일 형식입니다."
        }
    
    print(f"파일 타입: {file_type}")
    print(f"분석 중...")
    
    # 파일 타입별 분석
    analysis_text = ""
    
    if file_type == "image":
        analysis_text = analyze_image(file_path)
    elif file_type == "pdf":
        analysis_text = analyze_pdf(file_path)
    elif file_type == "word":
        analysis_text = analyze_word(file_path)
    elif file_type == "text":
        analysis_text = analyze_text_file(file_path)
    elif file_type == "link":
        analysis_text = analyze_link(file_path)
    
    if not analysis_text:
        return {
            "project": {
                "title": None,
                "category": None,
                "summary": source_summary,
                "tags": [],
                "roles": [],
                "achievements": [],
                "tools": [],
                "description": None
            },
            "status": "error",
            "error": "파일 분석에 실패했습니다."
        }
    
    # 구조화된 메타데이터 추출
    metadata = extract_metadata_from_analysis(analysis_text, source_summary)
    
    return metadata


def analyze_project_from_formdata(
    file: Optional[UploadFile] = None,
    url: Optional[str] = None,
    text: Optional[str] = None
) -> Dict[str, Any]:
    """
    FormData로 받은 file, url, text를 분석하여 프로젝트 메타데이터를 추출합니다.
    
    Args:
        file: 업로드된 파일 (선택)
        url: 분석할 URL (선택)
        text: 분석할 텍스트 (선택)
    
    Returns:
        프로젝트 메타데이터 딕셔너리
    """
    temp_file_path = None
    
    try:
        # 우선순위: file > url > text
        if file and file.filename:
            # 파일을 임시 디렉토리에 저장
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, file.filename)
            
            # 파일 저장
            with open(temp_file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            # 파일 분석 (원본 파일명 전달)
            metadata = extract_project_metadata(temp_file_path, source_name=file.filename)
            return metadata
            
        elif url:
            # URL 분석
            metadata = extract_project_metadata(url)
            return metadata
            
        elif text:
            # 텍스트 직접 분석
            source_summary = "텍스트 직접 입력"
            analysis_text = analyze_text_with_llm(text)
            
            if not analysis_text:
                return {
                    "project": {
                        "title": None,
                        "category": None,
                        "summary": source_summary,
                        "tags": [],
                        "roles": [],
                        "achievements": [],
                        "tools": [],
                        "description": None
                    },
                    "status": "error",
                    "error": "텍스트 분석에 실패했습니다."
                }
            
            # 구조화된 메타데이터 추출
            metadata = extract_metadata_from_analysis(analysis_text, source_summary)
            return metadata
            
        else:
            # 입력이 없는 경우
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
                },
                "status": "error",
                "error": "file, url, text 중 하나 이상을 제공해야 합니다."
            }
            
    except Exception as e:
        print(f"FormData 분석 오류: {str(e)}")
        import traceback
        traceback.print_exc()
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
            },
            "status": "error",
            "error": f"분석 중 오류가 발생했습니다: {str(e)}"
        }
    finally:
        # 임시 파일 정리
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                temp_dir = os.path.dirname(temp_file_path)
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"임시 파일 삭제 오류: {str(e)}")


def main():
    """메인 함수"""
    import sys
    
    # Windows 콘솔 인코딩 설정
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    if len(sys.argv) < 2:
        print("사용법: python project_metadata_extractor.py <파일경로 또는 URL>")
        print("예시: python project_metadata_extractor.py project.pdf")
        print("예시: python project_metadata_extractor.py https://example.com/project")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    print("=" * 60)
    print("프로젝트 메타데이터 추출 AI")
    print("=" * 60)
    print()
    
    metadata = extract_project_metadata(file_path)
    
    # JSON 출력
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

