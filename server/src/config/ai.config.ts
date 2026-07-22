export const AI_CONFIG = {
  LLM_MODEL: 'gemini-flash-latest',
  ANALYTICS_MODEL: 'gemini-flash-latest',
  EMBEDDING_MODEL: 'gemini-embedding-001',
  EMBEDDING_DIMENSIONS: 3072,
  CHUNK_SIZE: 600, // token target
  CHUNK_OVERLAP: 100, // token target
  VECTOR_DB_DIR: './vector_db',
  DEFAULT_TOP_K: 5,
};
