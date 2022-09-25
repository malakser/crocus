import requests
import jsons 
import re
from bs4 import BeautifulSoup


with open('../data/legit100.json') as f:
  sites = jsons.loads(f.read())

def word_clean(word):
  return re.sub(r'[\\\[\]~`!@#$%^&*()+={}:"|;,./<>?]', '', word[:100])

def pull_stuff(url):
  ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30'
  hs = {'User-Agent':ua, 'Range':'bytes=0-1000000'}
  resp = requests.get(url, headers=hs)
  soup = BeautifulSoup(resp.content, 'html.parser')
  title = soup.title.text 
  title_words = [word_clean(s) for s in title.split()]
  #body_words = [word_clean(s) for s in soup.body.text.split()]
  res = {'title':title, 'title_words':title_words}
  print(res)
  return res

raw = {s['url']:pull_stuff(s['url']) for s in sites}

