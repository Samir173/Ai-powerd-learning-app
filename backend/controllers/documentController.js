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

    // 1. Create the base document in your database
    const document = await Document.create({
      user: req.user._id,
      title: req.body.title || req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    // 2. Extract the massive text string from the physical file
    console.log(`Parsing PDF: ${document.filePath}`);
    const parsedPdf = await extractTextFromPDF(document.filePath);

    // 3. Split the text into clean AI tokens (Awaiting the async chunker)
    console.log("Splitting text into token chunks...");
    const textChunks = chunkText(parsedPdf.text, 800, 100);

    console.log(`Successfully generated ${textChunks.length} chunks.`);

    // 4. Return the response to the user
    // (You can pass the chunks back, or save them to your DB before returning)
    res.status(201).json({
      success: true,
      data: {
        document,
        totalChunks: textChunks.length,
        // chunks: textChunks // Optional: send to frontend if needed
      },
      message: "Document uploaded and processed successfully",
    });
  } catch (error) {
    // If the PDF parsing fails, clean up the database entry so you don't keep dead links
    next(error);
  }
};

// @desc Get all user documents
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: documents,
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
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update document
// @route PUT /api/documents/:id
// @access Private
export const updateDocument = async (req, res, next) => {
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
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const { title } = req.body;

    if (title) {
      document.title = title;
    }

    await document.save();

    res.status(200).json({
      success: true,
      data: document,
      message: "Document updated successfully",
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
      user: req.user._id,
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
        await fs.unlink(document.filePath);
      } catch (error) {
        console.log("File could not be deleted:", error.message);
      }
    }

    await document.deleteOne();

    // Delete related flashcards
    await Flashcard.deleteMany({
      document: document._id,
    });

    // Delete related quizzes
    await Quiz.deleteMany({
      document: document._id,
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
