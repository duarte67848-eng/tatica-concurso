import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "1"; // senha admin
  res.status(200).json({ valid: password === adminPassword });
}
