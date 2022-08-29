from os.path import exists
from bs4 import BeautifulSoup as BS
from urllib.parse import urlparse
from googlesearch import search
import requests
import sys

hostnames_url = "https://raw.githubusercontent.com/notracking/hosts-blocklists/master/hostnames.txt"

if exists("hostnames.txt"):
    with open("hostnames.txt", "r") as f:
        hostnames = f.read()
else:
    print(f"hostnames not found - downloading from:\n{hostnames_url}")
    with open("hostnames.txt", "w") as f:
        hostnames = requests.get(hostnames_url).text;
        f.write(hostnames)



#lines = hostnames.splitlines()
adservers = set(hostnames.splitlines())

'''
for i, l in enumerate(lines):
    if l[0] != '#':
        lines = lines[i:]
        break
#adservers = set(map(lambda l : l.split(' ')[1], lines))
#adservers = set(map(lambda l : l.split(' ')[1], lines))
'''

blacklist = set()

print("loading the results:")

def is_legit(url):
    domain = urlparse(url).netloc
    if domain in blacklist:
        return False
    try:
        page = requests.get(url).text
    except requests.exceptions.ConnectionError as errc:
        print(f"{url} - connection error:\n", errc)
        return False
    #TODO exception for failure
    soup = BS(page, features="html5lib")
    scripts = soup.find_all('script', {'src':True})
    for s in scripts:
        if urlparse(s['src']).netloc in adservers:
            print(f"blocked {url}");
            blacklist.add(domain)
            return False
    return True



for res in search(sys.argv[1], num=40, lang='en', stop=40, pause=5):
    if (is_legit(res)):
        print(res)
