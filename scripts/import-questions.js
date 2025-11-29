// scripts/import-questions.js - Script for seeding the MongoDB database

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const CSV_FILE_PATH = path.resolve(__dirname, '../data/questions.csv'); // ASSUMES the CSV is here!

// --- DATABASE CONNECTION (Similar to server.js) ---
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'aws-quiz-db' });
        console.log('Database connected for import.');
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
    examNumber: String,
    subDomainNum: String,
    subDomain: String,
});
const Question = mongoose.model('Question', QuestionSchema);


// --- IMPORT LOGIC ---
async function importData() {
    await connectDB(); // Ensure connection is active
    
    // Safety check: clear old data before import
    try {
        await Question.deleteMany({});
        console.log('Existing questions cleared.');
    } catch (e) {
        console.error('Error clearing data:', e.message);
        mongoose.connection.close();
        return;
    }

    const results = [];
    let processedCount = 0;

    console.log(`Starting import from: ${CSV_FILE_PATH}`);

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (data) => {
            // NOTE: Column names must match your CSV header exactly!
            // Adjust 'Question', 'ExamID', 'V_SubDomainNum', etc., to match your sheet
            
            // Map CSV columns to MongoDB fields
            const newDoc = {
                questionText: data['question'],
                optionA: data['option A'],
                optionB: data['option B'],
                optionC: data['option C'],
                optionD: data['option D'],
                optionE: data['option E'],
                optionF: data['option F'],
                answer: data['answer'],
                examNumber: data['_ExamNumber'],
                subDomainNum: data['_SubDomainNum'],
                subDomain: data['_SubDomainName'],
            };

results.push(newDoc);
            processedCount++;
        })
        .on('end', async () => {
            console.log(`Finished reading ${processedCount} records from CSV.`);

            if (results.length === 0) {
                console.warn("No data found in CSV. Check file content and column headers.");
            }
            
            try {
                // Insert all parsed documents into the MongoDB collection
                await Question.insertMany(results, { ordered: false });
                console.log(`Successfully imported ${results.length} documents!`);
            } catch (e) {
                console.error('Error inserting data:', e.message);
            } finally {
                mongoose.connection.close(); // Close the connection
            }
        })
        .on('error', (err) => {
            console.error('File Read Error:', err.message);
            mongoose.connection.close();
        });
}

importData();