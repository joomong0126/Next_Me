"""
터미널 기반 이미지 분석 챗봇
OpenAI Vision API를 사용하여 이미지를 분석하고 대화합니다.
"""

import os
import base64
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

# .env 파일 로드
load_dotenv(verbose=True)

# OpenAI API 키 확인
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("❌ OPENAI_API_KEY가 설정되지 않았습니다.")
    print("📝 .env 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:")
    print("OPENAI_API_KEY=your_actual_api_key_here")
    exit(1)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=openai_api_key)

def encode_image_to_base64(image_path):
    """이미지 파일을 base64로 인코딩합니다."""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"❌ 이미지 파일 읽기 오류: {str(e)}")
        return None

def analyze_image(image_path, user_question=None, conversation_history=None):
    """OpenAI Vision API를 사용하여 이미지를 분석합니다."""
    try:
        # 이미지 base64 인코딩
        base64_image = encode_image_to_base64(image_path)
        if not base64_image:
            return None
        
        # 대화 히스토리 구성
        messages = []
        
        # 이전 대화 내용 추가
        if conversation_history:
            for msg in conversation_history:
                messages.append(msg)
        
        # 기본 프롬프트 설정
        if user_question:
            prompt = user_question
        else:
            prompt = """이 이미지를 자세히 분석해주세요. 
다음 항목들을 포함하여 설명해주세요:
1. 이미지의 주요 내용과 구성
2. 눈에 띄는 특징이나 패턴
3. 기술적인 세부사항 (있는 경우)
4. 발견된 문제점이나 이상사항 (있는 경우)
5. 전반적인 평가 및 의견"""
        
        # 현재 메시지 추가
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        })
        
        # Vision API 호출
        print("🤔 이미지를 분석하고 있습니다...")
        response = client.chat.completions.create(
            model="gpt-4o",  # 또는 "gpt-4o-mini"
            messages=messages,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"❌ 이미지 분석 중 오류가 발생했습니다: {str(e)}"

def format_conversation_for_api(conversation_history, image_path):
    """대화 히스토리를 API 형식으로 변환합니다."""
    messages = []
    
    for msg in conversation_history:
        if msg["role"] == "user":
            # 사용자 메시지는 텍스트만
            messages.append({
                "role": "user",
                "content": msg["content"]
            })
        elif msg["role"] == "assistant":
            # 어시스턴트 메시지는 텍스트만
            messages.append({
                "role": "assistant",
                "content": msg["content"]
            })
    
    return messages

def main():
    """메인 함수"""
    print("=" * 60)
    print("🖼️  이미지 분석 챗봇 (터미널 버전)")
    print("=" * 60)
    print()
    
    # 기본 이미지 경로 확인
    default_image_path = "img_check.jpg"
    
    # 이미지 경로 입력
    print("📤 이미지 파일 경로를 입력하세요:")
    if os.path.exists(default_image_path):
        print(f"   (기본값: {default_image_path} - Enter 키를 누르면 기본 이미지 사용)")
    image_path = input("이미지 경로: ").strip()
    
    if not image_path:
        if os.path.exists(default_image_path):
            image_path = default_image_path
            print(f"✅ 기본 이미지 사용: {image_path}")
        else:
            print("❌ 이미지 경로가 입력되지 않았습니다.")
            return
    else:
        # 따옴표 제거 (복사-붙여넣기 시 발생할 수 있음)
        image_path = image_path.strip('"').strip("'")
    
    # 이미지 파일 존재 확인
    if not os.path.exists(image_path):
        print(f"❌ 이미지 파일을 찾을 수 없습니다: {image_path}")
        return
    
    # 이미지 파일 유효성 확인
    try:
        img = Image.open(image_path)
        print(f"✅ 이미지 로드 성공: {image_path}")
        print(f"   이미지 크기: {img.size[0]} x {img.size[1]}")
        print()
    except Exception as e:
        print(f"❌ 이미지 파일을 열 수 없습니다: {str(e)}")
        return
    
    # 대화 히스토리 초기화
    conversation_history = []
    
    # 초기 분석
    print("=" * 60)
    print("🔍 초기 이미지 분석")
    print("=" * 60)
    initial_analysis = analyze_image(image_path, conversation_history=conversation_history)
    
    if initial_analysis:
        print("\n📝 분석 결과:")
        print("-" * 60)
        print(initial_analysis)
        print("-" * 60)
        
        # 대화 히스토리에 추가
        conversation_history.append({
            "role": "assistant",
            "content": initial_analysis
        })
    else:
        print("❌ 이미지 분석에 실패했습니다.")
        return
    
    print()
    print("=" * 60)
    print("💬 이미지에 대해 질문하세요 (종료: 'quit', 'exit', 'q')")
    print("=" * 60)
    print()
    
    # 대화 루프
    while True:
        try:
            # 사용자 질문 입력
            user_question = input("\n💭 질문: ").strip()
            
            # 종료 명령 확인
            if user_question.lower() in ['quit', 'exit', 'q', '종료']:
                print("\n👋 대화를 종료합니다. 감사합니다!")
                break
            
            if not user_question:
                print("⚠️ 질문을 입력해주세요.")
                continue
            
            # 대화 히스토리에 사용자 질문 추가
            conversation_history.append({
                "role": "user",
                "content": user_question
            })
            
            # API 형식으로 변환 (이미지 포함)
            api_messages = format_conversation_for_api(conversation_history[:-1], image_path)
            
            # 마지막 사용자 질문에 이미지 포함하여 추가
            base64_image = encode_image_to_base64(image_path)
            if base64_image:
                api_messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_question
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                })
            
            # 답변 생성
            print("\n🤔 답변을 생성하고 있습니다...")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=api_messages,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content
            
            # 답변 출력
            print("\n🤖 답변:")
            print("-" * 60)
            print(ai_response)
            print("-" * 60)
            
            # 대화 히스토리에 추가
            conversation_history.append({
                "role": "assistant",
                "content": ai_response
            })
            
        except KeyboardInterrupt:
            print("\n\n👋 대화를 종료합니다. 감사합니다!")
            break
        except Exception as e:
            print(f"\n❌ 오류가 발생했습니다: {str(e)}")
            print("다시 시도해주세요.")

if __name__ == "__main__":
    main()

