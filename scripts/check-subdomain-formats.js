#!/usr/bin/env node

/**
 * Check subdomain formatting in ISACA-AAIA questions
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkSubdomainFormats() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Checking Subdomain Formats in ISACA-AAIA');
    console.log('==========================================');
    
    const questions = db.collection('questions');
    
    // Get all unique subdomain formats for ISACA-AAIA
    const subdomains = await questions.aggregate([
      { $match: { examNumber: 'ISACA-AAIA' } },
      { 
        $group: { 
          _id: '$subDomainNum', 
          count: { $sum: 1 },
          sampleSubDomain: { $first: '$subDomain' }
        } 
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log(`📊 ISACA-AAIA Subdomain Breakdown:`);
    subdomains.forEach(sd => {
      console.log(`   ${sd._id} (${typeof sd._id}): ${sd.count} questions - "${sd.sampleSubDomain}"`);
    });
    
    // Check if "1" vs 1 vs "1.0" might be causing issues
    console.log(`\n🔍 Checking for potential type mismatches:`);
    
    const testValues = ['1', 1, '1.0', 1.0];
    
    for (const testValue of testValues) {
      const count = await questions.countDocuments({ 
        examNumber: 'ISACA-AAIA', 
        subDomainNum: testValue 
      });
      console.log(`   subDomainNum === ${JSON.stringify(testValue)} (${typeof testValue}): ${count} questions`);
    }
    
    // Check what the frontend might be sending
    console.log(`\n💡 Frontend Analysis:`);
    console.log(`   If frontend sends subDomain: "1" (string)`);
    console.log(`   But database has subDomainNum: 1.0 (number)`);
    console.log(`   Then the query would find 0 questions!`);
    
    // Show some sample questions to see the exact format
    console.log(`\n📝 Sample questions from each subdomain:`);
    for (const sd of subdomains.slice(0, 3)) {
      const sample = await questions.findOne({ 
        examNumber: 'ISACA-AAIA', 
        subDomainNum: sd._id 
      });
      
      console.log(`   Subdomain ${sd._id}:`);
      console.log(`     subDomainNum: ${JSON.stringify(sample.subDomainNum)} (${typeof sample.subDomainNum})`);
      console.log(`     subDomain: "${sample.subDomain}"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSubdomainFormats().catch(console.error);