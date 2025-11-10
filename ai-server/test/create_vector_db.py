"""
PDF 파일들을 벡터 DB로 변환하는 스크립트
이 스크립트를 실행하여 PDF 파일들을 벡터 DB로 변환한 후,
챗봇에서는 벡터 DB만 사용하여 답변을 생성합니다.
"""

import os
import glob
import shutil
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# .env 파일 로드
load_dotenv()

def create_vector_database():
    """PDF 파일들을 벡터 DB로 변환합니다."""
    
    # OpenAI API 키 확인
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("❌ OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")
        return False
    
    print("🚀 PDF 파일들을 벡터 DB로 변환을 시작합니다...")
    
    # 현재 디렉토리에서 PDF 파일들 찾기 (중복 제거)
    pdf_patterns = ["*.pdf", "*.PDF"]
    all_pdf_files = []
    for pattern in pdf_patterns:
        all_pdf_files.extend(glob.glob(pattern))
    
    # 중복 제거 (대소문자 구분 없이)
    pdf_files = []
    seen_files = set()
    for pdf_file in all_pdf_files:
        file_lower = pdf_file.lower()
        if file_lower not in seen_files:
            seen_files.add(file_lower)
            pdf_files.append(pdf_file)
    
    if not pdf_files:
        print("❌ PDF 파일을 찾을 수 없습니다.")
        return False
    
    print(f"📁 발견된 PDF 파일: {len(pdf_files)}개")
    
    # 모든 문서 수집
    all_documents = []
    
    for pdf_file in pdf_files:
        try:
            print(f"📄 {pdf_file} 처리 중...")
            
            # PDF 로딩
            loader = PyPDFLoader(pdf_file)
            file_documents = loader.load()
            
            # 파일명을 메타데이터에 추가
            for doc in file_documents:
                doc.metadata['source'] = pdf_file
                doc.metadata['file_type'] = 'pdf'
                doc.metadata['original_filename'] = pdf_file
                doc.metadata['file_path'] = os.path.abspath(pdf_file)
            
            all_documents.extend(file_documents)
            print(f"✅ {pdf_file} 처리 완료")
            
        except Exception as e:
            print(f"❌ {pdf_file} 처리 중 오류: {str(e)}")
            continue
    
    if not all_documents:
        print("❌ 처리할 수 있는 문서가 없습니다.")
        return False
    
    print(f"📄 총 {len(all_documents)}개의 문서 페이지를 수집했습니다.")
    
    # 텍스트 분할
    print("🔪 텍스트 청킹 중...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(all_documents)
    
    print(f"📄 {len(splits)}개의 텍스트 청크를 생성했습니다.")
    
    # 기존 벡터 DB 삭제
    if os.path.exists("./vector_db"):
        print("🗑️ 기존 벡터 DB 삭제 중...")
        shutil.rmtree("./vector_db")
    
    # 임베딩 모델 설정
    print("🧠 임베딩 모델 로딩 중...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    
    # 벡터 DB 생성
    print("💾 벡터 DB 생성 중...")
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory="./vector_db"
    )
    
    # 벡터 DB 저장
    vectorstore.persist()
    
    print("✅ 벡터 DB 생성이 완료되었습니다!")
    print(f"📊 생성된 청크 수: {len(splits)}")
    print(f"📁 저장 위치: ./vector_db")
    
    return True

def main():
    """메인 함수"""
    print("=" * 60)
    print("📚 PDF to Vector DB 변환기")
    print("=" * 60)
    
    success = create_vector_database()
    
    if success:
        print("\n🎉 변환이 성공적으로 완료되었습니다!")
        print("\n📋 다음 단계:")
        print("1. PDF 파일들을 안전한 곳으로 이동하거나 삭제")
        print("2. .gitignore에 PDF 파일들이 포함되어 있는지 확인")
        print("3. 챗봇을 실행하여 벡터 DB만 사용하는지 테스트")
    else:
        print("\n❌ 변환 중 오류가 발생했습니다.")
        print("API 키 설정과 PDF 파일 존재 여부를 확인해주세요.")

if __name__ == "__main__":
    main()
