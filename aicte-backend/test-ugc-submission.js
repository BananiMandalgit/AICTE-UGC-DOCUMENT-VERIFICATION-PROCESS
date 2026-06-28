const axios = require('axios');

async function testUgcSubmission() {
  try {
    const payload = {
      application: {
        uni_application_id: 'test-ugc-app-001',
        application_name: 'Test UGC Submission',
        application_description: 'Testing UGC new university application',
        application_id: 'ugc_new_university'
      },
      institute_id: '1b1b3422-18a2-4ecd-96d4-15f161d4a039', // From seed
      documents: [
        {
          doc_id: 'part-a-legal-statutory-state-act-gazette-notification',
          uni_doc_uri: 'http://localhost:3100/uploads/test-doc.pdf'
        }
      ]
    };

    console.log('Sending test request to UGC submission endpoint...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'http://localhost:3100/api/institute/data/new_application',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ ERROR!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
  }
}

testUgcSubmission();
