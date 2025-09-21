// Test frontend API connectivity
console.log('Testing ApexFlow API connectivity...');

// Check environment variables
console.log('Environment variables:');
console.log('VITE_API_BASE_URL:', import.meta?.env?.VITE_API_BASE_URL);
console.log('Process env:', process?.env);

// Test API calls
async function testAPI() {
  const baseUrl = 'http://localhost:3000'; // Direct URL for testing
  
  console.log('\n=== Testing API Connectivity ===');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log('Health status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Health data:', healthData);
    
    // Test 2: Get workflows
    console.log('\n2. Testing get workflows...');
    const workflowsResponse = await fetch(`${baseUrl}/workflows`);
    console.log('Workflows status:', workflowsResponse.status);
    const workflowsData = await workflowsResponse.json();
    console.log('Workflows data:', workflowsData);
    
    // Test 3: Create workflow
    console.log('\n3. Testing create workflow...');
    const createResponse = await fetch(`${baseUrl}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Frontend Test Workflow',
        description: 'Testing from frontend',
        steps: [
          {
            name: 'Extract Text',
            type: 'extract_text',
            config: {}
          }
        ]
      })
    });
    console.log('Create status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('Created workflow:', createData);
      
      // Test 4: Delete the test workflow
      const workflowId = createData.workflow._id;
      console.log(`\n4. Testing delete workflow ${workflowId}...`);
      const deleteResponse = await fetch(`${baseUrl}/workflows/${workflowId}`, {
        method: 'DELETE'
      });
      console.log('Delete status:', deleteResponse.status);
      const deleteData = await deleteResponse.json();
      console.log('Delete result:', deleteData);
    } else {
      const errorData = await createResponse.json();
      console.error('Create failed:', errorData);
    }
    
  } catch (error) {
    console.error('API Test failed:', error);
  }
}

// Run the test
testAPI();
