import scrapy
from urllib.parse import urlparse, urljoin



class FooSpider(scrapy.Spider):
    name = "foo"
    def start_requests(self):
      with open('../data/hosts') as f:
        for l in f:
          fields = list(map(lambda x: x.strip(), l.split(', ')))
          url = 'https://' + fields[0]
          yield scrapy.Request(url, priority=0, cb_kwargs={'priority': 0, 'hc': fields[1], 'pr': fields[2]})

    def parse(self, response, priority, hc, pr):
      self.logger.warn(f'{response.url} priority: {priority}')
      links = response.css('a::attr(href)').getall()
      yield {
        'url': response.url,
        'title': response.xpath('//title//text()').extract(),
        'body': response.xpath('//body//text()').extract(),
        'hc': hc,
        'pr': pr,
      }
      for l in links:
        url = urljoin(response.url, l) #TODO is there a wee bit cleaner way to do it?
        if urlparse(url).netloc == urlparse(response.url).netloc:
          yield scrapy.Request(url, priority=priority-1, cb_kwargs={'priority': priority-1, 'hc': hc, 'pr': pr})
      
