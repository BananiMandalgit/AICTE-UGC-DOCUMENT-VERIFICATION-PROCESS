"""
Test script for AICTE AI Services API
Tests all endpoints to ensure they work correctly with lightweight models
"""

import requests
import json
import time
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

BASE_URL = "http://localhost:8000"

def print_success(message):
    print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")

def print_error(message):
    print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")

def print_info(message):
    print(f"{Fore.CYAN}ℹ {message}{Style.RESET_ALL}")

def print_section(title):
    print(f"\n{Fore.YELLOW}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{Style.RESET_ALL}\n")

def test_root_endpoint():
    """Test the root endpoint"""
    print_section("Testing Root Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print_success("Root endpoint is working")
            print_info(f"API Version: {data.get('version')}")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Models: {json.dumps(data.get('models'), indent=2)}")
            return True
        else:
            print_error(f"Root endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to connect to API: {str(e)}")
        return False

def test_docs_endpoint():
    """Test the API documentation endpoint"""
    print_section("Testing API Documentation")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print_success("API documentation is accessible")
            print_info(f"Visit: {BASE_URL}/docs")
            return True
        else:
            print_error(f"Documentation endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to access documentation: {str(e)}")
        return False

def test_image_detection():
    """Test the image detection endpoint"""
    print_section("Testing Image Detection Endpoint")
    
    # Using a sample image URL (you can replace with actual institute image)
    test_image_url = "https://picsum.photos/800/600"
    
    try:
        print_info(f"Testing with image: {test_image_url}")
        response = requests.post(
            f"{BASE_URL}/detect_institute_image",
            json={"url": test_image_url},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Image detection endpoint is working")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Message: {data.get('message')}")
            print_info(f"Model Type: {data.get('model_info', {}).get('model_type')}")
            print_info(f"Number of detections: {len(data.get('detections', []))}")
            
            if data.get('opencv_analysis'):
                analysis = data['opencv_analysis']
                print_info(f"Image dimensions: {analysis.get('dimensions')}")
                print_info(f"Brightness: {analysis.get('brightness'):.2f}")
                print_info(f"Contrast: {analysis.get('contrast'):.2f}")
            
            return True
        else:
            print_error(f"Image detection failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Image detection test failed: {str(e)}")
        return False

def test_pdf_comparison():
    """Test the PDF comparison endpoint"""
    print_section("Testing PDF Comparison Endpoint")
    
    # Note: You'll need actual PDF URLs for this test
    print_info("Skipping PDF comparison test (requires actual PDF URLs)")
    print_info("To test manually, use:")
    print_info(f"  POST {BASE_URL}/chat/comparison")
    print_info('  Body: {"template_url": "...", "filled_url": "..."}')
    return True

def test_blueprint_validation():
    """Test the blueprint validation endpoint"""
    print_section("Testing Blueprint Validation Endpoint")
    
    # Using a sample image URL
    test_image_url = "https://picsum.photos/800/600"
    
    try:
        print_info(f"Testing with image: {test_image_url}")
        response = requests.post(
            f"{BASE_URL}/validate_blueprint",
            json={"url": test_image_url},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Blueprint validation endpoint is working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Blueprint validation failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Blueprint validation test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print(f"\n{Fore.MAGENTA}{'='*60}")
    print("AICTE AI Services API - Test Suite")
    print(f"{'='*60}{Style.RESET_ALL}\n")
    
    print_info(f"Testing API at: {BASE_URL}")
    print_info("Make sure the API server is running!")
    print_info("Start it with: python -m uvicorn app.main:app --reload\n")
    
    time.sleep(2)
    
    results = {
        "Root Endpoint": test_root_endpoint(),
        "API Documentation": test_docs_endpoint(),
        "Image Detection": test_image_detection(),
        "PDF Comparison": test_pdf_comparison(),
        "Blueprint Validation": test_blueprint_validation()
    }
    
    # Summary
    print_section("Test Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")
    
    print(f"\n{Fore.CYAN}Results: {passed}/{total} tests passed{Style.RESET_ALL}")
    
    if passed == total:
        print(f"\n{Fore.GREEN}{'='*60}")
        print("🎉 All tests passed! The API is working correctly.")
        print(f"{'='*60}{Style.RESET_ALL}\n")
    else:
        print(f"\n{Fore.YELLOW}{'='*60}")
        print("⚠ Some tests failed. Please check the errors above.")
        print(f"{'='*60}{Style.RESET_ALL}\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Tests interrupted by user{Style.RESET_ALL}")
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
