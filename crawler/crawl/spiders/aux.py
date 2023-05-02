import scrapy
from bs4 import BeautifulSoup


class AuxSpider(scrapy.Spider):
  name = "aux"

  start_urls = ['https://en.wikipedia.org']

  def parse(self, response):
    self.logger.warn(f'{response.url}')
    soup = BeautifulSoup(response.body, 'html.parser')
    body = soup.body.text;
    title = soup.title.text;
    yield {
      'url': response.url,
      'title': title,
      'body': body,
    }
