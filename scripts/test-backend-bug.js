#!/usr/bin/env node

/**
 * Test for potential backend bugs by examining the exact filtering logic
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testBackendBug() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Testing for Backend Bugs');
    console.log('===========================');
    
    const userId = '84984478-40b1-703d-53d0-aef7aad3a874';
    const examNumber = 'ISACA-AAIA';
    const subDomain = '1';
    const states = ['EVER_WRONG'];
    
    console.log(`👤 User: ${userId}`);
    console.log(`📚 Exam: ${examNumber}`);
    console.log(`🏷️  Subdomain: ${subDomain}`);
    console.log(`🎯 States: [${states.join(', ')}]`);
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Step 1: Build match criteria (exactly like backend)
    const matchCriteria = { examNumber };
    if (subDomain) {
      matchCriteria.subDomainNum = subDomain;
    }
    
    console.log(`\n📋 Step 1 - Match criteria:`, matchCriteria);
    
    // Step 2: Get mastered questions to exclude
    const masteredQuestions = await userProgress.find({
      userId,
      state: 'MASTERED'
    }).toArray();
    
    const masteredIds = masteredQuestions.map(p => p.questionId);
    if (masteredIds.length > 0) {
      matchCriteria._id = { $nin: masteredIds };
    }
    
    console.log(`📋 Step 2 - Mastered exclusion: ${masteredIds.length} questions excluded`);
    
    // Step 3: Get user progress for state filtering
    const progressMap = new Map();
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    console.log(`📋 Step 3 - Progress map: ${userProgressDocs.length} records loaded`);
    
    // Step 4: Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    console.log(`📋 Step 4 - Matching questions: ${allQuestions.length} found`);
    
    // Step 5: Apply state filter (this is where the bug might be)
    console.log(`\n🔍 Step 5 - Applying state filter:`);
    
    let debugCount = 0;
    const filteredQuestions = allQuestions.filter(q => {
      const qId = q._id.toString();
      const progress = progressMap.get(qId);
      
      debugCount++;
      if (debugCount <= 5) {
        console.log(`   Question ${debugCount}:`);
        console.log(`     ID: ${qId}`);
        console.log(`     Progress: ${progress ? 'Found' : 'Not found'}`);
        if (progress) {
          console.log(`     State: ${progress.state}`);
          console.log(`     Wrong Count: ${progress.wrongCount}`);
          console.log(`     EVER_WRONG match: ${progress.wrongCount > 0}`);
        }
      }
      
      if (!progress) {
        // No progress = NEW
        const matches = states.includes('NEW');
        if (debugCount <= 5) console.log(`     Result: ${matches} (NEW)`);
        return matches;
      }
      
      // Check for EVER_WRONG filter
      if (states.includes('EVER_WRONG') && progress.wrongCount > 0) {
        if (debugCount <= 5) console.log(`     Result: true (EVER_WRONG)`);
        return true;
      }
      
      // Check for regular state filters
      const matches = states.includes(progress.state);
      if (debugCount <= 5) console.log(`     Result: ${matches} (state: ${progress.state})`);
      return matches;
    });
    
    console.log(`📋 Step 5 - Filtered questions: ${filteredQuestions.length}`);
    
    if (filteredQuestions.length === 0) {
      console.log(`\n❌ BUG CONFIRMED: Filter returns 0 questions`);
      
      // Let's debug why
      console.log(`\n🔍 Debugging the filter failure:`);
      
      // Check if any questions have progress
      const questionsWithProgress = allQuestions.filter(q => {
        const progress = progressMap.get(q._id.toString());
        return !!progress;
      });
      console.log(`   Questions with progress: ${questionsWithProgress.length}/${allQuestions.length}`);
      
      // Check if any have wrongCount > 0
      const questionsWithWrongCount = allQuestions.filter(q => {
        const progress = progressMap.get(q._id.toString());
        return progress && progress.wrongCount > 0;
      });
      console.log(`   Questions with wrongCount > 0: ${questionsWithWrongCount.length}`);
      
      // Check if the progress map is working correctly
      console.log(`\n🔍 Progress map debugging:`);
      const sampleQuestion = allQuestions[0];
      const sampleProgress = progressMap.get(sampleQuestion._id.toString());
      console.log(`   Sample question ID: ${sampleQuestion._id.toString()}`);
      console.log(`   Sample progress found: ${!!sampleProgress}`);
      if (sampleProgress) {
        console.log(`   Sample progress:`, {
          state: sampleProgress.state,
          wrongCount: sampleProgress.wrongCount,
          rightCount: sampleProgress.rightCount
        });
      }
      
      // Check if there's a type mismatch in the progress map
      console.log(`\n🔍 Type mismatch check:`);
      const progressKeys = Array.from(progressMap.keys()).slice(0, 3);
      const questionIds = allQuestions.slice(0, 3).map(q => q._id.toString());
      console.log(`   Progress map keys (sample):`, progressKeys);
      console.log(`   Question IDs (sample):`, questionIds);
      
    } else {
      console.log(`\n✅ Filter works correctly: ${filteredQuestions.length} questions found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testBackendBug().catch(console.error);