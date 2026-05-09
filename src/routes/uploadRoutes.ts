// import express from 'express';
// import upload from '../middleware/uploadMiddleware';
// import { protect, adminOnly } from '../middleware/authMiddleware';

// const router = express.Router();

// router.post('/', protect, adminOnly, upload.single('image'), (req: any, res: any) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }
//   res.json({ url: req.file.path });
// });

// export default router;


import express, { Request, Response } from "express";
import upload from "../middleware/uploadMiddleware";
import cloudinary from "../config/cloudinary";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const result = await cloudinary.uploader.upload_stream(
        { folder: "pos-products" },
        (error, result) => {
          if (error) {
            res.status(500).json(error);
            return;
          }

          res.json({ url: result?.secure_url });
        }
      );

      result.end(req.file.buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed", error: err });
    }
  }
);

export default router;