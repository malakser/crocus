import scrapy

def parse_line():
  with open('dranks.txt') as f_in:
    f_in.readline()
    n = 1
    while line := f_in.readline():
      fields = line.split()
      domain = '.'.join(reversed(fields[4].split('.')))
      url = f'https://{domain}'
      yield url, n, {
        'domain': domain,
        'hc': fields[1],
        'pr': fields[3]
      }
      n += 1

def fedex():
  yield 'https://fedex.com', 1, {
      'domain': 'fedex.com',
      'hc': 1,
      'pr': 1,
  }


class FooSpider(scrapy.Spider):
  name = "foo"
  def start_requests(self):
    #for url, n, line in parse_line():
    for url, n, line in fedex():
      yield scrapy.Request(url=url, callback=self.parse, cb_kwargs={'line':line, 'n':n})

  def parse(self, res, line, n):
    self.logger.warn(n)
    if not res.css('script') and not res.css('iframe'):
      #with open('out.txt', 'a') as f_out: #TODO item pipeline?
      #  self.logger.warning('writing ' + line)
      #  f_out.write(line)
      yield line
    else:
      pass
      #self.logger.warning(res.url + ' has scripts or frames')




