const express = require("express");
const path = require("path");
const multer = require("multer");

const uploader = (allowed_file_types, max_file_size) => {
  // File upload folder
  const UPLOADS_FOLDER = path.join(__dirname, "public/uploads");

  // define the storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName =
        file.originalname
          .replace(fileExt, "")
          .toLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now();

      cb(null, fileName + fileExt);
    },
  });

  // preapre the final multer upload object
  const upload = multer({
    storage: storage,
    limits: { files: 1, fileSize: max_file_size },
    fileFilter: (req, file, cb) => {
      if (!allowed_file_types.includes(file.mimetype)) {
        return cb(new Error("Only .jpg, jpeg or .png format allowed!"), false);
      }
      const fileSize = parseInt(req.headers["content-length"]);
      if (fileSize > max_file_size) {
        return cb(
          new Error("File size is too large. Please upload files below 1MB!"),
          false
        );
      }
      cb(null, true);
    },
  });

  return upload;
};

const app = express();
const port = 3000;

// request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// set view engine
app.set("view engine", "ejs");

// set static folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("fileUploadForm");
});

const avatarUpload = (req, res, next) => {
  const upload = uploader(["image/jpeg", "image/jpg", "image/png"], 1000000);

  // call the middleware function
  upload.any()(req, res, (err) => {
    if (err) {
      res.status(500).send({
        errors: {
          avatar: {
            msg: err.message,
          },
        },
      });
    } else {
      next();
    }
  });
};

app.post("/upload", avatarUpload, (req, res, next) => {
  const result = {
    file: req.file,
    body: req.body,
  };
  res.send(result);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  // json response
  console.log(err);
  res.json(err);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
