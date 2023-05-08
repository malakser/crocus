with open('../data/missed/in.txt', 'w') as fo:
  fo.write('sample text\n')
  with open('../false-positives.txt') as fi:
    for l in fi:
      fo.write('999\t' * 4 + '.'.join(reversed(l.strip().split('.'))) + '\n')
  with open('../false-negatives.txt') as fi:
    for l in fi:
      fo.write('999\t' * 4 + '.'.join(reversed(l.strip().split('.'))) + '\n')
