if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

const express = require("express"),
  router = express.Router(),
  multer = require("multer"),
  inMemoryStorage = multer.memoryStorage(),
  uploadStrategy = multer({ storage: inMemoryStorage }).array("image"),
  { BlobServiceClient } = require("@azure/storage-blob"),
  getStream = require("into-stream");

const handleError = (err, res) => {
  res.status(500);
  res.render("error", { error: err });
};

const getBlobName = (originalName) => {
  return originalName;
};

router.post("/", uploadStrategy, (req, res) => {
  const files = req.files,
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    ),
    containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  for (let file of files) {
    const blobName = getBlobName(file.originalname);
    const blobClient = blobServiceClient.getContainerClient(containerName);
    const stream = getStream(file.buffer);
    const streamLength = file.buffer.streamLength;

    const blockBlobClient = blobClient.getBlockBlobClient(blobName);

    blockBlobClient.uploadStream(stream, streamLength).catch((err) => {
      if (err) {
        console.log(err);
        handleError(err);
        return;
      }
    });
  }
  res.render("success", {
    message:
      "File uploaded to Azure Blob storage. File will be processed for Q&A",
  });
});

module.exports = router;
