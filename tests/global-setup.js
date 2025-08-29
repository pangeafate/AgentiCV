// Global setup for Playwright tests
import { chromium } from '@playwright/test';

async function globalSetup(config) {
  console.log('🚀 Starting global test setup...');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test if local development server is running
    console.log('🔍 Checking local development server...');
    const localResponse = await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 5000 
    }).catch(() => null);
    
    if (localResponse && localResponse.ok()) {
      console.log('✅ Local development server is running');
    } else {
      console.log('⚠️  Local development server not available');
      console.log('   Run "npm run dev" to start the development server');
    }
    
    // Test if deployed site is accessible
    console.log('🔍 Checking deployed site...');
    const deployedResponse = await page.goto('https://pangeafate.github.io/AgentiCV/', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    }).catch(() => null);
    
    if (deployedResponse && deployedResponse.ok()) {
      console.log('✅ Deployed site is accessible');
    } else {
      console.log('⚠️  Deployed site not accessible');
      console.log('   This is expected if the site hasn\'t been deployed yet');
    }
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    // Don't fail the entire test suite if setup has issues
  } finally {
    await browser.close();
  }
}

export default globalSetup;