import scrapy
from urllib.parse import urlparse, urljoin
from lxml import html
from lxml.html.clean import Cleaner

fake_headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9,pl;q=0.8',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="104"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.101 Safari/537.36',
}

def parse_host(l):
  fields = l.split()
  return {
    'id': fields[0],
    'domain': fields[1],
    'hc': fields[2],
    'pr': fields[3],
  }

def host_gen():
  with open('../data/hosts2/out.txt') as f:
    for l in f:
      host = parse_host(l)
      yield host

hosts = [h for h in host_gen()]
domains = [h['domain'] for h in hosts]

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

def title_truncate(t, n):
  if len(t) <= n:
    return t
  words = t.split()
  for i, w in enumerate(words):
    t1 =  ' '.join(words[:i])
    if len(t1) > n:
      return t1 + '...'

class FooSpider(scrapy.Spider):
  name = "foo"
  next_id = 0
  allowed_domains = domains

  '''
  @classmethod
  def from_crawler(cls, crawler):
    spider = super().from_crawler(crawler)
    crawler.signals.connect(spider.headers_received, signal=scrapy.signals.headers_received)
    return spider
  '''

  def start_requests(self):
    for host in hosts:
      url = 'https://' + host['domain']
      yield scrapy.Request(url, cb_kwargs={'host': host, 'd': 0}, headers=fake_headers)

  '''
  def headers_received(self, headers, body_length, request, spider): #are the args correct? how self works here?
    if 'robots.txt' not in request.url and ('content-type' not in headers or b'text/html' not in headers['content-type']):
      self.logger.warning(f'{request.url} - not HTML')
      raise scrapy.exceptions.StopDownload(fail=False)
  '''

  def parse(self, response, host, d):
    self.next_id += 1
    #self.logger.warn(f'{response.url}')
    self.logger.warn(f'{self.next_id} {response.url}')
    title = '\n'.join(response.xpath('//title//text()').extract()),
    body = cleaner.clean_html(html.fromstring(response.body)).text_content().strip()

    yield {
      'id': self.next_id,
      'url': response.url,
      'title': title_truncate(''.join(title), 65), #WUT?
      'body': body, 
      'hc': host['hc'],
      'pr': host['pr'],
    }
    if d < 1:
      links = response.css('a::attr(href)').getall()
      for l in links:
        url = urljoin(response.url, l) #TODO is there a wee bit cleaner way to do it?
        if urlparse(url).scheme in ['http', 'https']:
          yield scrapy.Request(url, cb_kwargs={'host': host, 'd': d + 1}, headers=fake_headers)
