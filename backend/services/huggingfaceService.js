const { HfInference } = require('@huggingface/inference');

// Use a text-generation model available on the free HF Inference API.
// Must support text-generation task — NOT token-classification or image-captioning.
// Override via HF_MODEL env var if needed.
const HF_MODEL = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
const hf = new HfInference({ apiKey: process.env.HUGGINGFACE_API_KEY });

async function analyzeResumeWithHuggingFace(prompt) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key missing');
  }

  const response = await hf.textGeneration({
    model: HF_MODEL,
    inputs: prompt,
    parameters: {
      max_new_tokens: 800,
      temperature: 0.2,
      top_p: 0.9,
      repetition_penalty: 1.05,
      return_full_text: false,
    },
  });

  if (!response) {
    throw new Error('Empty response from Hugging Face');
  }

  if (Array.isArray(response)) {
    return response[0]?.generated_text || '';
  }

  return response.generated_text || response?.text || '';
}

async function extractTextViaHuggingFace(fileBuffer, mimeType = 'image/jpeg') {
  if (!process.env.HUGGINGFACE_API_KEY) {
    return { unavailable: true, reason: 'Hugging Face API key missing' };
  }

  // OCR model priority list — available on the free HF Inference API.
  // trocr-large-printed is best for printed document/resume OCR.
  const ocrModels = [
    'microsoft/trocr-large-printed',
    'microsoft/trocr-base-handwritten',
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
      // Continue to next model in the list
    }
  }

  return { unavailable: true, reason: 'All HF OCR models failed or returned no text' };
}

module.exports = { analyzeResumeWithHuggingFace, extractTextViaHuggingFace };
