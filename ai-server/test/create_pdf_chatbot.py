import os
# protobuf 호환성을 위한 환경변수 설정 (다른 모든 import보다 먼저!)
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

try:
    __import__('pysqlite3')
    import sys
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
    print("<<<<< sqlite3 patched with pysqlite3 >>>>>")
except ImportError:
    # pysqlite3가 없으면 기본 sqlite3 사용
    print("<<<<< using default sqlite3 >>>>>")

print("<<<<< app.app.py IS BEING LOADED (sqlite3 patched with pysqlite3) >>>>>") # 패치 내용 명시

import streamlit as st
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import LLMResult
from typing import Dict, List, Any
import time
import base64

# .env 파일 로드 (현재 디렉토리에서 .env 파일 찾기)
load_dotenv(verbose=True)

st.set_page_config(page_title="벡터 DB 챗봇", page_icon=":books:", layout="wide")

st.title("📚 벡터 DB 챗봇")
st.caption("벡터 DB를 기반으로 질문에 답변합니다")

# OpenAI API 키 로드
openai_api_key = os.getenv("OPENAI_API_KEY")

# API 키 상태 확인 및 디버깅 정보
if not openai_api_key:
    st.warning("⚠️ .env 파일을 찾을 수 없거나 OPENAI_API_KEY가 설정되지 않았습니다.")
    st.info("📝 .env 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:")
    st.code("OPENAI_API_KEY=your_actual_api_key_here")
else:
    st.success("✅ .env 파일이 성공적으로 로드되었습니다.")

# 파일 다운로드 함수 (벡터 DB에서 추출한 정보 기반)
def get_file_download_link(file_path, file_name):
    """파일 다운로드 링크를 생성합니다."""
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            bytes_data = f.read()
        b64 = base64.b64encode(bytes_data).decode()
        href = f'<a href="data:application/pdf;base64,{b64}" download="{file_name}" target="_blank">📥 {file_name} 다운로드</a>'
        return href
    else:
        return f"⚠️ 파일을 찾을 수 없습니다: {file_name}"

# 스트리밍을 위한 콜백 핸들러
class StreamlitCallbackHandler(BaseCallbackHandler):
    def __init__(self, container):
        self.container = container
        self.text = ""
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.text += token
        self.container.markdown(self.text + "▋")  # 커서 효과
        time.sleep(0.01)  # 자연스러운 타이핑 효과

    def on_llm_end(self, response: LLMResult, **kwargs) -> None:
        self.container.markdown(self.text)  # 최종 텍스트 (커서 제거)

# 벡터 DB 로드 함수
def load_vector_database():
    """벡터 DB를 로드합니다."""
    try:
        if not os.path.exists("./vector_db"):
            st.error("❌ 벡터 DB를 찾을 수 없습니다.")
            st.info("📝 먼저 create_vector_db.py 스크립트를 실행하여 벡터 DB를 생성해주세요.")
            return None
        
        # 임베딩 모델 설정
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        
        # 벡터 DB 로드
        vectorstore = Chroma(
            persist_directory="./vector_db",
            embedding_function=embeddings
        )
        
        st.success("✅ 벡터 DB가 성공적으로 로드되었습니다.")
        return vectorstore
        
    except Exception as e:
        st.error(f"❌ 벡터 DB 로드 중 오류 발생: {str(e)}")
        return None

# RAG 질의응답 함수 (출처 정보 포함)
def get_rag_response_with_sources(question, vectorstore, api_key, container):
    """RAG를 사용하여 질문에 답변하고 출처 정보를 반환합니다."""
    try:
        # 관련 문서 검색
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        relevant_docs = retriever.get_relevant_documents(question)
        
        # 출처 정보 수집
        sources = []
        source_files = set()
        for doc in relevant_docs:
            source_file = doc.metadata.get('source', 'Unknown')
            source_files.add(source_file)
            sources.append({
                'content': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                'source': source_file,
                'page': doc.metadata.get('page', 'Unknown')
            })
        
        # LLM 설정
        llm = ChatOpenAI(
            openai_api_key=api_key,
            model_name="gpt-4o-mini",
            temperature=0
        )
        
        # 프롬프트 템플릿 설정
        prompt_template = """
        당신은 전문가입니다. 제공된 여러 PDF 문서들을 바탕으로 정확하고 유용한 답변을 제공해주세요.
        문서에 없는 내용은 추측하지 말고, 모를 경우 솔직히 말씀해주세요.
        여러 문서에서 관련 정보를 찾아 종합적으로 답변해주세요.
        
        문서 내용:
        {context}
        
        질문: {question}
        
        답변:
        """
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # RetrievalQA 체인 생성
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
        
        # 질의응답 실행
        result = qa_chain.invoke({"query": question})
        
        return result['result'], source_files, sources
        
    except Exception as e:
        error_msg = f"답변 생성 중 오류가 발생했습니다: {str(e)}"
        container.error(error_msg)
        return error_msg, set(), []

# 사이드바
with st.sidebar:
    st.header("📊 벡터 DB 상태")
    
    # 벡터 DB 존재 여부 확인
    if os.path.exists("./vector_db"):
        st.success("✅ 벡터 DB가 존재합니다")
        st.info("📁 저장 위치: ./vector_db")
        
        # 벡터 DB 정보 표시
        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
            vectorstore = Chroma(
                persist_directory="./vector_db",
                embedding_function=embeddings
            )
            
            # 컬렉션 정보 가져오기
            collection = vectorstore._collection
            count = collection.count()
            st.write(f"📊 저장된 청크 수: {count}")
            
        except Exception as e:
            st.warning(f"⚠️ 벡터 DB 정보를 가져올 수 없습니다: {str(e)}")
    else:
        st.error("❌ 벡터 DB가 존재하지 않습니다")
        st.info("📝 create_vector_db.py 스크립트를 실행하여 벡터 DB를 생성해주세요")
    
    st.divider()
    st.header("⚙️ 설정")
    if not openai_api_key:
        st.error("⚠️ .env 파일에 OPENAI_API_KEY를 설정해주세요!")
        st.info("📝 .env 파일 예시:")
        st.code("OPENAI_API_KEY=your_actual_api_key_here")
        st.info("💡 .env 파일은 프로젝트 루트 디렉토리에 생성하세요.")
    else:
        st.success("✅ OpenAI API 키가 설정되었습니다.")
        # API 키 일부만 표시 (보안)
        masked_key = openai_api_key[:8] + "..." + openai_api_key[-4:] if len(openai_api_key) > 12 else "***"
        st.info(f"🔑 API 키: {masked_key}")

# 세션 상태 초기화
if 'messages' not in st.session_state:
    st.session_state.messages = []

if 'vectorstore' not in st.session_state:
    st.session_state.vectorstore = None

if 'sources' not in st.session_state:
    st.session_state.sources = {}

# 벡터 DB 로드 (한 번만 실행)
if st.session_state.vectorstore is None:
    with st.spinner("📊 벡터 DB를 로드하고 있습니다... 잠시만 기다려주세요!"):
        st.session_state.vectorstore = load_vector_database()

# 기존 메시지 표시
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        # 출처 정보가 있으면 표시
        if message["role"] == "assistant" and message.get("sources"):
            with st.expander("📚 참고한 문서들"):
                for source in message["sources"]:
                    st.write(f"**📄 {source['source']}**")
                    st.write(f"**페이지:** {source['page']}")
                    st.write(f"**내용:** {source['content']}")
                    st.markdown("---")

# 사용자 입력 처리
if user_question := st.chat_input(placeholder="벡터 DB에 저장된 문서들에 대한 질문을 해주세요... 💬"):
    # API 키 확인
    if not openai_api_key:
        st.error("OpenAI API 키를 먼저 설정해주세요! .env 파일을 확인해주세요.")
    elif st.session_state.vectorstore is None:
        st.error("벡터 DB 로드에 실패했습니다.")
    else:
        # 사용자 질문 표시
        with st.chat_message("user"):
            st.markdown(user_question)
        st.session_state.messages.append({"role": "user", "content": user_question})

        # AI 답변 생성
        with st.chat_message("assistant"):
            # 답변 생성
            ai_response, source_files, sources = get_rag_response_with_sources(
                user_question, 
                st.session_state.vectorstore, 
                openai_api_key,
                st.empty()
            )
            
            # 답변 표시
            st.markdown(ai_response)
            
            # 출처 정보 표시
            if source_files:
                st.markdown("---")
                st.markdown("### 📚 참고한 문서들")
                
                # 출처 파일 목록 및 다운로드
                st.markdown("**참고한 PDF 파일:**")
                for source_file in source_files:
                    st.write(f"📄 {source_file}")
                    # 파일이 존재하는 경우에만 다운로드 링크 제공
                    if os.path.exists(source_file):
                        download_link = get_file_download_link(source_file, source_file)
                        st.markdown(download_link, unsafe_allow_html=True)
                    else:
                        st.info(f"⚠️ 원본 파일이 없습니다: {source_file}")
                
                # 상세 출처 정보
                with st.expander("🔍 상세 출처 정보"):
                    for i, source in enumerate(sources, 1):
                        st.markdown(f"**{i}. {source['source']}**")
                        st.write(f"**페이지:** {source['page']}")
                        st.write(f"**관련 내용:** {source['content']}")
                        st.markdown("---")
            
        # 메시지 저장 (출처 정보 포함)
        st.session_state.messages.append({
            "role": "assistant", 
            "content": ai_response,
            "sources": sources
        })

# 대화 초기화 버튼
if st.button("🗑️ 대화 초기화"):
    st.session_state.messages = []
    st.rerun()

# 하단에 사용 팁 추가
st.divider()
with st.expander("💡 사용 팁"):
    st.markdown("""
    **이 챗봇은 어떻게 작동하나요?**
    - 📊 벡터 DB에 저장된 문서 정보를 기반으로 답변합니다
    - 🔍 관련 정보를 검색하여 정확한 답변을 제공합니다
    - 📚 답변의 출처를 명확히 표시합니다
    - 🧠 여러 문서의 정보를 종합하여 답변합니다
    
    **더 나은 답변을 위한 팁:**
    - 구체적이고 명확한 질문을 해주세요
    - 문서 속 관련 전문 용어를 사용해도 좋습니다
    - 문서에 없는 내용은 솔직히 "모른다"고 답변할 수 있습니다
    - 여러 문서에서 관련 정보를 찾아 종합적으로 답변합니다
    
    **예시 질문:**
    - "YOI-614B POE CARD 인식 불량의 원인은 무엇인가요?"
    - "블루스크린 발생 원인과 대책방안을 설명해주세요"
    - "BPS-400S 스텐바이 5V 분석 결과는 어떻게 되나요?"
    
    **벡터 DB 생성:**
    - PDF 파일이 있는 상태에서 `python create_vector_db.py` 실행
    - 벡터 DB 생성 후 PDF 파일은 안전한 곳으로 이동
    """)

# 디버깅용 (개발 환경에서만)
if st.checkbox("🔧 디버그 모드"):
    st.json({"메시지 개수": len(st.session_state.messages)})
    st.json({"벡터 DB 존재": os.path.exists("./vector_db")})
    
    if os.path.exists("./vector_db"):
        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
            vectorstore = Chroma(
                persist_directory="./vector_db",
                embedding_function=embeddings
            )
            collection = vectorstore._collection
            count = collection.count()
            st.json({"벡터 DB 청크 수": count})
        except Exception as e:
            st.json({"벡터 DB 오류": str(e)})
    
    with st.expander("전체 대화 내역"):
        st.json(st.session_state.messages)