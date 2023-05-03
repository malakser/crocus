import scrapy
from urllib.parse import urlparse, urljoin

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


class FooSpider(scrapy.Spider):
  name = "foo"
  

  '''
  @classmethod
  def from_crawler(cls, crawler):
    spider = super().from_crawler(crawler)
    crawler.signals.connect(spider.headers_received, signal=scrapy.signals.headers_received)
    return spider
  '''

  def start_requests(self):
    self.next_id = 0;
    with open('../data/hosts2/out.txt') as f:
      for l in f:
        fields = l.split()
        host = {
          'id': fields[0],
          'domain': fields[1],
          'hc': fields[2],
          'pr': fields[3],
        }
        url = 'https://' + fields[1]
        yield scrapy.Request(url, cb_kwargs={'host': host}, headers=fake_headers)
  '''
  def headers_received(self, headers, body_length, request, spider): #are the args correct? how self works here?
    if 'robots.txt' not in request.url and ('content-type' not in headers or b'text/html' not in headers['content-type']):
      self.logger.info(f'{request.url} - not HTML')
      raise scrapy.exceptions.StopDownload(fail=False)
  '''

  def parse(self, response, host):
    self.next_id += 1
    #self.logger.warn(f'{response.url}')
    self.logger.warn(self.next_id)
    links = response.css('a::attr(href)').getall()
    title = '\n'.join(response.xpath('//title//text()').extract()),
    body = '\n'.join(response.xpath('//body').extract()),
    yield {
      'id': self.next_id,
      'url': response.url,
      'title': ''.join(title),
      'body': ''.join(body), #WUT?
      'hc': host['hc'],
      'pr': host['pr'],
    }
    for l in links:
      url = urljoin(response.url, l) #TODO is there a wee bit cleaner way to do it?
      if urlparse(url).netloc == urlparse(response.url).netloc:
        yield scrapy.Request(url, cb_kwargs={'host': host}, headers=fake_headers)
