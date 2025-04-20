from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
from app.utils.cache import cache
import logging

class ZomatoService:
    def __init__(self):
        self.base_url = "https://www.zomato.com"
        self.driver = None
        self.driver_path = '/usr/local/bin/chromedriver'  # Update this
        self.headless = True
        
    def init_driver(self):
        options = webdriver.ChromeOptions()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            executable_path=self.driver_path,
            options=options
        )
    
    @cache.memoize(timeout=3600)
    def search(self, query, location):
        try:
            if not self.driver:
                self.init_driver()
                
            url = f"{self.base_url}/{location}/restaurants?q={query}"
            self.driver.get(url)
            
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "sc-1mo3ldo-0"))
            )
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            items = soup.find_all('div', class_='sc-1mo3ldo-0')
            
            results = []
            for item in items[:10]:
                try:
                    name = item.find('h4').text.strip()
                    restaurant = item.find('p', class_='sc-1hez2tp-0').text.strip()
                    price = item.find('p', class_='sc-1hez2tp-0').find_next('p').text.strip()
                    rating = item.find('div', class_='sc-1q7bklc-1').text.strip()
                    image = item.find('img')['src']
                    
                    results.append({
                        'platform': 'zomato',
                        'name': name,
                        'restaurant': restaurant,
                        'price': float(price.replace('₹', '').replace(',', '')),
                        'rating': float(rating),
                        'image': image,
                        'link': self.base_url + item.find('a')['href']
                    })
                except Exception as e:
                    logging.warning(f"Error parsing Zomato item: {str(e)}")
                    continue
                    
            return results
        except Exception as e:
            logging.error(f"Zomato search error: {str(e)}")
            return []
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None