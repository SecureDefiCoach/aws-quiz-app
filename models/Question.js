// models/Question.js

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    // --- FIELDS FROM CSV ---
    questionText: { type: String, required: true },
    optionA: { type: String },
    optionB: { type: String },
    optionC: { type: String },
    optionD: { type: String },
    optionE: { type: String },
    optionF: { type: String },
    answer: { type: String },
    examNumber: { type: String, required: true },
    examName: { type: String },
    domainNum: { type: String },      // Optional: "1" for domain-level grouping
    domainName: { type: String },     // Optional: "Access Controls"
    subDomainNum: { type: String, required: true },
    subDomain: { type: String, required: true },
    explanation: { type: String },
    originalNumber: { type: String },
    
    // --- MARKING SYSTEM ---
    markType: { type: Number, default: 0 }, // 0=None, 1=Mark, 2=CreateMore, 3=Lab
    
    // --- STATIC METADATA ---
    isMaster: { type: Boolean, default: false }, 
    createdDate: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);