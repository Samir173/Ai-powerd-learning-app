import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import fs from "fs/promises";
import mongoose from "mongoose";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";

// @desc Upload PDF document
// @route POST /api/documents/upload
// @access Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF document",
        statusCode: 400,
      });
    }
    // Validate title first
    const { title } = req.body;
    if (!title || title.trim() === "") {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Please provide a title for the document",
        statusCode: 400,
      });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    // 1. Create the base document in your database
    const document = await Document.create({
      userId: req.user._id,
      title: title.trim(),
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl: fileUrl, // FIX 2: Added missing property to store it in DB
      fileSize: req.file.size,
      status: `processing`,
    });
    processPDF(document._id, req.file.path).catch((err) => {
      console.error("PDF processing error:", err);
    });
    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded and processing",
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

//Helper function to process the PDF in the background
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    const chunks = chunkText(text, 800, 100);
    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: `ready`,
    });
    console.log(`Document ${documentId}processed successfully.`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: `failed`,
    });
  }
};

// @desc Get all user documents
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "flashcards",
          localField: "_id",
          foreignField: "documentId",
          as: "flashcards",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "documentId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          flashcardCount: { $size: "$flashcards" },
          quizCount: { $size: "$quizzes" },
        },
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0,
          flashcards: 0,
        },
      },
      {
        $sort: { uploadDate: -1 },
      },
    ]);
    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single document
// @route GET /api/documents/:id
// @access Private
export const getDocument = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }
    //Get flashcard and quiz counts
    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
      userId: req.user._id
    });
    const quizCount = await Quiz.countDocuments({
      documentId: document._id,
      userId: req.user._id
    });
    //Update last accessed
    document.lastAccessed = Date.now();
    await document.save();

    //Combine document data with counts
    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete document
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // Delete the uploaded file
    if (document.filePath) {
      try {
        await fs.unlink(document.filePath).catch(()=> {});
      } catch (error) {
        console.log("File could not be deleted:", error.message);
      }
    }

    await document.deleteOne();

    // Delete related flashcards
    await Flashcard.deleteMany({
      documentId: document._id, 
    });

    // Delete related quizzes
    await Quiz.deleteMany({
      documentId: document._id, 
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
