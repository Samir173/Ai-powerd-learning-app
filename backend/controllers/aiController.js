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
export const getChatHistory = async(req,res,next) =>{};
