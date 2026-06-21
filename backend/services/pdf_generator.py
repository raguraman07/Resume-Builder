import io
import logging
from xhtml2pdf import pisa

# Set up logging to see errors in your terminal
logging.basicConfig(level=logging.INFO)

def html_to_pdf(html_content):
    """
    Converts HTML string with styling into a PDF byte stream.
    """
    try:
        pdf_buffer = io.BytesIO()
        
        # pisa.CreatePDF returns a PISA object which tracks errors
        pisa_status = pisa.CreatePDF(
            src=html_content,
            dest=pdf_buffer,
            encoding='utf-8'
        )
        
        if pisa_status.err:
            print(f"--- PISA PDF CONVERSION ERROR ---")
            print(f"Error count: {pisa_status.err}")
            return None
            
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
    except Exception as e:
        print(f"--- CRITICAL ERROR IN PDF GENERATOR: {e} ---")
        return None