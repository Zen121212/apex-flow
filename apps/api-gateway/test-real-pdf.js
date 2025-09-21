const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testRealPDF() {
  console.log('🧪 Testing OCR with free-invoice.pdf\n');

  try {
    // Read the actual PDF file
    const pdfPath = '/Users/Zen/Desktop/free-invoice.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Content = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF Info:`);
    console.log(`   - File size: ${pdfBuffer.length} bytes`);
    console.log(`   - Base64 length: ${base64Content.length} characters`);
    console.log(`   - PDF header: ${pdfBuffer.slice(0, 10).toString()}`);

    // Test with original debug endpoint
    console.log('\n1. Testing with original debug endpoint...');
    try {
      const response = await axios.post('http://localhost:3000/debug/extract-pdf-text', {
        filename: 'free-invoice.pdf',
        fileContent: `data:application/pdf;base64,${base64Content}`,
        size: pdfBuffer.length,
        useOCR: true // Force OCR to see what happens
      }, {
        timeout: 60000 // 60 second timeout
      });

      console.log('✅ Response received:');
      console.log(`   - Method: ${response.data.extractionMethod || response.data.method}`);
      console.log(`   - Quality: ${response.data.quality}`);
      console.log(`   - Confidence: ${response.data.confidence}`);
      console.log(`   - Processing Time: ${response.data.processingTime}ms`);
      console.log(`   - Text Length: ${response.data.extractedLength || 0} characters`);
      
      if (response.data.extractedText && response.data.extractedText.length > 0) {
        console.log(`   - Preview: "${response.data.extractedText.slice(0, 200)}..."`);
      } else {
        console.log(`   - No text extracted`);
      }

      if (response.data.pageBreakdown && response.data.pageBreakdown.length > 0) {
        console.log('   - Page breakdown:');
        response.data.pageBreakdown.forEach(page => {
          console.log(`     Page ${page.pageNumber}: ${page.textLength} chars, confidence: ${page.confidence}, method: ${page.extractionMethod}`);
          if (page.preview && page.preview !== 'Error during OCR processing') {
            console.log(`       Preview: "${page.preview.slice(0, 100)}..."`);
          } else if (page.preview === 'Error during OCR processing') {
            console.log(`       ❌ Error during processing`);
          }
        });
      }

    } catch (error) {
      console.log('❌ Original debug endpoint failed:');
      if (error.response) {
        console.log(`   - Status: ${error.response.status}`);
        console.log(`   - Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`   - Error: ${error.message}`);
      }
    }

    // Test direct PDF parsing (without OCR)
    console.log('\n2. Testing direct PDF parsing (no OCR)...');
    try {
      const response = await axios.post('http://localhost:3000/debug/extract-pdf-text', {
        filename: 'free-invoice-direct.pdf',
        fileContent: `data:application/pdf;base64,${base64Content}`,
        size: pdfBuffer.length,
        useOCR: false // Try direct extraction first
      });

      console.log('✅ Direct parsing response:');
      console.log(`   - Method: ${response.data.extractionMethod || response.data.method}`);
      console.log(`   - Quality: ${response.data.quality}`);
      console.log(`   - Confidence: ${response.data.confidence}`);
      console.log(`   - Text Length: ${response.data.extractedLength || 0} characters`);
      
      if (response.data.extractedText && response.data.extractedText.length > 0) {
        console.log(`   - Preview: "${response.data.extractedText.slice(0, 300)}..."`);
        console.log(`   ✅ PDF has extractable text! OCR might not be necessary.`);
      } else {
        console.log(`   - No text extracted via direct parsing`);
        console.log(`   ⚠️ PDF likely contains images/scanned content - OCR would be needed`);
      }

    } catch (error) {
      console.log('❌ Direct parsing failed:');
      console.log(`   - Error: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Alternative: Test with enhanced service if available
async function testEnhancedService() {
  console.log('\n3. Testing enhanced OCR service (if available)...');
  
  try {
    const pdfPath = '/Users/Zen/Desktop/free-invoice.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Content = pdfBuffer.toString('base64');

    const response = await axios.post('http://localhost:3000/debug/ocr/test-ocr-with-force', {
      filename: 'free-invoice.pdf',
      fileContent: base64Content, // Direct base64, not data URL
      forceOCR: false // Let it decide based on content
    }, {
      timeout: 60000
    });

    console.log('✅ Enhanced service response:');
    console.log(`   - Method: ${response.data.result.extractionMethod}`);
    console.log(`   - Quality: ${response.data.result.quality}`);
    console.log(`   - Confidence: ${response.data.result.confidence}`);
    console.log(`   - Text Length: ${response.data.result.extractedLength} characters`);
    
    if (response.data.testReport.recommendations.length > 0) {
      console.log('   - Recommendations:');
      response.data.testReport.recommendations.forEach(rec => {
        console.log(`     • ${rec}`);
      });
    }

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('ℹ️  Enhanced service not available (service needs restart to load new endpoints)');
    } else {
      console.log(`❌ Enhanced service test failed: ${error.message}`);
    }
  }
}

async function main() {
  await testRealPDF();
  await testEnhancedService();
  
  console.log('\n🔍 Analysis Summary:');
  console.log('1. Check if your PDF has extractable text (direct parsing)');
  console.log('2. If no text extracted, OCR is needed but requires ImageMagick/GraphicsMagick');
  console.log('3. The root issue is missing convert/gm binaries for PDF-to-image conversion');
  console.log('4. Consider alternative solutions if system dependencies can\'t be installed');
}

main().catch(console.error);
