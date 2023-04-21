docs = {'a':'aaa bbb ccc aaa', 'b':'bbb ccc ccc bbb', 'c':'aaa aaa ccc', 'd':'aaa bbb aaa ccc bbb aaa ccc ddd'}

def gen_wordlist():
  words = set()
  for doc in docs.values():
    for w in doc.split():
      words.add(w)
  return words


def forward_index(doc):
  res = {}
  for i, w in enumerate(doc.split()):
    if w in res:
      res[w] += [i]
    else:
      res[w] = [i]
  return res

wlist = gen_wordlist()

fidx = {k:forward_index(v) for k, v in docs.items()}

print(docs)
print(wlist)
print(fidx)

def backward_index(word):
  res = {}
  for k, v in fidx.items():
    if word in v:
      res[k] = v[word]
  return res

bidx = {k:backward_index(k) for k in wlist}


print(bidx)

#q = 'aaa ccc'
q = 'ddd aaa ccc'
foo = [set(bidx[w]) for w in q.split()]
foo = sorted(foo, key=lambda x: len(x)) 
print(foo)
#print(foo[0].intersection(*foo[1:]))
    
