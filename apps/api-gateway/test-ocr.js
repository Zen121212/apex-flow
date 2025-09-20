const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000'; // Adjust if different

async function testOCRDiagnostics() {
  console.log('🔍 Testing OCR Diagnostic System...\n');

  try {
    // Test 1: System Health Check
    console.log('1. Running OCR System Health Check...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/debug/ocr/system-check`);
      console.log('✅ System Check Results:');
      console.log(`   - Overall Status: ${healthResponse.data.summary.overallStatus}`);
      console.log(`   - Tesseract Available: ${healthResponse.data.summary.tesseractAvailable}`);
      console.log(`   - Temp Dir Working: ${healthResponse.data.summary.tempDirWorking}`);
      console.log(`   - PDF Parse Working: ${healthResponse.data.summary.pdfParseWorking}`);
      
      healthResponse.data.diagnostics.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`   ${status} ${test.test} (${test.duration}ms)`);
        if (!test.success && test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
    } catch (error) {
      console.log('❌ System check failed:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 2: Create test PDF and compare services
    console.log('2. Testing with sample PDF content...');
    try {
      // Create a simple base64 PDF for testing
      const testPDFContent = createTestPDFBase64();
      
      const compareResponse = await axios.post(`${API_BASE_URL}/debug/ocr/compare-services`, {
        filename: 'test-document.pdf',
        fileContent: testPDFContent,
        size: Buffer.from(testPDFContent, 'base64').length
      });

      console.log('✅ Service Comparison Results:');
      console.log(`   - Recommended Service: ${compareResponse.data.comparison.recommendedService}`);
      console.log(`   - Performance Difference: ${compareResponse.data.comparison.performanceDifference}ms`);
      console.log(`   - Quality Comparison: ${compareResponse.data.comparison.qualityComparison}`);
      console.log(`   - Improvement Areas: ${compareResponse.data.comparison.improvementAreas.length}`);
      
      compareResponse.data.comparison.improvementAreas.forEach(area => {
        console.log(`     • ${area}`);
      });

      console.log('   - Original Service:');
      console.log(`     • Method: ${compareResponse.data.original.extractionMethod}`);
      console.log(`     • Quality: ${compareResponse.data.original.quality}`);
      console.log(`     • Text Length: ${compareResponse.data.original.extractedLength}`);
      
      console.log('   - Enhanced Service:');
      console.log(`     • Method: ${compareResponse.data.enhanced.extractionMethod}`);
      console.log(`     • Quality: ${compareResponse.data.enhanced.quality}`);
      console.log(`     • Text Length: ${compareResponse.data.enhanced.extractedLength}`);
      
    } catch (error) {
      console.log('❌ Service comparison failed:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 3: Force OCR processing test
    console.log('3. Testing forced OCR processing...');
    try {
      const testPDFContent = createTestPDFBase64();
      
      const ocrTestResponse = await axios.post(`${API_BASE_URL}/debug/ocr/test-ocr-with-force`, {
        filename: 'test-ocr.pdf',
        fileContent: testPDFContent,
        forceOCR: true
      });

      console.log('✅ Forced OCR Test Results:');
      console.log(`   - Extraction Method: ${ocrTestResponse.data.result.extractionMethod}`);
      console.log(`   - Quality: ${ocrTestResponse.data.result.quality}`);
      console.log(`   - Confidence: ${ocrTestResponse.data.result.confidence.toFixed(3)}`);
      console.log(`   - Processing Time: ${ocrTestResponse.data.result.processingTime}ms`);
      console.log(`   - Text Extracted: ${ocrTestResponse.data.result.extractedLength} characters`);
      
      if (ocrTestResponse.data.testReport.recommendations.length > 0) {
        console.log('   - Recommendations:');
        ocrTestResponse.data.testReport.recommendations.forEach(rec => {
          console.log(`     • ${rec}`);
        });
      }

      // Show processing steps
      if (ocrTestResponse.data.testReport.ocrSteps.length > 0) {
        console.log('   - Processing Steps:');
        ocrTestResponse.data.testReport.ocrSteps.forEach(step => {
          const status = step.success ? '✅' : '❌';
          console.log(`     ${status} ${step.step} (${step.duration}ms)`);
          if (!step.success && step.error) {
            console.log(`       Error: ${step.error}`);
          }
        });
      }

    } catch (error) {
      console.log('❌ Forced OCR test failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 OCR diagnostic test suite failed:', error.message);
  }
}

function createTestPDFBase64() {
  // Return a simple base64-encoded PDF with text content
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 60
>>
stream
BT
/F1 12 Tf
100 700 Td
(This is a test PDF document for OCR testing) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000123 00000 n 
0000000271 00000 n 
0000000381 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
450
%%EOF`;
  
  return Buffer.from(pdfContent, 'ascii').toString('base64');
}

// Also test the original debug endpoint for comparison
async function testOriginalDebugEndpoint() {
  console.log('4. Testing original debug endpoint...');
  try {
    const testPDFContent = createTestPDFBase64();
    
    const originalResponse = await axios.post(`${API_BASE_URL}/debug/extract-pdf-text`, {
      filename: 'original-test.pdf',
      fileContent: `data:application/pdf;base64,${testPDFContent}`,
      size: Buffer.from(testPDFContent, 'base64').length,
      useOCR: false
    });

    console.log('✅ Original Debug Endpoint Results:');
    console.log(`   - Method: ${originalResponse.data.extractionMethod}`);
    console.log(`   - Quality: ${originalResponse.data.quality}`);
    console.log(`   - Confidence: ${originalResponse.data.confidence.toFixed(3)}`);
    console.log(`   - Processing Time: ${originalResponse.data.processingTime}ms`);
    console.log(`   - Text Length: ${originalResponse.data.extractedLength} characters`);
    
    if (originalResponse.data.extractedText && originalResponse.data.extractedLength > 0) {
      console.log(`   - Preview: "${originalResponse.data.extractedText.slice(0, 100)}..."`);
    }
    
  } catch (error) {
    console.log('❌ Original debug endpoint failed:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 ApexFlow OCR Diagnostic Test Suite\n');
  console.log('This script will test the OCR system improvements and diagnostics.\n');
  
  await testOCRDiagnostics();
  console.log('\n---\n');
  await testOriginalDebugEndpoint();
  
  console.log('\n🎉 OCR diagnostic tests completed!');
  console.log('\nNext steps:');
  console.log('1. Review the test results above');
  console.log('2. Address any failed tests or recommendations');
  console.log('3. Test with actual PDF documents in your application');
  console.log('4. Monitor OCR performance in production');
}

// Run the tests
main().catch(console.error);
