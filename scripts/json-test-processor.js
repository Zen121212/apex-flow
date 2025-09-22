/**
 * Simple JSON Test Results Processor for CI
 * This processes Jest results and creates summary files
 */

const fs = require('fs');
const path = require('path');

module.exports = (results) => {
  // Create a simplified test summary
  const summary = {
    success: results.success,
    numTotalTests: results.numTotalTests,
    numPassedTests: results.numPassedTests,
    numFailedTests: results.numFailedTests,
    numPendingTests: results.numPendingTests,
    numTotalTestSuites: results.numTotalTestSuites,
    numPassedTestSuites: results.numPassedTestSuites,
    numFailedTestSuites: results.numFailedTestSuites,
    testResults: results.testResults.map(suite => ({
      testFilePath: suite.testFilePath.replace(process.cwd(), ''),
      numPassingTests: suite.numPassingTests,
      numFailingTests: suite.numFailingTests,
      failureMessage: suite.failureMessage,
      perfStats: {
        runtime: suite.perfStats ? suite.perfStats.runtime : 0,
        slow: suite.perfStats ? suite.perfStats.slow : false
      }
    })),
    runTime: results.runTime,
    timestamp: new Date().toISOString(),
    workspaces: {}
  };

  // Group results by workspace
  results.testResults.forEach(suite => {
    const filePath = suite.testFilePath;
    let workspace = 'root';
    
    if (filePath.includes('/apps/')) {
      const match = filePath.match(/\/apps\/([^\/]+)\//);
      if (match) workspace = match[1];
    } else if (filePath.includes('/packages/')) {
      const match = filePath.match(/\/packages\/([^\/]+)\//);
      if (match) workspace = match[1];
    }
    
    if (!summary.workspaces[workspace]) {
      summary.workspaces[workspace] = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        suites: 0
      };
    }
    
    summary.workspaces[workspace].totalTests += (suite.numPassingTests + suite.numFailingTests + suite.numPendingTests);
    summary.workspaces[workspace].passedTests += suite.numPassingTests;
    summary.workspaces[workspace].failedTests += suite.numFailingTests;
    summary.workspaces[workspace].suites += 1;
  });

  // Ensure test-results directory exists
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Write summary
  const summaryPath = path.join(resultsDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Create a simple XML-like output for compatibility
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${summary.numTotalTests}" failures="${summary.numFailedTests}" time="${summary.runTime / 1000}">
${results.testResults.map(suite => 
  `  <testsuite name="${path.basename(suite.testFilePath)}" tests="${suite.numPassingTests + suite.numFailingTests}" failures="${suite.numFailingTests}" time="${suite.perfStats ? suite.perfStats.runtime / 1000 : 0}">
${suite.testResults ? suite.testResults.map(test => 
    `    <testcase name="${test.fullName}" time="${(test.duration || 0) / 1000}">
${test.status === 'failed' ? `      <failure message="${(test.failureMessages || []).join('; ')}">${(test.failureMessages || []).join('\n')}</failure>` : ''}
    </testcase>`
  ).join('\n') : ''}
  </testsuite>`
).join('\n')}
</testsuites>`;

  const xmlPath = path.join(resultsDir, 'junit.xml');
  fs.writeFileSync(xmlPath, xmlContent);

  console.log(`Test summary written to ${summaryPath}`);
  console.log(`JUnit XML written to ${xmlPath}`);
  
  return results;
};