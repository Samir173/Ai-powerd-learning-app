import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as genminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

//@desc Generate flashcards from document
//@route POST/api/ai/generate-flashcard
//@access Private
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10  } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide a documentId",
        statusCode: 400
      });
    }
    const document = await Document.findOne({
      _id:documentId,
      userId: req.user._id,
      status: "ready"
    });
    if(!document){
      return res.status(400).json({
       success: false,
       error: "Document not found or not ready",
       statusCode: 400 
      });
    }
    // Generate flashcards using gemini
    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count)
    );
    // Save to database
    const flashcardSet = new Flashcard({
      userId: req.user._id,
      documentId: document._id,
      cards: cards.map(card =>({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false,
      }))
    });
    await flashcardSet.save()
    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: "flashcards generated successfully"
    });

  } catch (error) {
    next(error);
  }
};
//@desc Generate quiz from document
//@route POST/api/ai/generate-flashcard
//@access Private
export const generateQuiz = async (req, res, next) => {

};
//@desc Generate document summary
//@route POST/api/ai/generate-symary
//@access Private
export const generateSummary = async (req, res, next) => {

};
//@desc Chat with document
//@route POST/api/ai/chat
//@access Private
export const chat = async (req, res, next) => {

};
//@desc Explain concept from document 
//@route POST/api/ai/explan-concept
//@access Private
export const explainConcept = async (req, res, next) => {

};
//@desc Get chat history
//@route POST/api/ai/chat-history/:documentId
//@access Private
export const getChatHistory = async(req,res,next) =>{

};
