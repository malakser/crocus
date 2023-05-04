import io
import json
from tqdm import tqdm
from lxml import html
from lxml.html.clean import Cleaner
from multiprocessing.pool import ThreadPool

cleaner = Cleaner(page_structure=True,
                  meta=True,
                  embedded=True,
                  links=True,
                  style=True,
                  processing_instructions=True,
                  inline_style=True,
                  scripts=True,
                  javascript=True,
                  comments=True)

def task(l, pbar):
  jni = json.loads(l)
  body = jni['body']
  print(1)
  foo = html.fromstring(body)
  title = ''.join(foo.xpath('//title/text()'))
  cbody = cleaner.clean_html(foo).text_content().strip()
  jno = {
    'id': jni['id'],
    'url': jni['url'],
    'title': title,
    'body': cbody,
  }
  pbar.update(len(l))
  return jno

def fgen(f):
  for l in f:
    yield l

with open('../data/pages-raw.jsonl', 'r', 1000000000) as fi:
  fi.seek(0, io.SEEK_END)
  tot = fi.tell()
  fi.seek(0, io.SEEK_SET)
  with tqdm(total = tot) as pbar:
    with open('../data/pages.jsonl', 'w') as fo:
      with ThreadPool(2) as pool:
        for jno in pool.map(task, fgen(fi)):
          fo.write(json.dumps(jno))
      
