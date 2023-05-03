import sys

finame = sys.argv[1]
foname = sys.argv[2]

with open(finame) as fi:
  with open(foname, 'w') as fo:
    fi.readline()
    for l in fi:
      t = l.split()
      fo.write(' '.join([
        t[0],
        '.'.join(reversed(t[4].split('.'))),
        t[1],
        t[3],
      ]) + '\n')
      
    
