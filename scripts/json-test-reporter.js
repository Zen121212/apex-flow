/**
 * Simple JSON Test Reporter for CI
 * This creates a JSON summary of test results without external dependencies
 */

const fs = require('fs');
const path = require('path');

class JSONTestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const testResults = {
      success: results.numFailedTests === 0,
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
      numTotalTestSuites: results.numTotalTestSuites,
      numPassedTestSuites: results.numPassedTestSuites,
      numFailedTestSuites: results.numFailedTestSuites,
      numPendingTestSuites: results.numPendingTestSuites,
      testResults: results.testResults.map(testResult => ({
        testFilePath: testResult.testFilePath.replace(process.cwd(), ''),
        numPassingTests: testResult.numPassingTests,
        numFailingTests: testResult.numFailingTests,
        numPendingTests: testResult.numPendingTests,
        testResults: testResult.testResults.map(test => ({
          title: test.title,
          status: test.status,
          duration: test.duration,
          fullName: test.fullName,
          ancestorTitles: test.ancestorTitles,
          failureMessages: test.failureMessages
        }))
      })),
      coverageMap: results.coverageMap ? {
        total: results.coverageMap.getCoverageSummary ? 
          results.coverageMap.getCoverageSummary() : null
      } : null,
      snapshot: results.snapshot,
      startTime: results.startTime,
      runTime: results.runTime,
      timestamp: new Date().toISOString()
    };

    // Ensure test-results directory exists
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Write JSON results
    const outputPath = path.join(resultsDir, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));

    console.log(`Test results written to ${outputPath}`);
    console.log(`Tests: ${results.numPassedTests}/${results.numTotalTests} passed`);
    console.log(`Suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites} passed`);
  }
}

module.exports = JSONTestReporter;