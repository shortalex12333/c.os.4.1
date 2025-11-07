#!/usr/bin/env python3
"""
Test script for CLIP-ViT-B/32 integration
Demonstrates multimodal processing capabilities
"""

import sys
import os
from ingestion import YachtDataIngestion

def test_clip_installation():
    """Test if CLIP and dependencies are properly installed"""
    print("🔍 Testing CLIP-ViT-B/32 Installation...")
    print("-" * 50)
    
    try:
        # Test imports
        import torch
        import transformers
        from PIL import Image
        import fitz  # PyMuPDF
        
        print("✅ Core dependencies installed:")
        print(f"   - PyTorch: {torch.__version__}")
        print(f"   - Transformers: {transformers.__version__}")
        print(f"   - PyMuPDF: {fitz.__version__}")
        
        # Test MPS availability on Mac
        if torch.backends.mps.is_available():
            print("✅ MPS (Apple Silicon) acceleration available")
        elif torch.cuda.is_available():
            print("✅ CUDA acceleration available")
        else:
            print("⚠️  Using CPU (install CUDA or use Apple Silicon for acceleration)")
        
        return True
        
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\n💡 To install missing dependencies, run:")
        print("   pip install -r requirements.txt")
        return False

def test_multimodal_processor():
    """Test the multimodal processor initialization"""
    print("\n🤖 Testing Multimodal Processor...")
    print("-" * 50)
    
    try:
        from multimodal_processor import MultiModalProcessor
        processor = MultiModalProcessor()
        
        print("✅ CLIP-ViT-B/32 processor initialized successfully")
        print(f"   - Model: {processor.model_name}")
        print(f"   - Device: {processor.device}")
        print(f"   - Marine context prompts: {len(processor.marine_context_prompts)} prompts")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return False

def test_yacht_ingestion():
    """Test the updated yacht data ingestion"""
    print("\n📊 Testing Yacht Data Ingestion...")
    print("-" * 50)
    
    try:
        ingestion = YachtDataIngestion()
        
        print("✅ YachtDataIngestion initialized")
        print(f"   - Supported formats: {ingestion.supported_formats}")
        
        if ingestion.multimodal_processor:
            print("✅ Multimodal processor ready for PDF/image processing")
        else:
            print("⚠️  Multimodal processor not available")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize ingestion: {e}")
        return False

def demo_usage():
    """Show usage examples"""
    print("\n📚 Usage Examples:")
    print("-" * 50)
    
    print("1. Process a PDF manual:")
    print("   from ingestion import YachtDataIngestion")
    print("   ingestion = YachtDataIngestion()")
    print("   result = ingestion.ingest_yacht_data('yacht_manual.pdf', 'pdf')")
    
    print("\n2. Process a single image:")
    print("   result = ingestion.ingest_yacht_data('wiring_diagram.png', 'png')")
    
    print("\n3. Direct multimodal processing:")
    print("   from multimodal_processor import MultiModalProcessor")
    print("   processor = MultiModalProcessor()")
    print("   result = processor.process_pdf_document('technical_manual.pdf')")

def main():
    """Run all tests"""
    print("🛥️  Celeste Yacht AI - CLIP-ViT-B/32 Test Suite")
    print("=" * 60)
    
    success_count = 0
    total_tests = 3
    
    # Run tests
    if test_clip_installation():
        success_count += 1
    
    if test_multimodal_processor():
        success_count += 1
    
    if test_yacht_ingestion():
        success_count += 1
    
    # Show results
    print("\n" + "=" * 60)
    print(f"📈 Test Results: {success_count}/{total_tests} passed")
    
    if success_count == total_tests:
        print("🎉 All tests passed! CLIP-ViT-B/32 is ready for use.")
        demo_usage()
    else:
        print("⚠️  Some tests failed. Please install missing dependencies:")
        print("   pip install -r requirements.txt")
    
    print("\n💾 Model download info:")
    print("   - CLIP-ViT-B/32 (~512MB) will download on first use")
    print("   - Cached locally for future runs")
    print("   - Optimized for Mac Studio MPS acceleration")

if __name__ == "__main__":
    main() 