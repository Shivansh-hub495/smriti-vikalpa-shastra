const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('Starting automated quiz testing...\
');
  
  try {
    // Navigate to the app
    console.log('1. Navigating to application...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Login if needed
    console.log('2. Checking if login is needed...');
    if (await page.locator('text=Sign In').isVisible()) {
      console.log('   - Login page detected, logging in...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Navigate to Dashboard/Folders
    console.log('3. Navigating to folders...');
    await page.click('text=Browse');
    await page.waitForTimeout(2000);
    
    // Find and click on Self Improvement folder
    console.log('4. Looking for Self Improvement folder...');
    const selfImprovementFolder = page.locator('text=Self Improvement').first();
    if (await selfImprovementFolder.isVisible()) {
      console.log('   - Found Self Improvement folder, clicking...');
      await selfImprovementFolder.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('   - Self Improvement folder not found, looking for any quiz...');
    }
    
    // Find a quiz to edit
    console.log('5. Looking for a quiz to edit...');
    const quizCard = page.locator('.cursor-pointer').first();
    if (await quizCard.isVisible()) {
      console.log('   - Found a quiz, clicking...');
      await quizCard.click();
      await page.waitForTimeout(2000);
      
      // Click Edit button
      const editButton = page.locator('button:has-text("Edit")');
      if (await editButton.isVisible()) {
        console.log('   - Clicking Edit button...');
        await editButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Click Add Question button
    console.log('6. Looking for Add Question button...');
    const addQuestionButton = page.locator('button:has-text("Add Question")');
    if (await addQuestionButton.isVisible()) {
      console.log('   - Found Add Question button, clicking...');
      await addQuestionButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Test adding multiple questions
    for (let i = 1; i <= 4; i++) {
      console.log(`\
7.${i}. Adding Question ${i}...`);
      
      // Fill question text
      console.log(`   - Filling question text for Question ${i}...`);
      const questionTextarea = page.locator('textarea[placeholder*="question"]');
      await questionTextarea.fill(`Test Question ${i}: What is the importance of ${i === 1 ? 'goal setting' : i === 2 ? 'time management' : i === 3 ? 'self-discipline' : 'continuous learning'}?`);
      
      // Add MCQ options
      console.log('   - Adding MCQ options...');
      const optionInputs = page.locator('input[placeholder*="Option"]');
      const optionCount = await optionInputs.count();
      
      if (optionCount >= 2) {
        await optionInputs.nth(0).fill(`Option A for Question ${i}`);
        await optionInputs.nth(1).fill(`Option B for Question ${i}`);
      }
      
      // Add more options if needed
      const addOptionButton = page.locator('button:has-text("Add Option")');
      if (await addOptionButton.isVisible()) {
        await addOptionButton.click();
        await page.waitForTimeout(500);
        await optionInputs.nth(2).fill(`Option C for Question ${i}`);
        
        await addOptionButton.click();
        await page.waitForTimeout(500);
        await optionInputs.nth(3).fill(`Option D for Question ${i}`);
      }
      
      // Select correct answer
      console.log('   - Selecting correct answer...');
      const correctAnswerRadio = page.locator('input[type="radio"]').first();
      await correctAnswerRadio.click();
      
      // Add explanation
      console.log('   - Adding explanation...');
      const explanationTextarea = page.locator('textarea[placeholder*="explanation"]');
      await explanationTextarea.fill(`This is the explanation for Question ${i}.`);
      
      // Save and Add Another (except for the last question)
      if (i < 4) {
        console.log('   - Clicking Save & Add Another...');
        const saveAddButton = page.locator('button:has-text("Save & Add Another")');
        await saveAddButton.click();
        await page.waitForTimeout(2000);
        
        // Check if form cleared
        console.log('   - Checking if form cleared...');
        const questionText = await questionTextarea.inputValue();
        if (questionText === '') {
          console.log('   ✓ Form cleared successfully!');
        } else {
          console.log(`   ✗ ISSUE FOUND: Form not cleared, still contains: "${questionText}"`);
        }
      } else {
        console.log('   - Clicking Save & Return...');
        const saveReturnButton = page.locator('button:has-text("Save & Return")');
        await saveReturnButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Check for any error messages
      const errorAlert = page.locator('.text-red-800, .text-destructive');
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log(`   ✗ ERROR FOUND: ${errorText}`);
      }
      
      // Check for success toast
      const successToast = page.locator('text=Question saved');
      if (await successToast.isVisible()) {
        console.log('   ✓ Success toast displayed');
      }
    }
    
    console.log('\
8. Test completed!');
    console.log('\
Summary of issues found during testing:');
    console.log('- Check console output above for any issues marked with ✗');
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
  
  // Keep browser open for manual inspection
  console.log('\
Browser will remain open for manual inspection. Press Ctrl+C to close.');
  await page.waitForTimeout(300000); // Wait 5 minutes
})();