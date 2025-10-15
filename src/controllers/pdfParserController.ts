import { Request, Response } from "express";

export const parsePDF = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Check file size
    if (file.size > 1048576) {
      return res.status(400).json({ error: "File size must be less than 1MB" });
    }
    const buffer = Buffer.from(file.buffer);
    const { PDFParse } = require("pdf-parse");
    const pdfData = new PDFParse({ data: buffer });

    const text = await pdfData.getText();

    const table = await pdfData.getTable();

    const info = await pdfData.getInfo();

    return res.json({
      success: true,
      data: {
        text,
        table,
        info,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to parse PDF" });
  }
};

