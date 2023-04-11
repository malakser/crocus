from pathlib import Path
import urllib.parse

import scrapy

'''
class QuotesSpider(scrapy.Spider):
  name = "boo"
    url = 'https://quotes.toscrape.com/page/1/'
    yield scrapy.Request(url=url, callback=self.parse)
  def parse(self, res):
    page = res.url.split('/')[-2]
    fname = f'quotes-{page}.html'
    Path(fname).write_bytes(res.body)
    self.log(f'saved file {fname}')
'''

blacklist = set()

def is_followable(link, logger):
  props = urllib.parse.urlparse(link)
  schemes = {'https', 'http', 'ftp', ''}
  if props.scheme not in schemes:
    return False
  if props.netloc in blacklist: #TODO move to appropriate signal to cancel already queued requests
    logger.info(f'{link} is blacklisted')
    return False 
  return True
  


class QuotesSpider(scrapy.Spider):
  name = "boo"
  start_urls = ['https://ranprieur.com']

  @classmethod
  def from_crawler(cls, crawler):
    spider = super().from_crawler(crawler)
    crawler.signals.connect(spider.headers_received, signal=scrapy.signals.headers_received)
    return spider

  def headers_received(self, headers, body_length, request, spider):
    if 'robots.txt' not in request.url and b'text/html' not in headers['content-type']:
      self.logger.info(f'{request.url} - not HTML')
      raise scrapy.exceptions.StopDownload(fail=False)

  def parse(self, res):
    props = urllib.parse.urlparse(res.url)
    self.logger.info(f'crawling {res.url}')
    if res.css('script') or res.css('iframe'):
      self.logger.info(f'blacklisting {props.netloc}')
      blacklist.add(props.netloc)
      return
    links = list(map(lambda l: urllib.parse.urljoin(res.url, l), res.css('a::attr(href)').getall()))
    #sanitize links here? don't want javascript::stuff
    yield {
      'url': res.url,
      'links': links,
    }
    for link in links:
      #defragging?
      if is_followable(link, self.logger):
        yield res.follow(link, callback=self.parse)

  def closed(self, reason):
    print(blacklist)
