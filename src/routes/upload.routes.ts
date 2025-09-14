import { Hono } from "hono";
import { uploadJsonToIPFS, uploadFileToIPFS } from "../services/upload.service";
import { generateUploadKey } from "../utils/pinata";

const uploadRouter = new Hono();

uploadRouter.get("/key", async (c) => {
  try {
    const keyData = await generateUploadKey();
    
    if (!keyData) {
      return c.json({
        success: false,
        error: "Failed to generate upload key"
      }, 500);
    }

    return c.json({
      success: true,
      data: keyData
    });
  } catch (error) {
    console.error("Error generating upload key:", error);
    return c.json({
      success: false,
      error: "Failed to generate upload key"
    }, 500);
  }
});

uploadRouter.post("/json", async (c) => {
  try {
    const jsonData = await c.req.json();
    
    if (!jsonData || typeof jsonData !== 'object') {
      return c.json({
        success: false,
        error: "Invalid JSON data provided"
      }, 400);
    }

    const result = await uploadJsonToIPFS(jsonData);
    
    if (!result.success) {
      return c.json(result, 500);
    }

    return c.json({
      success: true,
      message: "JSON uploaded to IPFS successfully",
      data: {
        ipfsHash: result.ipfsHash,
        ipfsUrl: result.ipfsUrl,
        pinataData: result.data
      }
    });
  } catch (error) {
    console.error("Error in JSON upload route:", error);
    return c.json({
      success: false,
      error: "Failed to upload JSON to IPFS"
    }, 500);
  }
});

uploadRouter.post("/file", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({
        success: false,
        error: "No file provided"
      }, 400);
    }

    const result = await uploadFileToIPFS(file);
    
    if (!result.success) {
      return c.json(result, 500);
    }

    return c.json({
      success: true,
      message: "File uploaded to IPFS successfully",
      data: {
        ipfsHash: result.ipfsHash,
        ipfsUrl: result.ipfsUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pinataData: result.data
      }
    });
  } catch (error) {
    console.error("Error in file upload route:", error);
    return c.json({
      success: false,
      error: "Failed to upload file to IPFS"
    }, 500);
  }
});

export default uploadRouter;
