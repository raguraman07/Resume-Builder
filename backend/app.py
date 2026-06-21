import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import traceback

from services.ats_checker import check_ats_score
from services.ai_advisor import generate_ai_suggestions
from services.pdf_generator import html_to_pdf

app = Flask(__name__)
# Enable CORS for local dev environment
CORS(app)

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'online',
        'message': 'Resume Builder API is running'
    })

@app.route('/api/ats-check', methods=['POST'])
def ats_check():
    """
    Accepts resume data JSON and platform selection to calculate ATS score.
    """
    try:
        data = request.json or {}
        resume_data = data.get('resumeData', {})
        platform = data.get('platform', 'general')
        
        results = check_ats_score(resume_data, platform)
        return jsonify(results)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to process ATS check'
        }), 400

@app.route('/api/ai-suggest', methods=['POST'])
def ai_suggest():
    """
    Accepts current section text, category, and target platform. Returns optimized text.
    """
    try:
        data = request.json or {}
        prompt_type = data.get('type')  # 'summary', 'experience', 'skills'
        current_text = data.get('text', '')
        platform = data.get('platform', 'general')
        
        if not prompt_type:
            return jsonify({'error': 'Missing suggestion type'}), 400
            
        results = generate_ai_suggestions(prompt_type, current_text, platform)
        return jsonify(results)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to generate AI suggestion'
        }), 400

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.json or {}
        html_content = data.get('html')
        filename = data.get('filename', 'Resume.pdf')
        
        if not html_content:
            return jsonify({'error': 'Missing HTML content'}), 400
            
        if not filename.endswith('.pdf'):
            filename += '.pdf'
            
        # The styled_html string injection
        styled_html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
            @page {{ size: letter; margin: 0.4in; }}
            body {{ font-family: Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; color: #2D3748; }}
            .pdf-row {{ display: block; width: 100%; clear: both; }}
            .pdf-col-12 {{ width: 100%; float: left; }}
            .pdf-col-8 {{ width: 66.66%; float: left; }}
            .pdf-col-4 {{ width: 33.33%; float: left; }}
            .pdf-col-6 {{ width: 50%; float: left; }}
            .pdf-col-3 {{ width: 25%; float: left; }}
        </style></head><body>{html_content}</body></html>"""
        
        pdf_bytes = html_to_pdf(styled_html)
        
        if pdf_bytes is None:
            # THIS IS WHERE YOU WILL FIND THE REAL ERROR IN YOUR TERMINAL
            print("PDF generation returned None. Check your HTML/CSS compatibility.")
            return jsonify({'error': 'PDF generation failed - check server logs'}), 500
            
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        # This will print the exact line number and cause of the crash to your terminal
        traceback.print_exc()
        return jsonify({'error': str(e), 'message': 'Server error during PDF export'}), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(debug=True, port=5000)
