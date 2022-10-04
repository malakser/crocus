import bottle 
import shelve
import json
import sys
import re


docs = shelve.open('../data/docs.shelf')
kwords = shelve.open('../data/kwords.shelf')

def to_kword(word):
  return re.sub(r'[\\~`!@#$%^&*()+={}\[\];:"|,<.>/?]', '', word[:100].lower())

def search(q):
  qsets = [kwords[to_kword(w)]['docs'] for w in q.split()]
  res = sorted(list(qsets[0].intersection(*qsets[1:])), 
               reverse=True,
               key=lambda x: len(docs[x]['inlinks'])) 
  return res

'''
res = search(sys.argv[1])
for url in res[:5]:
  doc = docs[url]
  print(doc['title'])
  print(doc['kwcount'])
  print(len(doc['inlinks']))
  print(url)
  print()
'''


@bottle.route('/')
def web_index():
    return bottle.static_file('index.html', root='static')

@bottle.route('/search')
def web_search():
  q = bottle.request.query['q']
  urls = search(q)[:100]
  print(urls)
  #todo gen_res
  res = [{'url':u, 'title':docs[u]['title'], 'desc':'foo'} for u in urls]
  print(res)
  sres = json.dumps(res)
  print(sres)
  return json.dumps(res)

@bottle.route('/<pathname:path>')
def web_static(pathname):
    return bottle.static_file(pathname, root='static')

bottle.run(host='localhost', port=8080, debug=True)



docs.close()
kwords.close()
