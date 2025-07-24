/**
 * Main Pipeline Orchestrator
 * Coordinates all modules to generate tessellating PBR textures
 */

import { 
  TextureDescription, 
  PBRTextureSet, 
  PipelineStage, 
  PipelineResult,
  GenerationOptions,
  ExportOptions
} from '../interfaces';

export class TextureGenerationPipeline {
  private stages: PipelineStage[] = [];
  
  constructor() {
    this.initializeStages();
  }

  /**
   * Initialize pipeline stages
   */
  private initializeStages(): void {
    this.stages = [
      {
        name: 'Validate Input',
        execute: async (input: TextureDescription) => {
          // Validation logic will be implemented by json-loader module
          console.log(`Validating texture description: ${input.name}`);
          return input;
        }
      },
      {
        name: 'Generate Prompts',
        execute: async (input: TextureDescription) => {
          // Prompt generation will be handled by prompt-engine module
          console.log(`Generating optimized prompts for: ${input.name}`);
          return {
            description: input,
            prompts: {} // Will be populated by prompt-engine
          };
        }
      },
      {
        name: 'Generate Textures',
        execute: async (input: any) => {
          // Texture generation will be handled by texture-generator module
          console.log(`Generating PBR textures...`);
          return {
            ...input,
            textures: {} // Will be populated by texture-generator
          };
        }
      },
      {
        name: 'Ensure Tessellation',
        execute: async (input: any) => {
          // Tessellation verification and correction
          console.log(`Ensuring seamless tessellation...`);
          return input;
        }
      },
      {
        name: 'Export Results',
        execute: async (input: any) => {
          // Export will be handled by pbr-exporter module
          console.log(`Exporting PBR texture set...`);
          return {
            ...input,
            exported: true
          };
        }
      }
    ];
  }

  /**
   * Execute the full pipeline
   */
  async execute(
    description: TextureDescription,
    options?: {
      generation?: GenerationOptions;
      export?: ExportOptions;
    }
  ): Promise<PipelineResult<PBRTextureSet>> {
    const startTime = Date.now();
    const stageResults: any[] = [];
    let currentInput = description;
    let success = true;
    const errors: any[] = [];

    console.log(`\n🚀 Starting pipeline for: ${description.name}\n`);

    for (const stage of this.stages) {
      const stageStart = Date.now();
      console.log(`▶️  Stage: ${stage.name}`);
      
      try {
        currentInput = await stage.execute(currentInput);
        const stageDuration = Date.now() - stageStart;
        
        stageResults.push({
          name: stage.name,
          duration: stageDuration,
          success: true
        });
        
        console.log(`✅ ${stage.name} completed in ${stageDuration}ms\n`);
      } catch (error) {
        const stageDuration = Date.now() - stageStart;
        success = false;
        
        stageResults.push({
          name: stage.name,
          duration: stageDuration,
          success: false
        });
        
        errors.push({
          stage: stage.name,
          error: error
        });
        
        console.error(`❌ ${stage.name} failed: ${error}\n`);
        
        // Try rollback if available
        if (stage.rollback) {
          console.log(`🔄 Attempting rollback for ${stage.name}...`);
          try {
            await stage.rollback(currentInput);
            console.log(`✅ Rollback successful\n`);
          } catch (rollbackError) {
            console.error(`❌ Rollback failed: ${rollbackError}\n`);
          }
        }
        
        break; // Stop pipeline on error
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      success,
      result: success ? currentInput as PBRTextureSet : undefined,
      errors: errors.length > 0 ? errors : undefined,
      duration: totalDuration,
      stages: stageResults
    };
  }

  /**
   * Add custom stage to pipeline
   */
  addStage(stage: PipelineStage, position?: number): void {
    if (position !== undefined) {
      this.stages.splice(position, 0, stage);
    } else {
      this.stages.push(stage);
    }
  }

  /**
   * Remove stage from pipeline
   */
  removeStage(stageName: string): void {
    this.stages = this.stages.filter(stage => stage.name !== stageName);
  }

  /**
   * Get pipeline configuration
   */
  getConfiguration(): { stages: string[] } {
    return {
      stages: this.stages.map(stage => stage.name)
    };
  }
}

// Export singleton instance
export const pipeline = new TextureGenerationPipeline();