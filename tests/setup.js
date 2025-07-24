/**
 * Test Setup and Global Configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key-123';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.testUtils = {
  /**
   * Loads a test fixture file
   */
  loadFixture: async (filename) => {
    const path = require('path');
    const fs = require('fs').promises;
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    return JSON.parse(await fs.readFile(fixturePath, 'utf-8'));
  },
  
  /**
   * Creates a mock image buffer
   */
  createMockImage: (width = 1024, height = 1024) => {
    const sharp = require('sharp');
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 128, g: 128, b: 128, alpha: 1 }
      }
    }).png().toBuffer();
  },
  
  /**
   * Waits for condition with timeout
   */
  waitFor: async (condition, timeout = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timeout waiting for condition');
  },
  
  /**
   * Mock API responses
   */
  mockAPIResponse: (type = 'success', data = {}) => {
    const responses = require('./fixtures/mock-api-responses.json');
    return type === 'success' 
      ? responses.success_responses.texture_generation
      : responses.error_responses[type];
  }
};

// Jest extensions
expect.extend({
  toBeValidTexture(received) {
    const pass = received && 
                 received.width > 0 && 
                 received.height > 0 &&
                 received.channels >= 3;
    
    return {
      message: () => pass
        ? `expected texture to be invalid`
        : `expected valid texture with dimensions and channels`,
      pass
    };
  },
  
  toBeSeamless(received, tolerance = 0.02) {
    const pass = received.seamless && 
                 received.horizontalDeviation < tolerance &&
                 received.verticalDeviation < tolerance;
    
    return {
      message: () => pass
        ? `expected texture not to be seamless`
        : `expected seamless texture with deviation < ${tolerance}`,
      pass
    };
  },
  
  toHaveValidPBRProperties(received) {
    const requiredProps = ['diffuse', 'normal', 'roughness'];
    const pass = requiredProps.every(prop => 
      received[prop] && received[prop].valid
    );
    
    return {
      message: () => pass
        ? `expected invalid PBR properties`
        : `expected valid PBR properties for ${requiredProps.join(', ')}`,
      pass
    };
  }
});

// Mock modules
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn().mockResolvedValue(
        global.testUtils.mockAPIResponse('success')
      )
    }
  }))
}));

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});