/**
 * Prompt Engine Module
 * Optimizes prompts for generating seamlessly tessellating textures
 */

import { 
  TextureDescription, 
  PromptTemplate, 
  PromptGenerationOptions 
} from '../../interfaces';

export class PromptEngine {
  private readonly tessellationKeywords = {
    high: [
      'seamless pattern',
      'tileable texture',
      'repeating seamlessly',
      'perfect tessellation',
      'continuous pattern',
      'no visible seams',
      'infinitely tileable'
    ],
    medium: [
      'seamless',
      'tileable',
      'repeating pattern',
      'tessellating'
    ],
    low: [
      'pattern',
      'texture'
    ]
  };

  private readonly defaultTemplates: Record<string, PromptTemplate> = {
    pbr: {
      base: '{description}, {tessellation}, high quality, 4K resolution, PBR material',
      tessellationKeywords: this.tessellationKeywords.high,
      negativePrompt: 'seams, edges, borders, discontinuous, misaligned'
    },
    stylized: {
      base: '{style} style {description}, {tessellation}, artistic, detailed',
      tessellationKeywords: this.tessellationKeywords.medium,
      styleModifiers: ['hand-painted', 'stylized', 'artistic']
    },
    photorealistic: {
      base: 'photorealistic {description}, {tessellation}, highly detailed, professional photography',
      tessellationKeywords: this.tessellationKeywords.high,
      negativePrompt: 'cartoon, illustration, painting, artificial'
    }
  };

  /**
   * Generate optimized prompt from texture description
   */
  async generatePrompt(
    description: TextureDescription,
    options?: PromptGenerationOptions
  ): Promise<string> {
    const opts = this.mergeOptions(options);
    const template = this.selectTemplate(description);
    
    let prompt = template.base;
    
    // Replace description placeholder
    prompt = prompt.replace('{description}', this.enhanceDescription(description));
    
    // Add tessellation keywords
    const tessellationPhrase = this.getTessellationPhrase(opts.tessellationEmphasis);
    prompt = prompt.replace('{tessellation}', tessellationPhrase);
    
    // Add style if specified
    if (description.style && opts.includeStyle) {
      prompt = prompt.replace('{style}', description.style);
    } else {
      prompt = prompt.replace('{style} style ', '');
    }
    
    // Add material specifications
    if (description.material && opts.includeMaterial) {
      prompt = this.addMaterialSpecifications(prompt, description.material);
    }
    
    // Add custom keywords
    if (opts.customKeywords && opts.customKeywords.length > 0) {
      prompt += ', ' + opts.customKeywords.join(', ');
    }
    
    // Optimize for specific providers
    prompt = this.optimizeForProvider(prompt);
    
    return prompt;
  }

  /**
   * Optimize prompt specifically for tessellation
   */
  optimizeForTessellation(prompt: string): string {
    // Ensure tessellation keywords are prominent
    if (!this.hasTessellationKeywords(prompt)) {
      prompt = `seamless tileable ${prompt}`;
    }
    
    // Add technical specifications for better tessellation
    const technicalSpecs = [
      'perfect edge matching',
      'continuous at boundaries',
      'wrap-around pattern'
    ];
    
    // Add a random technical spec for variety
    const randomSpec = technicalSpecs[Math.floor(Math.random() * technicalSpecs.length)];
    if (!prompt.includes(randomSpec)) {
      prompt += `, ${randomSpec}`;
    }
    
    return prompt;
  }

  /**
   * Generate prompts for different PBR maps
   */
  generatePBRMapPrompts(basePrompt: string): Record<string, string> {
    return {
      diffuse: `${basePrompt}, albedo map, base color, no lighting information`,
      normal: `${basePrompt}, normal map, blue-purple gradient, surface details, bump mapping`,
      roughness: `${basePrompt}, roughness map, grayscale, surface roughness, white=rough black=smooth`,
      metallic: `${basePrompt}, metallic map, grayscale, white=metallic black=non-metallic`,
      ao: `${basePrompt}, ambient occlusion map, grayscale, shadow information, white=exposed black=occluded`,
      displacement: `${basePrompt}, height map, displacement map, grayscale, white=raised black=recessed`
    };
  }

  /**
   * Validate prompt for common issues
   */
  validatePrompt(prompt: string): { valid: boolean; issues?: string[] } {
    const issues: string[] = [];
    
    // Check length
    if (prompt.length > 500) {
      issues.push('Prompt exceeds recommended length (500 chars)');
    }
    
    // Check for conflicting terms
    const conflicts = [
      ['seamless', 'with borders'],
      ['tileable', 'non-repeating'],
      ['continuous', 'discontinuous']
    ];
    
    conflicts.forEach(([term1, term2]) => {
      if (prompt.includes(term1) && prompt.includes(term2)) {
        issues.push(`Conflicting terms: "${term1}" and "${term2}"`);
      }
    });
    
    // Check for tessellation keywords
    if (!this.hasTessellationKeywords(prompt)) {
      issues.push('Missing tessellation keywords');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Private helper methods
   */
  
  private mergeOptions(options?: PromptGenerationOptions): Required<PromptGenerationOptions> {
    return {
      includeStyle: true,
      includeMaterial: true,
      tessellationEmphasis: 'high',
      customKeywords: [],
      ...options
    };
  }

  private selectTemplate(description: TextureDescription): PromptTemplate {
    if (description.style?.toLowerCase().includes('realistic')) {
      return this.defaultTemplates.photorealistic;
    }
    if (description.style) {
      return this.defaultTemplates.stylized;
    }
    return this.defaultTemplates.pbr;
  }

  private enhanceDescription(description: TextureDescription): string {
    let enhanced = description.description;
    
    // Add resolution if specified
    if (description.resolution) {
      enhanced += `, ${description.resolution}x${description.resolution} resolution`;
    }
    
    // Add any metadata hints
    if (description.metadata?.surface) {
      enhanced += `, ${description.metadata.surface} surface`;
    }
    
    return enhanced;
  }

  private getTessellationPhrase(emphasis?: 'low' | 'medium' | 'high'): string {
    const keywords = this.tessellationKeywords[emphasis || 'high'];
    // Use multiple keywords for better results
    const selected = keywords.slice(0, 2).join(' ');
    return selected;
  }

  private addMaterialSpecifications(prompt: string, material: string): string {
    const materialSpecs: Record<string, string> = {
      metal: 'metallic surface, reflective, industrial',
      wood: 'wood grain, natural texture, organic patterns',
      stone: 'stone texture, mineral surface, geological patterns',
      fabric: 'textile weave, cloth material, fiber texture',
      concrete: 'concrete surface, rough texture, construction material',
      plastic: 'plastic material, synthetic surface, manufactured'
    };
    
    const spec = materialSpecs[material.toLowerCase()];
    if (spec) {
      prompt += `, ${spec}`;
    }
    
    return prompt;
  }

  private optimizeForProvider(prompt: string): string {
    // Provider-specific optimizations can be added here
    // For now, return cleaned prompt
    return prompt.trim().replace(/\s+/g, ' ');
  }

  private hasTessellationKeywords(prompt: string): boolean {
    const allKeywords = [
      ...this.tessellationKeywords.low,
      ...this.tessellationKeywords.medium,
      ...this.tessellationKeywords.high
    ];
    
    return allKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}

// Export singleton instance
export const promptEngine = new PromptEngine();