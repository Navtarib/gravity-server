import { Request, Response } from 'express';
import Settings from '../models/Settings';
import cloudinary from '../config/cloudinary';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      // Check if logo is being changed or removed
      if (req.body.shopLogo !== undefined && settings.shopLogo && settings.shopLogo !== req.body.shopLogo) {
        try {
          const urlParts = settings.shopLogo.split('/');
          const fileNameWithExtension = urlParts[urlParts.length - 1];
          const fileName = fileNameWithExtension.split('.')[0];
          const folderName = urlParts[urlParts.length - 2];
          const publicId = `${folderName}/${fileName}`;

          await cloudinary.uploader.destroy(publicId);
          console.log('Old logo deleted from Cloudinary:', publicId);
        } catch (cloudinaryError) {
          console.error('Error deleting old logo from Cloudinary:', cloudinaryError);
        }
      }
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
