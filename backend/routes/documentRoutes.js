import express from "express"
import{
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    updateDocument,
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
  .put(updateDocument)
  .delete( deleteDocument);

export default router;