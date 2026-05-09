import { Request, Response } from 'express';
import Product from '../models/Product';
import cloudinary from '../config/cloudinary';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isAvailable: true });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProductsAdmin = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, costPrice, category, image, stock } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
      costPrice,
      category,
      image,
      stock,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

    // Agar image change ho rahi hai to purani delete karo
    if (req.body.image !== undefined && existingProduct.image && existingProduct.image !== req.body.image) {
      try {
        const urlParts = existingProduct.image.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExtension.split('.')[0];
        const folderName = urlParts[urlParts.length - 2];
        const publicId = `${folderName}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
        console.log('Old product image deleted from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting old product image from Cloudinary:', cloudinaryError);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Cloudinary se image delete karna
    if (product.image) {
      try {
        // URL se public_id nikaalna
        // Example: https://res.cloudinary.com/cloud_name/image/upload/v12345/pos-products/abc.jpg
        // Result: pos-products/abc
        const urlParts = product.image.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExtension.split('.')[0];
        const folderName = urlParts[urlParts.length - 2];
        const publicId = `${folderName}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Hum product delete karna jari rakhenge chahe image delete na bhi ho
      }
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product and image deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
