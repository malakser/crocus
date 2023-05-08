with open('../missed.txt') as fi:
  with open('../data/missed/in.txt', 'w') as fo:
    fo.write('sample text\n')
    for l in fi:
      fo.write('999\t' * 4 + '.'.join(reversed(l.strip().split('.'))) + '\n')
