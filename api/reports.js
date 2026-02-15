export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "OK",
      message: "Backend API is working",
      data: []
    });
  }

  if (req.method === "POST") {
    const report = req.body;
    return res.status(200).json({
      success: true,
      received: report
    });
  }

  res.status(405).json({ error: "Method not allowed" });
}
