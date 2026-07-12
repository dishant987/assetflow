import { Request, Response } from "express";

export async function uploadFile(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: { code: "NO_FILE", message: "No file uploaded." } });
  }
  res.json({ data: { url: `/uploads/${file.filename}` } });
}
