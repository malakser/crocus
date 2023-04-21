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

def bad_apples():
  domains = [
    'vk.com',
    'tastefulgarden.com',
    'logicgate.com',
  ]
  for i, d in enumerate(domains):
    yield f'https://{d}', i, {
      'domain': d,
      'hc': 1,
      'pr': 1,
    }

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
  def start_requests(self):
    #for url, n, line in bad_apples():
    for url, n, line in parse_line():
      yield scrapy.Request(url=url, callback=self.parse, cb_kwargs={'line':line, 'n':n}, headers=fake_headers)

  def parse(self, res, line, n):
    self.logger.warn(n)
    if not res.css('script') and not res.css('iframe'): #TODO scripts in head?
      #if 'vk.com' in res.url:
      #  scrapy.shell.inspect_response(res, self)
      yield line




