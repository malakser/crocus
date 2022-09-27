import requests
import jsons 
import re
from bs4 import BeautifulSoup


with open('../data/legit100.json') as f:
  sites = jsons.loads(f.read())

def word_clean(word):
  word = word[:100].lower()
  word = re.sub(r'[\\\[\]~`!@#$%^&*()+={}:"|;,./<>?]', '', word)
  return word

def idx_gen(text):
  words = text.split()
  idx = {}
  pos = 0
  for w in words:
    i = text.index(w)
    pos += i
    wc = word_clean(w)
    if wc in idx:
      idx[wc].append(pos)
    else:
      idx[wc] = [pos]
    text = text[i:]
  return idx

#adding to both indexes in idx_gen?
#separate inverse indexes for titles and bodies?
#generating forward and backward indexes back to back?
#pull function called from idx_gen
#returning bo
#idx_gen called with url


def pull_stuff(url):
  ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30'
  hs = {'User-Agent':ua, 'Range':'bytes=0-1000000'}
  resp = requests.get(url, headers=hs)
  soup = BeautifulSoup(resp.content, 'html.parser')
  title = soup.title.text
  body = soup.body.text
  res = {'title':title, 'title_idx':idx_gen(title), 'body_idx':idx_gen(body)}
  print(url)
  #print(res)
  return res

doc_idx = {s['url']:pull_stuff(s['url']) for s in sites[:1]}


print(docs)
