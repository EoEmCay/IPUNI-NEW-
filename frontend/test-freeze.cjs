const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

  console.log("Clicking Email login button...");
  // Use xpath or evaluate to click the email button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const emailBtn = btns.find(b => b.innerText.includes('Email'));
    if(emailBtn) emailBtn.click();
  });

  await new Promise(r => setTimeout(r, 500));

  console.log("Filling form...");
  await page.type('input[type="text"]', 'khoi@example.com');
  await page.type('input[type="password"]', 'admin');
  
  console.log("Clicking login...");
  await page.click('button[type="submit"]');

  console.log("Waiting for navigation...");
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log("Navigation successful. Current URL:", page.url());
  } catch (e) {
    console.log("Navigation timeout or error:", e.message);
  }

  const body = await page.evaluate(() => document.body.innerText);
  console.log("Body snippet:", body.slice(0, 100).replace(/\n/g, ' '));
  
  await new Promise(r => setTimeout(r, 5000));
  console.log("App seems responsive.");
  
  await browser.close();
})();
