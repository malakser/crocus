import requests
import jsons 
from bs4 import BeautifulSoup

with open('../data/legit100.json') as f:
  sites = jsons.loads(f.read())



def pull_stuff(url):
  ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30'
  hs = {'User-Agent':ua, 'Range':'bytes=0-1000000'}
  resp = requests.get(url, timeout=0.5, headers=hs)
  soup = BeautifulSoup(resp.content, 'html.parser')
  title = soup.title.text.split().strip()
  body = soup.body.text.split().strip()
  res = {'title':title, 'body':body}
  print(res)
  return res

titles = {s['url']:pull_stuff(s['url']) for s in sites}

