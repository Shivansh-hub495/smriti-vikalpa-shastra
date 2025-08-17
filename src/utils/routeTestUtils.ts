/**
 * @fileoverview Route testing utilities for quiz navigation
 * @description Utility functions for testing and validating quiz routes
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { QUIZ_ROUTES, validateQuizRouteParams, extractQuizContext } from './routeUtils';

/**
 * Test data for route validation
 */
const TEST_IDS = {
  VALID_UUID: '123e4567-e89b-12d3-a456-426614174000',
  INVALID_UUID: 'invalid-uuid',
  FOLDER_ID: '123e4567-e89b-12d3-a456-426614174001',
  QUIZ_ID: '123e4567-e89b-12d3-a456-426614174002',
  ATTEMPT_ID: '123e4567-e89b-12d3-a456-426614174003'
};

/**
 * Tests all quiz route patterns
 */
export const testQuizRoutes = () => {
  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; passed: boolean; error?: string }>
  };

  const addTest = (name: string, testFn: () => boolean | void) => {
    try {
      const result = testFn();
      const passed = result !== false;
      results.tests.push({ name, passed });
      if (passed) results.passed++;
      else results.failed++;
    } catch (error) {
      results.tests.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      results.failed++;
    }
  };

  // Test route generation
  addTest('Dashboard route', () => {
    return QUIZ_ROUTES.DASHBOARD === '/';
  });

  addTest('Folder route', () => {
    return QUIZ_ROUTES.FOLDER(TEST_IDS.FOLDER_ID) === `/folder/${TEST_IDS.FOLDER_ID}`;
  });

  addTest('Create quiz route with folder', () => {
    return QUIZ_ROUTES.CREATE_QUIZ(TEST_IDS.FOLDER_ID) === `/folder/${TEST_IDS.FOLDER_ID}/create-quiz`;
  });

  addTest('Create quiz route without folder', () => {
    return QUIZ_ROUTES.CREATE_QUIZ() === '/create-quiz';
  });

  addTest('Quiz edit route', () => {
    return QUIZ_ROUTES.QUIZ_EDIT(TEST_IDS.QUIZ_ID) === `/quiz/${TEST_IDS.QUIZ_ID}/edit`;
  });

  addTest('Quiz take route', () => {
    return QUIZ_ROUTES.QUIZ_TAKE(TEST_IDS.QUIZ_ID) === `/quiz/${TEST_IDS.QUIZ_ID}/take`;
  });

  addTest('Quiz history route', () => {
    return QUIZ_ROUTES.QUIZ_HISTORY(TEST_IDS.QUIZ_ID) === `/quiz/${TEST_IDS.QUIZ_ID}/history`;
  });

  addTest('Quiz results route', () => {
    return QUIZ_ROUTES.QUIZ_RESULTS(TEST_IDS.QUIZ_ID, TEST_IDS.ATTEMPT_ID) === 
           `/quiz/${TEST_IDS.QUIZ_ID}/results/${TEST_IDS.ATTEMPT_ID}`;
  });

  // Test parameter validation
  addTest('Valid UUID validation', () => {
    const result = validateQuizRouteParams({ quizId: TEST_IDS.VALID_UUID });
    return result.isValid && result.errors.length === 0;
  });

  addTest('Invalid UUID validation', () => {
    const result = validateQuizRouteParams({ quizId: TEST_IDS.INVALID_UUID });
    return !result.isValid && result.errors.length > 0;
  });

  addTest('Multiple valid UUIDs', () => {
    const result = validateQuizRouteParams({
      quizId: TEST_IDS.QUIZ_ID,
      folderId: TEST_IDS.FOLDER_ID,
      attemptId: TEST_IDS.ATTEMPT_ID
    });
    return result.isValid && result.errors.length === 0;
  });

  // Test route context extraction
  addTest('Extract folder context', () => {
    const context = extractQuizContext(`/folder/${TEST_IDS.FOLDER_ID}`);
    return context.folderId === TEST_IDS.FOLDER_ID && context.routeType === 'folder';
  });

  addTest('Extract quiz edit context', () => {
    const context = extractQuizContext(`/quiz/${TEST_IDS.QUIZ_ID}/edit`);
    return context.quizId === TEST_IDS.QUIZ_ID && context.routeType === 'edit';
  });

  addTest('Extract quiz take context', () => {
    const context = extractQuizContext(`/quiz/${TEST_IDS.QUIZ_ID}/take`);
    return context.quizId === TEST_IDS.QUIZ_ID && context.routeType === 'take';
  });

  addTest('Extract quiz history context', () => {
    const context = extractQuizContext(`/quiz/${TEST_IDS.QUIZ_ID}/history`);
    return context.quizId === TEST_IDS.QUIZ_ID && context.routeType === 'history';
  });

  addTest('Extract quiz results context', () => {
    const context = extractQuizContext(`/quiz/${TEST_IDS.QUIZ_ID}/results/${TEST_IDS.ATTEMPT_ID}`);
    return context.quizId === TEST_IDS.QUIZ_ID && 
           context.attemptId === TEST_IDS.ATTEMPT_ID && 
           context.routeType === 'results';
  });

  addTest('Extract create quiz context', () => {
    const context = extractQuizContext('/create-quiz');
    return context.routeType === 'create';
  });

  addTest('Extract folder create quiz context', () => {
    const context = extractQuizContext(`/folder/${TEST_IDS.FOLDER_ID}/create-quiz`);
    return context.folderId === TEST_IDS.FOLDER_ID && context.routeType === 'create';
  });

  return results;
};

/**
 * Validates that all required routes are properly configured
 */
export const validateRouteConfiguration = (routes: string[]) => {
  const requiredRoutes = [
    '/auth',
    '/',
    '/folder/:folderId',
    '/create-quiz',
    '/folder/:folderId/create-quiz',
    '/quiz/:quizId/edit',
    '/quiz/:quizId/take',
    '/quiz/:quizId/history',
    '/quiz/:quizId/results/:attemptId'
  ];

  const missing = requiredRoutes.filter(route => !routes.includes(route));
  const extra = routes.filter(route => !requiredRoutes.includes(route) && !route.includes('*'));

  return {
    isValid: missing.length === 0,
    missing,
    extra,
    total: routes.length,
    required: requiredRoutes.length
  };
};

/**
 * Simulates navigation through quiz workflow
 */
export const simulateQuizWorkflow = () => {
  const workflow = [
    { step: 'Dashboard', route: QUIZ_ROUTES.DASHBOARD },
    { step: 'Folder View', route: QUIZ_ROUTES.FOLDER(TEST_IDS.FOLDER_ID) },
    { step: 'Create Quiz', route: QUIZ_ROUTES.CREATE_QUIZ(TEST_IDS.FOLDER_ID) },
    { step: 'Edit Quiz', route: QUIZ_ROUTES.QUIZ_EDIT(TEST_IDS.QUIZ_ID) },
    { step: 'Take Quiz', route: QUIZ_ROUTES.QUIZ_TAKE(TEST_IDS.QUIZ_ID) },
    { step: 'Quiz History', route: QUIZ_ROUTES.QUIZ_HISTORY(TEST_IDS.QUIZ_ID) },
    { step: 'Quiz Results', route: QUIZ_ROUTES.QUIZ_RESULTS(TEST_IDS.QUIZ_ID, TEST_IDS.ATTEMPT_ID) }
  ];

  return workflow.map(({ step, route }) => ({
    step,
    route,
    context: extractQuizContext(route),
    isValid: validateQuizRouteParams(extractQuizContext(route)).isValid
  }));
};

/**
 * Logs route test results to console
 */
export const logRouteTestResults = () => {
  const results = testQuizRoutes();
  
  console.group('🧪 Quiz Route Tests');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.tests.length}`);
  
  if (results.failed > 0) {
    console.group('❌ Failed Tests');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`• ${test.name}${test.error ? `: ${test.error}` : ''}`);
      });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return results;
};

export default {
  testQuizRoutes,
  validateRouteConfiguration,
  simulateQuizWorkflow,
  logRouteTestResults
};