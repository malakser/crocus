import json
import shelve 
import requests
from bs4 import BeautifulSoup
import re
import timeout_decorator
import os.path

docs = shelve.open('../data/docs.shelf')
kwords = shelve.open('../data/kwords.shelf', writeback=True)

if not docs.keys():
  print('initializing')
  with open('../data/legit.json') as f:
    for doc in json.loads(f.read()):
      docs[doc['url']] = doc

#docs = {k:v for k, v in docs.items() if 'puppy' in k}

@timeout_decorator.timeout(5)
def req_page(url):
  ua = ('Mozilla/5.0 (X11; Linux x86_64) '
        +'AppleWebKit/534.30 (KHTML, like Gecko) '
        +'Ubuntu/11.04 Chromium/12.0.742.112 '
        +'Chrome/12.0.742.112Safari/534.30')
  hs = {'User-Agent':ua, 'Range':'bytes=0-1000000'}
  resp = requests.get(url, headers=hs, timeout=5)
  return resp

def to_kword(word):
  return re.sub(r'[\\~`!@#$%^&*()+={}\[\];:"|,<.>/?]', '', word[:100].lower())

foo = 0
for url in list(docs):
  #if foo == 10:
  #  break
  doc = docs[url]
  if doc['status'] == 'indexed':
    foo += 1
    continue
  print(f'{foo} {url}')
  try:
    resp = req_page(url)
  except:
    print(f'requesting {url} failed')
    docs.pop(url)
    continue
  soup = BeautifulSoup(resp.content, 'html.parser')
  doc['title'] = soup.title.text if soup.title else 'Untitled'
  if not soup.body:
    print(f'{url} - no body')
    docs.pop(url)
    continue
  text = soup.body.text
  doc['kwords'] = {}
  kwcount = 0
  for match in re.finditer(r'\S+', text):
    word = match[0]
    pos = match.span()[0]
	  kword = to_kword(word)	
    if kword:
      kwcount += 1
      if kword not in doc['kwords']:
        doc['kwords'][kword] = [pos]
      else:
        doc['kwords'][kword].append(pos)
      if kword not in kwords: #redundant?
        kwords[kword] = {'docs':{url}}
      elif url not in kwords[kword]['docs']:
        kwords[kword]['docs'].add(url)
  doc['status'] = 'indexed'
  doc['kwcount'] = kwcount
  docs[url] = doc
  #kwords.sync()
  foo += 1


'''
print('writing doc_idx')
with open('../data/doc_idx.json', 'w') as f:
  f.write(json.dumps(docs))
print('writing kword_idx')
with open('../data/kword_idx.json', 'w') as f:
  f.write(json.dumps(kwords))
'''

docs.close()
kwords.close()
