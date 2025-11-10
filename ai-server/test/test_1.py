from fpdf import FPDF
import os

pdf = FPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.set_font("Arial", size=12)

# PDF 내용 생성 (연구주제 + AI 관련 내용)
research_text = """
This is a test PDF for demonstration purposes.

Research Topic: Applications of Artificial Intelligence in Marketing Analytics

Abstract:
Artificial Intelligence (AI) has significantly transformed the field of marketing analytics by enabling more precise customer segmentation, predictive modeling, and personalized recommendation systems. This study explores the integration of AI techniques such as machine learning, natural language processing (NLP), and computer vision in marketing strategies, particularly in consumer behavior analysis.

Introduction:
With the rapid growth of digital data, businesses face the challenge of understanding customer preferences and predicting market trends. Traditional marketing methods often fall short in processing large-scale datasets and extracting actionable insights. AI provides powerful tools to analyze consumer behavior, optimize marketing campaigns, and improve decision-making.

Methodology:
1. Data Collection: Gathering structured and unstructured data from online platforms, social media, and sales records.
2. Data Preprocessing: Cleaning, normalizing, and transforming data for analysis.
3. Machine Learning Models: Implementing supervised and unsupervised learning techniques for customer segmentation and purchase prediction.
4. Natural Language Processing: Analyzing customer reviews and social media posts to identify sentiment and emerging trends.
5. Computer Vision: Recognizing patterns and preferences in visual content, such as product images and advertisements.

Results:
AI-based approaches demonstrated improved accuracy in predicting customer preferences, higher engagement in personalized campaigns, and increased sales conversion rates. The implementation of recommendation systems tailored to individual consumer behavior showed a 20% increase in click-through rates compared to traditional methods.

Discussion:
The integration of AI in marketing analytics allows for more effective targeting and resource allocation. Ethical considerations, such as data privacy and algorithmic transparency, must be addressed to ensure responsible AI deployment.

Conclusion:
Artificial Intelligence offers transformative potential in marketing analytics, enhancing customer understanding and campaign effectiveness. Future research should focus on multi-modal AI approaches and real-time adaptive marketing systems.

This PDF contains over 10,000 characters for testing purposes.
""" * 13  # 반복하여 10,000자 이상 생성

pdf.multi_cell(0, 5, research_text)

# 파일 저장 - 현재 폴더에 저장
file_path = "ai_research_test_2.pdf"
pdf.output(file_path)
print(f"PDF 파일이 저장되었습니다: {os.path.abspath(file_path)}")
