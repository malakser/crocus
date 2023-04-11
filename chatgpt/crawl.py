import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, urljoin

def is_valid_page(content):
  soup = BeautifulSoup(content, "html.parser")
  return not any(tag.name == "script" or tag.name == "iframe" for tag in soup.find_all())

def process_url(current_url, visited, banned_domains):
  print(f'crawling {current_url}')
  if current_url in visited:
    return
  visited.add(current_url)
  
  parsed_url = urlparse(current_url)
  if parsed_url.netloc in banned_domains:
    return
  
  try:
    response = requests.head(current_url, timeout=1)
    if response.status_code == 200 and response.headers.get("Content-Type", "").startswith("text/html"):
      content_length = int(response.headers.get("Content-Length", 0))
      timeout = max(content_length / (1024 * 1024), 1) # 1 second per MB
      response = requests.get(current_url, timeout=timeout)
      if response.status_code == 200 and is_valid_page(response.content):
        print(current_url)
        for link in BeautifulSoup(response.content, "html.parser").find_all("a"):
          href = link.get("href")
          if href and not href.startswith("javascript:"):
            absolute_url = urljoin(current_url, href)
            process_url(absolute_url, visited, banned_domains)
      else:
        banned_domains.add(parsed_url.netloc)
    else:
      print(f"{current_url} returned {requests.status_codes._codes[response.status_code][0]} ({response.status_code})")
  except (requests.exceptions.Timeout, requests.exceptions.RequestException):
    print(f"{current_url} timed out")
  print(f'stopped crawling {current_url}')

def crawl(start_url):
  visited = set()
  banned_domains = set()
  with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_url = {executor.submit(process_url, start_url, visited, banned_domains): start_url}
    for future in as_completed(future_to_url):
      url = future_to_url[future]
      try:
        future.result()
      except Exception as exc:
        print(f"{url} generated an exception: {exc}")

crawl("https://ranprieur.com")

