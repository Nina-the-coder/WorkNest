const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Corrected 'cd' to 'cb'
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName); // Corrected 'cb' usage
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (
    (extname === ".jpg" || extname === ".jpeg" || extname === ".png") &&
    (mimetype === "image/jpeg" || mimetype === "image/png")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG and PNG images are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

//middleware to convert upload file to webp
const convertToWebP = async (req, res, next) => {
  if (!req.file) return next();

  const inputPath = req.file.path;
  const outputPath = `${req.file.destination}/${Date.now()}-${
    path.parse(req.file.originalname).name
  }.webp`;

  try {
    await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);

    fs.unlinkSync(inputPath);

    req.file.filename = path.basename(outputPath);
    req.file.path = outputPath;
    req.file.mimetype = "image/webp";

    next();
  } catch (err) {
    console.error("Error converting image to WebP: ", err);
    next(err);
  }
};

module.exports = {upload, convertToWebP};
