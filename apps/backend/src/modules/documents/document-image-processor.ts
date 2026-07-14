export interface DocumentImageProcessingInput {
  filename: string;
  contents: Buffer;
}

export interface ProcessedDocumentImage {
  filename: string;
  contents: Buffer;
}

export type DocumentImageProcessor = (
  input: DocumentImageProcessingInput,
) => Promise<ProcessedDocumentImage | undefined>;

let imageProcessor: DocumentImageProcessor | undefined;

export function configureDocumentImageProcessor(processor: DocumentImageProcessor | undefined) {
  imageProcessor = processor;
}

export function processDocumentImage(input: DocumentImageProcessingInput) {
  return imageProcessor?.(input);
}
