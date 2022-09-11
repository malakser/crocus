from bs4 import BeautifulSoup
from urllib.parse import urlparse
from urllib.parse import urljoin 
import collections 
import requests 
import jsons
from typing import List

blacklist = set() 
legit = dict()
sites = dict()
slist = []


class Site:
  def __init__(s, url, inlink=None):
    s.url = url
    s.inlinks = [inlink] if inlink else []
    s.outlinks = []
    s.status = 'uncrawled'
    sites[s.url] = s
    slist.append(s)
  def __str__(s):
    p = lambda x: '\n'+'\n'.join(map(lambda y: f'    {y.desc()}' if y else '', x)) if x else ''
    return f"{s.url}:\n  status: {s.color(s.status)}\n  inlinks:{p(s.inlinks)}\n  outlinks:{p(s.outlinks)}"
  def color(s, strn):
    c = {'ok':37, 'blocked':'31', 'uncrawled':33, 'dead':90, 'nothtml':35}[s.status]
    return f'\x1b[{c}m{strn}\x1b[37m'
  def desc(s):
    return s.color(f'[{s.status}] {s.url}')
  def add_inlink(s, p):
    s.inlinks.append(p)
    return s
  def crawl(s):
    print(f'crawling {s.url}')
    global queue
    global legit
    global blacklist
    loc = urlparse(s.url).netloc
    if loc in blacklist: 
      print(loc+' is blacklisted')
      s.status = 'blocked'
      return s
    try:  
      resp = requests.get(s.url, timeout=5)
    except:
      s.status = 'dead'
      return s
    if not resp.headers['content-type'].startswith('text/html'):
      s.status = 'nothtml'
      return s
    if resp.status_code != 200:
      print(s.url+' is dead')
      s.status = 'dead'
      return s
    soup = BeautifulSoup(resp.content, 'html.parser')
    if soup.find('script'):
      #TODO if hasads
      print('blacklisting '+loc)
      blacklist.add(loc)
      s.status = 'blocked'
      return s

    links = map(lambda x: absolutize(s.url, x.get('href')).strip(), soup('a'))
    for l in links:
      if l in sites:
        sites[l].add_inlink(s.url)
      else:
        Site(l, s)
      s.outlinks.append(l)
    legit[s.url] = s
    s.status = 'ok'
    return s

#unknown

#change maps to list comprehensions?

def printlist(l):
  for el in l:
    print(el)

def absolutize(url, path):
  if urlparse(path).netloc:
    return path
  return urljoin(url, path)

root = Site("https://ranprieur.com/essays/dropout.html")
#root = Site("http://directory.ic.org/")
root.crawl()

n = 5

i = 0
for s in slist:
  if i >= n:
    break
  if s.status == 'uncrawled':
    print(f'{i} ', end='')
    s.crawl()
    i += 1


top = sorted(legit.values(), key=lambda x: len(x.inlinks))
printlist([f'{x.color(len(x.inlinks))} {x.desc()}' for x in top])
jsons.dumps(slist[0])
