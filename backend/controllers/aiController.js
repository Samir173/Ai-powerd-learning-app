import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

//@desc Generate flashcards from document
//@route POST/api/ai/generate-flashcard
//@access Private
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide a documentId",
        statusCode: 400,
      });
    }
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });
    if (!document) {
      return res.status(400).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 400,
      });
    }
    // Generate flashcards using gemini
    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count),
    );
    // 4. Validate AI service payload output
    if (!cards || cards.length === 0) {
      return res.status(502).json({
        // 502 Bad Gateway is perfect for AI service failure
        success: false,
        error:
          "Failed to generate valid flashcards from the document. Please try again.",
        statusCode: 502,
      });
    }
    // Save to database
    const flashcardSet = new Flashcard({
      userId: req.user._id,
      documentId: document._id,
      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false,
      })),
    });
    await flashcardSet.save();
    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: "flashcards generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
//@desc Generate quiz from document
//@route POST/api/ai/generate-quiz
//@access Private
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numberofQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide a documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(400).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 400,
      });
    }

    // Generate quiz using gemini
    const questions = await geminiService.generateQuiz(
      document.extractedText,
      parseInt(numberofQuestions),
    );

    if (!questions || questions.length === 0) {
      return res.status(502).json({
        success: false,
        error: "Failed to generate quiz questions. Please try again.",
        statusCode: 502,
      });
    }

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} Quiz`,
      questions: questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0,
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: "Quiz generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
//@desc Generate document summary
//@route POST/api/ai/generate-summary
//@access Private
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide a documentId",
        statusCode: 400,
      });
    }
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });
    if (!document) {
      return res.status(400).json({
        success: false,
        error: "Document not found",
        statusCode: 400,
      });
    }
    // Generate summary using Gemini
    const summary = await geminiService.generateSummary(document.extractedText);
    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary,
      },
      message: "Summary generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
//@desc Chat with document
//@route POST/api/ai/chat
//@access Private
export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId and question",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }
    // Find relevant chunks from the document
    const relevantChunks = findRelevantChunks(document.chunks, question, 3);
    const chunkIndices = relevantChunks.map((c) => c.chunkIndex);
    // Get chat history for the document
    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id,
    });
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: [],
      });
    }
    // Generate response using Gemini
    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
    );

    // Save conversation
    chatHistory.messages.push(
      {
        role: "user",
        content: question,
        timestamp: new Date(),
        relevantChunks: [],
      },
      {
        role: "assistant",
        content: answer,
        timestamp: new Date(),
        relevantChunks: chunkIndices,
      },
    );
    await chatHistory.save();
    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chatHistoryId: chatHistory._id
      },
      message: "Chat response generated"
    });
  } catch (error) {
    next(error);
  }
};
//@desc Explain concept from document
//@route POST/api/ai/explan-concept
//@access Private
export const explainConcept = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
//@desc Get chat history
//@route POST/api/ai/chat-history/:documentId
//@access Private
export const getChatHistory = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
