# Celeste Yacht AI - Multimodal Processing Module
# Handles image processing using CLIP-ViT-B/32 for technical drawings and manuals

import logging
import io
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import fitz  # PyMuPDF
import pytesseract
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiModalProcessor:
    """Processes documents with both text and visual content using CLIP-ViT-B/32"""
    
    def __init__(self):
        """Initialize CLIP model and processors"""
        logger.info("Initializing CLIP-ViT-B/32 model...")
        
        # Load CLIP-ViT-B/32 model
        self.model_name = "openai/clip-vit-base-patch32"
        self.clip_model = CLIPModel.from_pretrained(self.model_name)
        self.clip_processor = CLIPProcessor.from_pretrained(self.model_name)
        
        # Set device (use MPS for Mac Studio if available, otherwise CPU)
        if torch.backends.mps.is_available():
            self.device = torch.device("mps")
            logger.info("Using MPS (Apple Silicon) acceleration")
        elif torch.cuda.is_available():
            self.device = torch.device("cuda")
            logger.info("Using CUDA acceleration")
        else:
            self.device = torch.device("cpu")
            logger.info("Using CPU")
            
        self.clip_model = self.clip_model.to(self.device)
        
        # Marine/yacht context prompts for better understanding
        self.marine_context_prompts = [
            "yacht electrical wiring diagram",
            "boat engine schematic", 
            "marine navigation equipment",
            "yacht plumbing system",
            "boat hull damage assessment",
            "marine safety equipment",
            "yacht interior components",
            "boat deck hardware",
            "marine electronics installation",
            "yacht maintenance procedure"
        ]
        
        logger.info("CLIP-ViT-B/32 initialization complete")
    
    def process_pdf_document(self, pdf_path: str) -> Dict[str, Any]:
        """
        Process entire PDF document with multimodal approach
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Dict containing extracted text and visual contexts
        """
        logger.info(f"Processing PDF document: {pdf_path}")
        
        try:
            doc = fitz.open(pdf_path)
            results = {
                "document_path": pdf_path,
                "total_pages": len(doc),
                "pages": [],
                "processing_timestamp": datetime.now().isoformat(),
                "text_coverage": 0,
                "visual_coverage": 0
            }
            
            text_pages = 0
            visual_pages = 0
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_result = self.process_page(page, page_num)
                results["pages"].append(page_result)
                
                if page_result["has_text"]:
                    text_pages += 1
                if page_result["has_images"]:
                    visual_pages += 1
            
            results["text_coverage"] = (text_pages / len(doc)) * 100
            results["visual_coverage"] = (visual_pages / len(doc)) * 100
            
            doc.close()
            logger.info(f"PDF processing complete. Text coverage: {results['text_coverage']:.1f}%, Visual coverage: {results['visual_coverage']:.1f}%")
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return {"error": str(e), "success": False}
    
    def process_page(self, page, page_num: int) -> Dict[str, Any]:
        """
        Process individual PDF page with both text and visual extraction
        
        Args:
            page: PyMuPDF page object
            page_num: Page number
            
        Returns:
            Dict containing page analysis results
        """
        page_result = {
            "page_number": page_num + 1,
            "has_text": False,
            "has_images": False,
            "text_content": "",
            "visual_context": "",
            "combined_context": "",
            "confidence_scores": {}
        }
        
        # Extract text using PyMuPDF
        text_content = page.get_text()
        if text_content.strip():
            page_result["has_text"] = True
            page_result["text_content"] = text_content.strip()
        
        # Check for images and process with CLIP
        image_list = page.get_images()
        if image_list:
            page_result["has_images"] = True
            
            # Convert page to image for CLIP processing
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            
            # Process with CLIP
            visual_context, confidence = self.extract_visual_context(image)
            page_result["visual_context"] = visual_context
            page_result["confidence_scores"] = confidence
            
            # Try OCR on the image as fallback
            try:
                ocr_text = pytesseract.image_to_string(image)
                if ocr_text.strip() and not page_result["has_text"]:
                    page_result["text_content"] = ocr_text.strip()
                    page_result["has_text"] = True
            except Exception as e:
                logger.warning(f"OCR failed for page {page_num + 1}: {str(e)}")
        
        # Combine contexts
        page_result["combined_context"] = self.combine_contexts(
            page_result["text_content"], 
            page_result["visual_context"]
        )
        
        return page_result
    
    def extract_visual_context(self, image: Image.Image) -> Tuple[str, Dict]:
        """
        Extract visual context from image using CLIP-ViT-B/32
        
        Args:
            image: PIL Image object
            
        Returns:
            Tuple of (visual_context_description, confidence_scores)
        """
        try:
            # Prepare inputs for CLIP
            inputs = self.clip_processor(
                text=self.marine_context_prompts,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # Get top matches
            top_indices = torch.topk(probs, k=3, dim=1).indices[0]
            top_probs = torch.topk(probs, k=3, dim=1).values[0]
            
            # Build visual context description
            context_parts = []
            confidence_scores = {}
            
            for idx, prob in zip(top_indices, top_probs):
                prompt = self.marine_context_prompts[idx.item()]
                confidence = prob.item()
                confidence_scores[prompt] = confidence
                
                if confidence > 0.1:  # Only include if reasonably confident
                    context_parts.append(f"{prompt} (confidence: {confidence:.2f})")
            
            visual_context = "Visual content suggests: " + ", ".join(context_parts) if context_parts else "Generic technical diagram or image"
            
            return visual_context, confidence_scores
            
        except Exception as e:
            logger.error(f"Error in visual context extraction: {str(e)}")
            return "Error processing visual content", {}
    
    def combine_contexts(self, text_content: str, visual_context: str) -> str:
        """
        Combine text and visual contexts into unified description
        
        Args:
            text_content: Extracted text content
            visual_context: Visual context from CLIP
            
        Returns:
            Combined context string
        """
        if text_content and visual_context:
            return f"TEXT: {text_content}\n\nVISUAL: {visual_context}"
        elif text_content:
            return f"TEXT: {text_content}"
        elif visual_context:
            return f"VISUAL: {visual_context}"
        else:
            return "No content extracted"
    
    def process_single_image(self, image_path: str) -> Dict[str, Any]:
        """
        Process a single image file with CLIP
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict containing image analysis results
        """
        try:
            image = Image.open(image_path)
            visual_context, confidence = self.extract_visual_context(image)
            
            return {
                "image_path": image_path,
                "visual_context": visual_context,
                "confidence_scores": confidence,
                "processing_timestamp": datetime.now().isoformat(),
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return {"error": str(e), "success": False}

if __name__ == "__main__":
    # Test the multimodal processor
    processor = MultiModalProcessor()
    print("CLIP-ViT-B/32 processor initialized successfully!")
    print(f"Using device: {processor.device}")
    print(f"Model: {processor.model_name}") 