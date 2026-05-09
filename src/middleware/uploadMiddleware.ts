// import multer from 'multer';
// import CloudinaryStorage from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary';

// const storage = CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'pos-products',
//     allowed_formats: ['jpg', 'png', 'jpeg'],
//     transformation: [{ width: 500, height: 500, crop: 'limit' }],
//   } as any,
// });

// const upload = multer({ storage: storage });

// export default upload;




import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
});

export default upload;