import json

with open('out.json') as f:
  sites = json.load(f)

linkset = {s['url'] for s in sites}

for s in sites:
  s['rank'] = 0

for s in sites:
  for l in s['links']:
    if l in linkset:
      s['rank'] += 1

sites.sort(reverse=True, key= lambda s: s['rank'])

for s in sites[:100]:
  print(s['url'], s['rank'])
