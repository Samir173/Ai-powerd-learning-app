import express from "express";
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getchatHistory
} from "../controllers/aiController.js";
import {protect} from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/generate-flashcards",generateFlashcards);
router.post("/generate-quiz",generateQuiz);
router.post("/generate-summary",generateSummary);
router.post("/chat",chat);
router.post("/explain-concept",explainConcept);
router.get("/chat-history",getchatHistory);

export default router;