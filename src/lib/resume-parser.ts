export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value.trim();
  }

  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
    }
    return text.trim();
  }

  throw new Error("Please upload a PDF or DOCX file");
}
