// scripts/query-database.js - Script to query and verify database contents

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

// Question Schema
const QuestionSchema = new mongoose.Schema({
    questionText: String,
    optionA: String,
    optionB: String,
    optionC: String,
    optionD: String,
    optionE: String,
    optionF: String,
    answer: String,
    explanation: String,
    examNumber: String,
    examName: String,
    subDomainNum: String,
    subDomain: String,
    originalNumber: String,
});
const Question = mongoose.model('Question', QuestionSchema);

async function queryDatabase() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'aws-quiz-db' });
        console.log('Connected to database for querying...\n');

        // Get total counts
        const totalCount = await Question.countDocuments();
        console.log(`📊 TOTAL QUESTIONS: ${totalCount}`);

        // Get counts by exam
        const examCounts = await Question.aggregate([
            {
                $group: {
                    _id: { examNumber: "$examNumber", examName: "$examName" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.examNumber": 1 } }
        ]);

        console.log('\n📋 QUESTIONS BY EXAM:');
        examCounts.forEach(exam => {
            console.log(`   ${exam._id.examNumber}: ${exam.count} questions`);
            console.log(`   └─ ${exam._id.examName}`);
        });

        // Get AAIA domain breakdown
        console.log('\n🤖 ISACA-AAIA DOMAIN BREAKDOWN:');
        const aaiaDomains = await Question.aggregate([
            { $match: { examNumber: "ISACA-AAIA" } },
            {
                $group: {
                    _id: { subDomainNum: "$subDomainNum", subDomain: "$subDomain" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.subDomainNum": 1 } }
        ]);

        aaiaDomains.forEach(domain => {
            console.log(`   ${domain._id.subDomainNum}: ${domain.count} questions`);
            console.log(`   └─ ${domain._id.subDomain}`);
        });

        // Sample a few AAIA questions to verify content
        console.log('\n🔍 SAMPLE ISACA-AAIA QUESTIONS:');
        const sampleQuestions = await Question.find({ examNumber: "ISACA-AAIA" }).limit(3);
        
        sampleQuestions.forEach((q, index) => {
            console.log(`\n   ${index + 1}. ${q.questionText.substring(0, 100)}...`);
            console.log(`      Answer: ${q.answer}`);
            console.log(`      Domain: ${q.subDomainNum} - ${q.subDomain}`);
        });

        console.log('\n✅ Database query completed successfully!');

    } catch (error) {
        console.error('❌ Database query failed:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

queryDatabase();