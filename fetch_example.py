#!/usr/bin/env python3
"""
Example script demonstrating fetch capabilities using uvx
"""
import sys
import json

def main():
    # Example 1: Using uvx to run httpx from Python
    print("=== Fetch Example with uvx ===\n")
    
    # Example API endpoint
    url = "https://httpbin.org/json"
    
    print(f"Fetching data from: {url}")
    print("You can run this with uvx:")
    print(f"uvx 'httpx[cli]' {url}")
    print("\nOr use Python with requests:")
    print("uvx requests python -c \"import requests, json; print(json.dumps(requests.get('https://httpbin.org/json').json(), indent=2))\"")
    
    # Example with POST request
    print("\n=== POST Request Example ===")
    print("uvx 'httpx[cli]' https://httpbin.org/post -m POST -j '{\"key\": \"value\"}'")
    
    # Example with curl alternative
    print("\n=== Alternative with curl (if available) ===")
    print("curl https://httpbin.org/get")

if __name__ == "__main__":
    main()
