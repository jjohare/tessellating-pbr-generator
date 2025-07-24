/**
 * Core interfaces for the Tessellating PBR Texture Generator
 */

// JSON Loader Interfaces
export interface TextureDescription {
  id: string;
  name: string;
  description: string;
  style?: string;
  material?: string;
  resolution?: number;
  pbrMaps?: PBRMapType[];
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Texture Types
export type PBRMapType = 'diffuse' | 'normal' | 'roughness' | 'metallic' | 'ao' | 'displacement';

export interface Texture {
  type: PBRMapType;
  data: Buffer;
  format: 'png' | 'jpg' | 'exr';
  width: number;
  height: number;
  metadata?: Record<string, any>;
}

// API Client Interfaces
export interface GenerationOptions {
  provider: 'replicate' | 'openai' | 'midjourney' | 'stability';
  model?: string;
  resolution: number;
  tessellate: boolean;
  seed?: number;
  steps?: number;
  guidance?: number;
}

export interface TextureResult {
  success: boolean;
  texture?: Texture;
  error?: string;
  retryable?: boolean;
}

export interface ApiStatus {
  available: boolean;
  rateLimit?: {
    remaining: number;
    reset: Date;
  };
  latency?: number;
}

// Texture Generator Interfaces
export interface PBRTextureSet {
  id: string;
  name: string;
  diffuse: Texture;
  normal?: Texture;
  roughness?: Texture;
  metallic?: Texture;
  ao?: Texture;
  displacement?: Texture;
  metadata?: {
    generatedAt: Date;
    provider: string;
    model?: string;
    prompt: string;
  };
}

export interface TessellationOptions {
  algorithm: 'mirror' | 'offset' | 'blend';
  blendWidth?: number;
  validateSeamless?: boolean;
}

// PBR Exporter Interfaces
export interface ExportOptions {
  format: 'png' | 'jpg' | 'exr';
  quality?: number;
  generateMaterials?: boolean;
  materialFormat?: 'mtl' | 'usd' | 'gltf';
  compress?: boolean;
}

export interface ExportResult {
  success: boolean;
  outputPaths: {
    textures: Record<PBRMapType, string>;
    material?: string;
  };
  errors?: string[];
}

export interface MaterialDefinition {
  name: string;
  format: 'mtl' | 'usd' | 'gltf';
  content: string;
  textureReferences: Record<PBRMapType, string>;
}

// Prompt Engine Interfaces
export interface PromptTemplate {
  base: string;
  tessellationKeywords: string[];
  styleModifiers?: string[];
  negativePrompt?: string;
}

export interface PromptGenerationOptions {
  includeStyle?: boolean;
  includeMaterial?: boolean;
  tessellationEmphasis?: 'low' | 'medium' | 'high';
  customKeywords?: string[];
}

// Error Handler Interfaces
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface ErrorContext {
  module: string;
  operation: string;
  input?: any;
  attempt?: number;
  timestamp: Date;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  resolution?: 'retry' | 'fallback' | 'fail';
  fallbackResult?: any;
}

// Module Communication Interfaces
export interface ModuleConfig {
  name: string;
  version: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

export interface ModuleMessage<T = any> {
  source: string;
  target: string;
  type: 'request' | 'response' | 'event';
  payload: T;
  timestamp: Date;
  correlationId?: string;
}

// Pipeline Interfaces
export interface PipelineStage {
  name: string;
  execute: (input: any) => Promise<any>;
  rollback?: (input: any) => Promise<void>;
}

export interface PipelineResult<T> {
  success: boolean;
  result?: T;
  errors?: ErrorReport[];
  duration: number;
  stages: {
    name: string;
    duration: number;
    success: boolean;
  }[];
}