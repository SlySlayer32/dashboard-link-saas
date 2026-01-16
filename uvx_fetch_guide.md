# Using uvx for Fetch Operations

## What is uvx?
uvx is a Python tool runner that allows you to run Python applications in isolated environments without needing to install them globally. It's part of the uv package manager.

## Installation
```bash
# On Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Add to PATH (temporary for current session)
$env:PATH += ";C:\Users\Sly\.local\bin"
```

## Basic Fetch Examples

### 1. Using httpx (Modern HTTP Client)
```bash
# GET request
uvx 'httpx[cli]' https://httpbin.org/get

# POST request with JSON
uvx 'httpx[cli]' https://httpbin.org/post -m POST -j '{"key": "value"}'

# With headers
uvx 'httpx[cli]' https://httpbin.org/headers -h "Authorization: Bearer token"

# Download file
uvx 'httpx[cli]' https://example.com/file.pdf --download file.pdf
```

### 2. Using requests (Popular Python Library)
```bash
# Simple GET request
uvx requests python -c "import requests; print(requests.get('https://httpbin.org/get').text)"

# POST request
uvx requests python -c "import requests, json; r = requests.post('https://httpbin.org/post', json={'key': 'value'}); print(r.text)"

# With authentication
uvx requests python -c "import requests; r = requests.get('https://api.example.com/data', auth=('user', 'pass')); print(r.text)"
```

### 3. Using curl (if available)
```bash
# If you have curl installed
curl https://httpbin.org/get
curl -X POST -H "Content-Type: application/json" -d '{"key": "value"}' https://httpbin.org/post
```

## Advanced Examples

### Fetch and Process JSON
```bash
# Fetch and pretty-print JSON
uvx 'httpx[cli]' https://httpbin.org/json | python -m json.tool

# Extract specific data
uvx requests python -c "import requests, json; data = requests.get('https://httpbin.org/json').json(); print(data['slideshow']['title'])"
```

### Download Multiple Files
```bash
# Create a simple download script
uvx requests python -c "
import requests
urls = ['https://example.com/file1.txt', 'https://example.com/file2.txt']
for url in urls:
    r = requests.get(url)
    filename = url.split('/')[-1]
    with open(filename, 'w') as f:
        f.write(r.text)
    print(f'Downloaded {filename}')
"
```

### API Testing
```bash
# Test REST API endpoints
uvx 'httpx[cli]' https://jsonplaceholder.typicode.com/posts
uvx 'httpx[cli]' https://jsonplaceholder.typicode.com/posts/1
uvx 'httpx[cli]' https://jsonplaceholder.typicode.com/posts -m POST -j '{"title": "Test", "body": "Content", "userId": 1}'
```

## Tips and Best Practices

1. **Package Specifications**: Use quotes around package names with extras like `'httpx[cli]'`
2. **Temporary Environment**: uvx creates a temporary environment for each command
3. **Caching**: uvx caches packages, so subsequent runs are faster
4. **Python Version**: Specify Python version with `--python 3.12` if needed
5. **Verbose Output**: Use `-v` flag for verbose HTTP output

## Common Use Cases

- Quick API testing without setup
- Downloading files from URLs
- Web scraping with Python scripts
- Testing webhooks and endpoints
- Automating HTTP requests in scripts

## Integration with CleanConnect

You can use uvx fetch operations to:
- Test API endpoints during development
- Download configuration files
- Fetch data from external services
- Test webhook endpoints
