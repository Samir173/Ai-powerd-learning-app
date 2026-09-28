import express from "express"
import{
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
} from "../controllers/documentController.js"
import protect from "../middleware/auth.js"
import upload from "../config/multer.js"

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router
  .route("/:id")
  .get(getDocument)
  .delete( deleteDocument);

export default router;