import scrapy



class FooSpider(scrapy.Spider):
    name = "foo"
    def start_requests(self):
      for i in range(3):
        with open('../pipes/hosts') as pipe:
          for url in pipe:
            yield scrapy.Request(url=url)

    def parse(self, response):
      self.logger.warn(response.url)
    
