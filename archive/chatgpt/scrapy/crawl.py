import scrapy

class LinkSpider(scrapy.Spider):
  name = "links"
  start_urls = [
    # Replace with the URL you want to start crawling from
    'http://ranpieur.com/'
  ]
  blacklisted_domains = set()

  def parse(self, response):
    # Check if the page contains any script or iframe tags
    if response.xpath("//script") or response.xpath("//iframe"):
      # Add the domain to the blacklisted_domains set
      self.blacklisted_domains.add(response.url.split("/")[2])
    else:
      for link in response.css("a::attr(href)").getall():
        print(link)
        # Filter out links to javascript or other resources
        if link.startswith("http"):
          # Check if the link's domain is in the blacklisted_domains set
          if response.urljoin(link).split("/")[2] not in self.blacklisted_domains:
            print(response.urljoin(link))
            yield response.follow(link, self.parse)

