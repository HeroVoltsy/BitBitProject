const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  const tag = 'browser_' + Date.now();
  async function me() {
    return page.evaluate(async () => {
      const response = await fetch('http://127.0.0.1:8001/users/me', { headers: {Authorization:'Bearer '+ sessionStorage.getItem('salika.access-token.v1')} });
      if(!response.ok) throw new Error('Profile read failed');
      return response.json();
    });
  }
  try {
    await page.goto('http://127.0.0.1:5175');
    await page.getByRole('button', {name:'Sign Up',exact:true}).first().click();
    await page.getByRole('textbox',{name:'Full name',exact:true}).fill('Browser Test Person');
    await page.getByRole('textbox',{name:'Username',exact:true}).fill(tag);
    await page.getByRole('textbox',{name:'Email',exact:true}).fill(tag+'@example.com');
    await page.getByLabel('Password',{exact:true}).fill('LocalBrowserTest_12345');
    await page.getByLabel('Confirm password',{exact:true}).fill('LocalBrowserTest_12345');
    await page.getByRole('button',{name:'Create Account',exact:true}).click();
    await page.getByRole('heading',{name:'Which best describes you?'}).waitFor();
    await page.getByLabel('Student',{exact:true}).check();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByRole('button',{name:'Music',exact:true}).click();
    await page.getByRole('button',{name:'Start exploring',exact:true}).click();
    await page.getByRole('heading',{name:'Which best describes you?'}).waitFor({state:'hidden'});
    let user=await me();
    assert.equal(user.display_name,'Browser Test Person');
    assert.equal(user.account_type,'attendee');
    assert.deepEqual(user.discovery_profile,{occupation:'student',interests:['Music']});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('salika.session')),null);
    console.log('PASS: real signup/login and persisted joiner onboarding.');
    await page.reload();
    await page.getByRole('button',{name:'Get started',exact:true}).waitFor();
    user=await me();
    assert.equal(user.display_name,'Browser Test Person');
    console.log('PASS: refresh restores the authenticated server profile.');
    await page.getByRole('button',{name:'Get started',exact:true}).click();
    await page.getByLabel('First name',{exact:true}).fill('Browser');
    await page.getByLabel('Last name',{exact:true}).fill('Test');
    await page.getByLabel('Date of birth',{exact:true}).fill('2000-01-01');
    await page.getByLabel('Contact number',{exact:true}).fill('09123456789');
    for(const [name,value] of Object.entries({addressLine1:'1 Test Street',barangay:'Test District',city:'Naga City',province:'Camarines Sur',postalCode:'4400'}))
      await page.locator('#kyc-permanent-'+name).fill(value);
    await page.getByLabel('Same as permanent address').check();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.locator('#kyc-documentType').selectOption('National ID');
    await page.getByLabel('ID number',{exact:true}).fill('TEST-ID-BROWSER');
    const png=Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082','hex');
    for(const name of ['front','back','selfie']) await page.locator('#kyc-image-'+name).setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByLabel('I confirm that my details and photos are accurate and consent to their use for identity verification.').check();
    let blockedOnce=false;
    await page.route('http://127.0.0.1:8001/api/v1/kyc/documents/back', async route=>{
      if(!blockedOnce) { blockedOnce=true; await route.abort('failed'); }
      else await route.continue();
    });
    await page.getByRole('button',{name:'Submit for review',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Could not reach the server'}).waitFor();
    assert.equal(await page.getByLabel('ID number',{exact:true}).count(),0); // Review step remains available.
    const draftState=await page.evaluate(async()=>{
      const r=await fetch('http://127.0.0.1:8001/api/v1/kyc/me',{headers:{Authorization:'Bearer '+sessionStorage.getItem('salika.access-token.v1')}});
      return (await r.json()).status;
    });
    assert.equal(draftState,'draft');
    await page.getByRole('button',{name:'Submit for review',exact:true}).click();
    await page.getByRole('heading',{name:'Under review',exact:true}).waitFor();
    const kyc=await page.evaluate(async()=>{
      const response=await fetch('http://127.0.0.1:8001/api/v1/kyc/me',{headers:{Authorization:'Bearer '+sessionStorage.getItem('salika.access-token.v1')}});
      return response.json();
    });
    assert.equal(kyc.status,'pending');
    assert.deepEqual(kyc.documents.sort(),['back','front','selfie']);
    assert.equal(kyc.personal_details.firstName,'Browser');
    assert.equal(kyc.personal_details.currentAddress.city,'Naga City');
    assert.equal('id_number' in kyc,false);
    console.log('PASS: KYC form saves details, uploads all three documents, and completes for review.');
    await page.screenshot({path:path.join(process.env.BROWSER_TEST_OUTPUT || require('node:os').tmpdir(),'kyc-review.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('BROWSER TESTS PASSED');
  } catch(error) {
    await page.screenshot({path:path.join(process.env.BROWSER_TEST_OUTPUT || require('node:os').tmpdir(),'failure.png'),fullPage:true});
    console.error(error.message);
    console.error((await page.locator('body').innerText()).slice(-3500));
    process.exitCode=1;
  } finally { await browser.close(); }
})();
