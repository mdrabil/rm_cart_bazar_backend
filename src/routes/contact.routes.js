import express from "express"
import multer from "multer"

import {createOrUpdateContact,getContact, getContactPublic} from "../controllers/websites/contact.controller.js"

const router = express.Router()

const upload = multer()

router.post("/contact",upload.single("image"),createOrUpdateContact)

router.get("/contact",getContact)
router.get("/contact/public",getContactPublic)

export default router