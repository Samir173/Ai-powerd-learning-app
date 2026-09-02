import express from "express"
import{
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
} from "../controllers/documentController"
import protect from "../middleware/auth"
import upload from "../config/multer"

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router
  .route("/:id")
  .get(getDocument)
  .delete( deleteDocument);

export default router;