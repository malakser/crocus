import io
import json
from tqdm import tqdm
from lxml import html
from lxml.html.clean import Cleaner
from concurrent.futures import ThreadPoolExecutor

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

def task(l):
  jni = json.loads(l)
  body = jni['body']
  foo = html.fromstring(body)
  title = ''.join(foo.xpath('//title/text()'))
  cbody = cleaner.clean_html(foo).text_content().strip()
  jno = {
    'id': jni['id'],
    'url': jni['url'],
    'title': title,
    'body': cbody,
  }
  return l, jno
  
def main():
  with open('../data/pages-raw.jsonl', 'r', 1000000000) as fi:
    fi.seek(0, io.SEEK_END)
    tot = fi.tell()
    fi.seek(0, io.SEEK_SET)
    with tqdm(total = tot) as pbar:
      with open('../data/pages.jsonl', 'w') as fo:
        with ThreadPoolExecutor(max_workers=2) as exc:
          for l, jno in exc.map(task, fi):
            fo.write(json.dumps(jno))
            print(len(l))
            pbar.update(len(l))

if __name__ == '__main__':
  main()
