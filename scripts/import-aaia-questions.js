// scripts/import-aaia-questions.js - Script for appending ISACA AAIA questions to existing data

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const CSV_FILE_PATH = path.resolve(__dirname, '../data/isaca-aaia_v2.csv'); // Use the corrected file

// --- DATABASE CONNECTION (Similar to server.js) ---
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'aws-quiz-db' });
        console.log('Database connected for AAIA import.');
    } catch (err) {
        console.error(`Database connection failed: ${err.message}`);
        process.exit(1);
    }
}

// --- QUESTION MODEL WITH ALL FIELDS ---
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

// --- IMPORT LOGIC ---
async function importAAIAData() {
    await connectDB(); // Ensure connection is active
    
    // Check existing data
    try {
        const existingCount = await Question.countDocuments();
        console.log(`Found ${existingCount} existing questions in database.`);
        
        // Check if AAIA questions already exist
        const aaiaCount = await Question.countDocuments({ examNumber: 'ISACA-AAIA' });
        if (aaiaCount > 0) {
            console.log(`Warning: Found ${aaiaCount} existing ISACA-AAIA questions. This will add duplicates.`);
            console.log('Consider clearing AAIA questions first if this is not intended.');
        }
    } catch (e) {
        console.error('Error checking existing data:', e.message);
        mongoose.connection.close();
        return;
    }

    const results = [];
    let processedCount = 0;

    console.log(`Starting AAIA import from: ${CSV_FILE_PATH}`);

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (data) => {
            // Map CSV columns to MongoDB fields
            const newDoc = {
                questionText: data['question'],
                optionA: data['option A'],
                optionB: data['option B'],
                optionC: data['option C'],
                optionD: data['option D'],
                optionE: data['option E'] || '',
                optionF: data['option F'] || '',
                answer: data['answer'],
                explanation: data['_Explanation'],
                examNumber: data['_ExamNumber'],
                examName: data['_ExamName'],
                subDomainNum: data['_SubDomainNum'],
                subDomain: data['_SubDomainName'],
                originalNumber: data['_OriginalNumber'],
            };

            results.push(newDoc);
            processedCount++;
        })
        .on('end', async () => {
            console.log(`Finished reading ${processedCount} AAIA records from CSV.`);

            if (results.length === 0) {
                console.warn("No data found in CSV. Check file content and column headers.");
                mongoose.connection.close();
                return;
            }
            
            try {
                // Insert all parsed documents into the MongoDB collection (APPEND mode)
                await Question.insertMany(results, { ordered: false });
                console.log(`Successfully imported ${results.length} ISACA AAIA questions!`);
                
                // Show final counts
                const totalCount = await Question.countDocuments();
                const scsCount = await Question.countDocuments({ examNumber: 'SCS-C02' });
                const aaiaCount = await Question.countDocuments({ examNumber: 'ISACA-AAIA' });
                
                console.log('\n=== IMPORT SUMMARY ===');
                console.log(`Total questions in database: ${totalCount}`);
                console.log(`SCS-C02 questions: ${scsCount}`);
                console.log(`ISACA-AAIA questions: ${aaiaCount}`);
                console.log('======================\n');
                
            } catch (e) {
                console.error('Error inserting AAIA data:', e.message);
            } finally {
                mongoose.connection.close(); // Close the connection
            }
        })
        .on('error', (err) => {
            console.error('File Read Error:', err.message);
            mongoose.connection.close();
        });
}

// Add command line option to clear AAIA questions first
const args = process.argv.slice(2);
if (args.includes('--clear-aaia')) {
    console.log('Clearing existing ISACA-AAIA questions first...');
    connectDB().then(async () => {
        try {
            const deleteResult = await Question.deleteMany({ examNumber: 'ISACA-AAIA' });
            console.log(`Deleted ${deleteResult.deletedCount} existing ISACA-AAIA questions.`);
            mongoose.connection.close();
            
            // Wait a moment then run the import
            setTimeout(() => {
                importAAIAData();
            }, 1000);
        } catch (e) {
            console.error('Error clearing AAIA data:', e.message);
            mongoose.connection.close();
        }
    });
} else {
    importAAIAData();
}