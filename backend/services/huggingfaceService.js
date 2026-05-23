const { HfInference } = require('@huggingface/inference');

// Use a model that supports the conversational/chat task on HF Inference API.
// mistralai/Mistral-7B-Instruct-v0.3 works via chatCompletion endpoint.
// Override via HF_MODEL env var if needed.
const HF_MODEL = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
const hf = new HfInference({ apiKey: process.env.HUGGINGFACE_API_KEY });

async function analyzeResumeWithHuggingFace(prompt) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key missing');
  }

  // Use chatCompletion (conversational task) — widely supported on HF Inference API
  const response = await hf.chatCompletion({
    model: HF_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 800,
    temperature: 0.2,
  });

  if (!response) {
    throw new Error('Empty response from Hugging Face');
  }

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in Hugging Face response');
  }

  return content;
}

async function extractTextViaHuggingFace(fileBuffer, mimeType = 'image/jpeg') {
  if (!process.env.HUGGINGFACE_API_KEY) {
    return { unavailable: true, reason: 'Hugging Face API key missing' };
  }

  // Use BLIP image captioning — available on free HF Inference API
  // Note: for proper OCR, Tesseract.js (local) is more reliable
  const ocrModels = [
    'Salesforce/blip-image-captioning-base',
  ];

  for (const model of ocrModels) {
    try {
      console.log(`[HF OCR] Trying model: ${model}`);
      const response = await hf.imageToText({
        model,
        data: fileBuffer,
      });

      if (response && response.generated_text) {
        console.log(`[HF OCR] Success with model: ${model}`);
        return { text: response.generated_text };
      }
    } catch (error) {
      console.error(`Hugging Face OCR Error (${model}):`, error.message);
    }
  }

  return { unavailable: true, reason: 'All HF OCR models failed or returned no text' };
}

module.exports = { analyzeResumeWithHuggingFace, extractTextViaHuggingFace };
