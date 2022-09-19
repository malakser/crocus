
pages = {}
domains = {}
page_list = []
domain_list = []

@dataclass
class Page:
  url: str
  status: str = 'uncrawled'
  inlinks: List(str) = []


  
