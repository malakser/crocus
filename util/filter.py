import tld 
import io
from tqdm import tqdm

domains = set()
with open ('../data/main/out.txt') as f:
  f.readline()
  for l in f:
    domains.add(l.split()[1])



with open ('../data/hosts/in.txt') as fi:
  fi.seek(0, io.SEEK_END)
  tot = fi.tell()
  fi.seek(0, io.SEEK_SET)
  with tqdm(total = tot) as pbar:
    pbar.update(len(fi.readline()))
    with open ('../data/hosts2/in.txt', 'w') as fo:
      for l in fi:
        n = '.'.join(reversed(l.split()[4].split('.')))
        pbar.update(len(l))
        try:
          d = tld.get_fld('http://' + n)
        except tld.exceptions.TldDomainNotFound:
          d = '.'.join(n.split('.')[-2:])
        if d in domains:
          fo.write(l)
        
        
        
        
