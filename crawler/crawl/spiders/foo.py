import scrapy
from urllib.parse import urlparse, urljoin



class FooSpider(scrapy.Spider):
  name = "foo"
  

  @classmethod
  def from_crawler(cls, crawler):
    spider = super().from_crawler(crawler)
    crawler.signals.connect(spider.headers_received, signal=scrapy.signals.headers_received)
    return spider

  def start_requests(self):
    with open('../data/hosts') as f:
      for l in f:
        fields = list(map(lambda x: x.strip(), l.split(', ')))
        url = 'https://' + fields[0]
        yield scrapy.Request(url, cb_kwargs={'hc': fields[1], 'pr': fields[2]})

  def headers_received(self, headers, body_length, request, spider): #are the args correct? how self works here?
    if 'robots.txt' not in request.url and b'text/html' not in headers['content-type']:
      self.logger.info(f'{request.url} - not HTML')
      raise scrapy.exceptions.StopDownload(fail=False)

  def parse(self, response, hc, pr):
    self.logger.warn(f'{response.url}')
    links = response.css('a::attr(href)').getall()
    yield {
      'url': response.url,
      'title': ''.join(response.xpath('//title//text()').extract()),
      'body': ''.join(response.xpath('//body//text()').extract()),
      'hc': hc,
      'pr': pr,
    }
    for l in links:
      url = urljoin(response.url, l) #TODO is there a wee bit cleaner way to do it?
      if urlparse(url).netloc == urlparse(response.url).netloc:
        yield scrapy.Request(url, cb_kwargs={'hc': hc, 'pr': pr})
      
