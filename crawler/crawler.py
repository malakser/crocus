from bs4 import BeautifulSoup
from urllib.parse import urlparse
from urllib.parse import urljoin 
from urllib.parse import urldefrag
import collections 
import requests 
import jsons
from typing import List

blackset = set() 
blacklist = []
legit = dict()
sites = dict()
slist = []


class Site:
  def __init__(s, arg, inlink=None):
    if isinstance(arg, dict):
      s.url = arg['url']
      s.status = arg['status']
      s.inlinks = arg['inlinks']
      #s.outlinks = arg['outlinks']
      sites[s.url] = s
      slist.append(s)
    else:
      s.url = arg
      s.inlinks = [inlink.url] if inlink else []
      #s.outlinks = []
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
    global slist
    global sites
    global legit
    global blackset
    loc = urlparse(s.url).netloc
    if loc in blackset: #TODO ;dom
      print(loc+' is blacklisted')
      s.status = 'blocked'
      return s
    try:  
      ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30'
      hs = {'User-Agent':ua, 'Range':'bytes=0-1000000'}
      resp = requests.get(s.url, timeout=0.5, headers=hs)
      if int(resp.headers['content-length']) > 1024**2:
        s.status = 'toobig'
        print(f'{s.url} is too big')
        return s
      if not resp.headers['content-type'].startswith('text/html'):
        print(f'{s.url}: not html');
        s.status = 'nothtml' #TODO sort that out
        return s
      #resp = requests.get(s.url, timeout=2.5, headers=hs)
    except:
      print(f'{s.url} timed out')
      s.status = 'timeout'
      return s
    if resp.status_code != 200 and resp.status_code != 206:
      print(f'{s.url}: error {resp.status_code}')
      s.status = 'error'
      return s
    soup = BeautifulSoup(resp.content, 'html.parser')
    if soup.find('script') or soup.find('iframe'):
      #TODO if hasads
      print('blacklisting '+loc)
      blacklist.append(loc) #TODO ;dom
      blackset.add(loc)
      s.status = 'blocked'
      return s
    links = map(lambda x: absolutize(s.url, x.get('href')).strip(), soup('a'))
    for l in links:
      if l in sites:
        sites[l].add_inlink(s.url)
      else:
        Site(l, s)
      #s.outlinks.append(l)
    legit[s.url] = s
    s.status = 'ok'
    return s

#unknown

#change maps to list comprehensions?

def printlist(l):
  for el in l:
    print(el)

def absolutize(url, path):
  path, _ = urldefrag(path)
  if urlparse(path).netloc:
    return path
  return urljoin(url, path)

try:
  with open('blacklist.txt') as f:
    print('loading blacklist') #;dom
    blacklist = f.read().splitlines()
    blackset = set(blacklist)
  with open('slist.json') as f:
    print('loading slist')
    dlist = jsons.loads(f.read()) #;rename
    print('slist loaded');
    for d in dlist:
      s = Site(d)
      if s.status == 'ok':
        legit[s.url] = s
except:
  root = Site("https://ranprieur.com/essays/dropout.html")
  #root = Site("http://seedmagazine.com/content/article/to_be_a_baby/")
  #root = Site("https://episcopalchurch.org/files/ellibrodeoracioncomun_0.pdf")
  #root = Site("https://www.cartoongamez.com/game10.html")
  #root = Site("https://www.rpmfind.net/linux/RPM/CentOS.html")
  root.crawl()

blacklist_inc = len(blacklist)
slist_inc = len(slist)
#TODO better name

def save():
  print('saving')
  blacklist_new = blacklist[blacklist_inc:]
  slist_new = slist[slist_inc:]
  with open('blacklist.txt', 'a') as f:
    if len(blacklist_new):
      f.write('\n'.join(blacklist_new) + '\n')
  with open('slist.json', 'w') as f:
    f.write(jsons.dumps(slist))


n = 40000
pmax = 10
dmax = 100

dheat = {}

lup = True
t = 1
while lup:
  i = 0
  for s in slist:
    if len(slist) >= n:
      lup = False
      break
    #par = s.inlinks[0]
    loc = urlparse(s.url).netloc
    if loc not in dheat:
      dheat[loc] = 0
    if s.status == 'uncrawled':
      if dheat[loc] / t > 1 / len(dheat):
        #print(f'{s.url} postponed - domain too hot')
        dheat[loc] -= 0.01
      else:
        t += 1
        dheat[loc] += 1
        print(f'{i} {len(slist)} ', end='')
        s.crawl()
        if s.status == 'blocked':
          for il in s.inlinks:
            dheat[urlparse(il).netloc] += 10
          dheat[loc] = float('-inf')
        if s.status == 'timeout':
          dheat[loc] += 10
      i += 1

print(f'final len {len(slist)}') 
save()


top = sorted(legit.values(), key=lambda x: len(x.inlinks))
printlist([f'{x.color(len(x.inlinks))} {x.desc()}' for x in top])
