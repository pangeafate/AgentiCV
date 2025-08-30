import { test, expect } from '@playwright/test';

test.describe('Supabase Environment Configuration', () => {
  test('Local environment should have real Supabase connection', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('\n=== LOCAL ENVIRONMENT LOGS ===');
    consoleLogs.forEach(log => console.log('Local:', log));

    const hasSupabaseConnected = consoleLogs.some(log => 
      log.includes('Connected to Supabase') && log.includes('vhzqyeqyxghrpsgedzxn')
    );
    const hasMockMode = consoleLogs.some(log => log.includes('MOCK MODE'));

    console.log('\nLocal Environment Status:');
    console.log('✅ Supabase Connected:', hasSupabaseConnected);
    console.log('❌ Mock Mode:', hasMockMode);

    expect(hasSupabaseConnected, 'Local should have Supabase connected').toBe(true);
    expect(hasMockMode, 'Local should not be in mock mode').toBe(false);
  });

  test('Deployed environment should have real Supabase connection', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('https://pangeafate.github.io/AgentiCV/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Extra time for GitHub Pages

    console.log('\n=== DEPLOYED ENVIRONMENT LOGS ===');
    consoleLogs.forEach(log => console.log('Deployed:', log));

    const hasSupabaseConnected = consoleLogs.some(log => 
      log.includes('Connected to Supabase') && log.includes('vhzqyeqyxghrpsgedzxn')
    );
    const hasMockMode = consoleLogs.some(log => log.includes('MOCK MODE'));

    console.log('\nDeployed Environment Status:');
    console.log('✅ Supabase Connected:', hasSupabaseConnected);
    console.log('❌ Mock Mode:', hasMockMode);

    // This should pass but currently fails
    expect(hasSupabaseConnected, 'Deployed should have Supabase connected').toBe(true);
    expect(hasMockMode, 'Deployed should not be in mock mode').toBe(false);
  });

  test('Check production build includes environment variables', async ({ page }) => {
    // The issue is likely that the production build doesn't include the environment variables
    // Let's check if they're properly embedded in the built JavaScript
    
    console.log('\n=== CHECKING PRODUCTION BUILD FOR ENV VARS ===');
    
    // Check if env vars are in the deployed JavaScript bundle
    const response = await page.goto('https://pangeafate.github.io/AgentiCV/');
    const html = await response.text();
    
    // Extract the JS bundle URL
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = jsMatch[1];
      const fullJsUrl = jsUrl.startsWith('/') 
        ? `https://pangeafate.github.io${jsUrl}` 
        : `https://pangeafate.github.io/AgentiCV/${jsUrl}`;
      
      console.log('JS Bundle URL:', fullJsUrl);
      
      const jsResponse = await page.request.get(fullJsUrl);
      const jsContent = await jsResponse.text();
      
      const hasSupabaseUrl = jsContent.includes('vhzqyeqyxghrpsgedzxn');
      const hasSupabaseKey = jsContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      const hasN8NUrl = jsContent.includes('n8n.lakestrom.com');
      
      console.log('Bundle contains Supabase URL:', hasSupabaseUrl);
      console.log('Bundle contains Supabase Key:', hasSupabaseKey);
      console.log('Bundle contains N8N URL:', hasN8NUrl);
      
      // This tells us if the build process is including the env vars
      expect(hasSupabaseUrl, 'Production bundle should contain Supabase URL').toBe(true);
      expect(hasSupabaseKey, 'Production bundle should contain Supabase Key').toBe(true);
    } else {
      throw new Error('Could not find JavaScript bundle in HTML');
    }
  });
});