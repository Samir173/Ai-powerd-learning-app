import express from "express";
import {
  getFlashcards,
  getAllFlashcardSets,
  markFlashcardAsReviewed,
  toggleStarFlashcard,
  deleteFlashcardSets,
} from "../controllers/flashcardController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllFlashcardSets);
router.get("/:documentId", getFlashcards);
router.post("/:cardId/review", markFlashcardAsReviewed);
router.put("/:cardId/star", toggleStarFlashcard);
router.delete("/:id", deleteFlashcardSets);

export default router;
