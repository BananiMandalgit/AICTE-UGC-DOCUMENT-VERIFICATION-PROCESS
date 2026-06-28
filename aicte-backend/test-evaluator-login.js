const axios = require('axios');

async function testEvaluatorLogin() {
  const SERVER_URL = 'http://localhost:3100';
  
  console.log('🔐 Testing Evaluator Login...\n');
  
  try {
    // Login as johndoe@example.com
    console.log('1️⃣ Logging in as johndoe@example.com...');
    const loginResponse = await axios.post(`${SERVER_URL}/evaluator/auth/login`, {
      authKey: 'johndoe@example.com',
      password: 'Test@123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const evaluator = loginResponse.data.data.evaluator;
      
      console.log('✅ Login successful!');
      console.log('   Evaluator:', evaluator.email);
      console.log('   Role:', evaluator.role);
      console.log('   Token:', token.substring(0, 20) + '...\n');

      // Test fetching evaluator data with the token
      console.log('2️⃣ Fetching assigned applications...');
      const dataResponse = await axios.get(`${SERVER_URL}/evaluator/data/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const assignedApps = dataResponse.data.evaluator.assigned_document || [];
      console.log(`✅ Found ${assignedApps.length} assigned application(s)\n`);
      
      if (assignedApps.length > 0) {
        assignedApps.forEach((app, index) => {
          console.log(`   Application ${index + 1}:`);
          console.log(`   - ID: ${app.uni_application_id}`);
          console.log(`   - Name: ${app.application_name}`);
          console.log(`   - Documents: ${app.UniversityDocuments?.length || 0}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️  No applications assigned yet.');
        console.log('   💡 Submit a new application from the institute page first!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEvaluatorLogin();
