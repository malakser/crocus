import shelve
import sys

docs = shelve.open('../data/docs.shelf')
kwords = shelve.open('../data/kwords.shelf')

q = sys.argv[1]
for url in kwords[q]['docs']:
  doc = docs[url]
  print(doc['title'])
  print(doc['kwcount'])
  print(url)
  print()


docs.close()
kwords.close()
