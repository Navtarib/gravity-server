declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  
  interface CloudinaryStorageOptions {
    cloudinary?: any;
    params?: {
      folder?: string;
      allowed_formats?: string[];
      transformation?: any[];
      [key: string]: any;
    };
    folder?: string;
    allowedFormats?: string[];
    publicId?: (req: any, file: any) => string;
    [key: string]: any;
  }

  function CloudinaryStorage(options: CloudinaryStorageOptions): StorageEngine;
  
  export default CloudinaryStorage;
}
