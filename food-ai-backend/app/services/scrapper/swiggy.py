from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
from app.utils.cache import cache
import logging

class SwiggyService:
    def __init__(self):
        self.base_url = "https://www.swiggy.com"
        self.driver = None
        
    def init_driver(self):
        """Initialize Selenium WebDriver"""
        options = webdriver.ChromeOptions()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            executable_path=self.driver_path,
            options=options
        )
    
    @cache.memoize(timeout=3600)  # Cache for 1 hour
    def search(self, query, location):
        """Search for food items on Swiggy"""
        try:
            if not self.driver:
                self.init_driver()
                
            # Construct URL with location
            url = f"{self.base_url}/search?query={query}&location={location}"
            self.driver.get(url)
            
            # Wait for results to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "styles_item___D0aF"))
            )
            
            # Parse results
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            items = soup.find_all('div', class_='styles_item___D0aF')
            
            results = []
            for item in items[:10]:  # Limit to top 10 results
                try:
                    name = item.find('div', class_='styles_itemName__hLfgz').text.strip()
                    restaurant = item.find('div', class_='styles_restaurantName__d_zZx').text.strip()
                    price = item.find('span', class_='rupee').next_sibling.strip()
                    rating = item.find('div', class_='styles_rating__cZrjd').text.strip()
                    image = item.find('img')['src']
                    
                    results.append({
                        'platform': 'swiggy',
                        'name': name,
                        'restaurant': restaurant,
                        'price': float(price),
                        'rating': float(rating),
                        'image': image,
                        'link': self.base_url + item.find('a')['href']
                    })
                except Exception as e:
                    logging.warning(f"Error parsing Swiggy item: {str(e)}")
                    continue
                    
            return results
        except Exception as e:
            logging.error(f"Swiggy search error: {str(e)}")
            return []
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None