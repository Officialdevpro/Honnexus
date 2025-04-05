const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Folder path
const uploadPath = path.join(__dirname, "..", "public", "uploads");

// Ensure the folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `book-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// File filter (optional, can restrict file types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, jpg) are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
