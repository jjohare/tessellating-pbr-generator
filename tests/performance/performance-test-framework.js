/**
 * Performance Testing Framework for Texture Generation
 */

const { performance } = require('perf_hooks');

class PerformanceTestFramework {
  constructor() {
    this.metrics = {
      generationTimes: [],
      memoryUsage: [],
      apiLatency: [],
      throughput: [],
      concurrentRequests: []
    };
  }

  /**
   * Measures texture generation performance
   */
  async measureGenerationPerformance(generator, materials, options = {}) {
    const results = {
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      successRate: 0,
      throughput: 0,
      peakMemory: 0
    };

    const startTime = performance.now();
    const initialMemory = process.memoryUsage().heapUsed;

    // Run generation tests
    const generationResults = [];
    for (const material of materials) {
      const genStart = performance.now();
      
      try {
        const result = await generator.generateTexture(material);
        const genTime = performance.now() - genStart;
        
        generationResults.push({
          success: true,
          time: genTime,
          materialId: material.id
        });
        
        results.minTime = Math.min(results.minTime, genTime);
        results.maxTime = Math.max(results.maxTime, genTime);
        
      } catch (error) {
        generationResults.push({
          success: false,
          error: error.message,
          materialId: material.id
        });
      }
      
      // Track memory usage
      const currentMemory = process.memoryUsage().heapUsed;
      results.peakMemory = Math.max(results.peakMemory, currentMemory);
    }

    // Calculate results
    results.totalTime = performance.now() - startTime;
    const successfulGenerations = generationResults.filter(r => r.success);
    results.successRate = successfulGenerations.length / generationResults.length;
    results.averageTime = successfulGenerations.reduce((sum, r) => sum + r.time, 0) / successfulGenerations.length;
    results.throughput = (successfulGenerations.length / results.totalTime) * 1000; // per second

    // Memory delta
    results.memoryDelta = (results.peakMemory - initialMemory) / 1024 / 1024; // MB

    return results;
  }

  /**
   * Tests concurrent generation performance
   */
  async testConcurrentGeneration(generator, materials, concurrentLimit = 3) {
    const results = {
      concurrentLimit,
      totalTime: 0,
      successCount: 0,
      failureCount: 0,
      averageResponseTime: 0,
      throughput: 0,
      resourceUtilization: {}
    };

    const startTime = performance.now();
    const chunks = this.chunkArray(materials, concurrentLimit);
    const allResults = [];

    for (const chunk of chunks) {
      const chunkStart = performance.now();
      
      // Process chunk concurrently
      const chunkPromises = chunk.map(material => 
        this.timedGeneration(generator, material)
      );
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      allResults.push(...chunkResults);
      
      // Track resource utilization
      this.trackResourceUtilization(results.resourceUtilization);
    }

    // Calculate metrics
    results.totalTime = performance.now() - startTime;
    results.successCount = allResults.filter(r => r.status === 'fulfilled').length;
    results.failureCount = allResults.filter(r => r.status === 'rejected').length;
    
    const successfulTimes = allResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.time);
    
    results.averageResponseTime = successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length;
    results.throughput = (results.successCount / results.totalTime) * 1000;

    return results;
  }

  /**
   * Stress test with increasing load
   */
  async runStressTest(generator, baseLoad = 10, maxLoad = 100, stepSize = 10) {
    const results = {
      loadLevels: [],
      breakingPoint: null,
      performanceDegradation: []
    };

    for (let load = baseLoad; load <= maxLoad; load += stepSize) {
      console.log(`Testing load level: ${load} concurrent requests`);
      
      // Generate test materials for this load level
      const testMaterials = this.generateTestMaterials(load);
      
      try {
        const loadResult = await this.testConcurrentGeneration(
          generator, 
          testMaterials, 
          Math.min(load, 10) // Cap actual concurrency
        );
        
        results.loadLevels.push({
          load,
          ...loadResult,
          degradation: this.calculateDegradation(results.loadLevels, loadResult)
        });
        
        // Check if breaking point reached
        if (loadResult.successRate < 0.8 || loadResult.averageResponseTime > 60000) {
          results.breakingPoint = load;
          break;
        }
        
      } catch (error) {
        results.breakingPoint = load;
        results.breakingError = error.message;
        break;
      }
    }

    return results;
  }

  /**
   * Memory leak detection
   */
  async detectMemoryLeaks(generator, iterations = 100) {
    const memorySnapshots = [];
    const material = this.generateTestMaterials(1)[0];

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      await generator.generateTexture(material);
      
      if (i % 10 === 0) {
        if (global.gc) global.gc();
        
        const currentMemory = process.memoryUsage().heapUsed;
        memorySnapshots.push({
          iteration: i,
          memory: currentMemory,
          delta: currentMemory - initialMemory
        });
      }
    }

    // Analyze memory growth
    const memoryGrowth = this.analyzeMemoryGrowth(memorySnapshots);
    
    return {
      hasLeak: memoryGrowth.isGrowing,
      growthRate: memoryGrowth.rate,
      snapshots: memorySnapshots,
      recommendation: memoryGrowth.isGrowing 
        ? 'Potential memory leak detected. Memory growing at ' + memoryGrowth.rate + ' bytes/iteration'
        : 'No memory leak detected'
    };
  }

  /**
   * Benchmark against performance targets
   */
  async runBenchmark(generator, benchmarkSuite) {
    const results = {
      passed: 0,
      failed: 0,
      benchmarks: []
    };

    for (const benchmark of benchmarkSuite) {
      console.log(`Running benchmark: ${benchmark.name}`);
      
      const testResult = await this.measureGenerationPerformance(
        generator,
        benchmark.materials,
        benchmark.options
      );
      
      const passed = this.checkBenchmarkCriteria(testResult, benchmark.criteria);
      
      results.benchmarks.push({
        name: benchmark.name,
        passed,
        result: testResult,
        criteria: benchmark.criteria
      });
      
      if (passed) results.passed++;
      else results.failed++;
    }

    results.score = (results.passed / results.benchmarks.length) * 100;
    return results;
  }

  // Helper methods
  timedGeneration(generator, material) {
    const start = performance.now();
    return generator.generateTexture(material)
      .then(result => ({
        success: true,
        time: performance.now() - start,
        result
      }))
      .catch(error => ({
        success: false,
        time: performance.now() - start,
        error: error.message
      }));
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  trackResourceUtilization(utilization) {
    const usage = process.cpuUsage();
    const memory = process.memoryUsage();
    
    utilization.cpu = usage;
    utilization.memory = {
      heapUsed: memory.heapUsed / 1024 / 1024,
      heapTotal: memory.heapTotal / 1024 / 1024,
      external: memory.external / 1024 / 1024
    };
  }

  calculateDegradation(previousResults, currentResult) {
    if (previousResults.length === 0) return 0;
    
    const previous = previousResults[previousResults.length - 1];
    return {
      responseTime: ((currentResult.averageResponseTime - previous.averageResponseTime) / previous.averageResponseTime) * 100,
      throughput: ((previous.throughput - currentResult.throughput) / previous.throughput) * 100
    };
  }

  analyzeMemoryGrowth(snapshots) {
    if (snapshots.length < 2) return { isGrowing: false, rate: 0 };
    
    // Linear regression to detect trend
    const n = snapshots.length;
    const sumX = snapshots.reduce((sum, s) => sum + s.iteration, 0);
    const sumY = snapshots.reduce((sum, s) => sum + s.memory, 0);
    const sumXY = snapshots.reduce((sum, s) => sum + (s.iteration * s.memory), 0);
    const sumX2 = snapshots.reduce((sum, s) => sum + (s.iteration * s.iteration), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return {
      isGrowing: slope > 1000, // Growing more than 1KB per iteration
      rate: slope
    };
  }

  checkBenchmarkCriteria(result, criteria) {
    for (const [metric, threshold] of Object.entries(criteria)) {
      if (metric === 'maxTime' && result.maxTime > threshold) return false;
      if (metric === 'averageTime' && result.averageTime > threshold) return false;
      if (metric === 'successRate' && result.successRate < threshold) return false;
      if (metric === 'memoryDelta' && result.memoryDelta > threshold) return false;
      if (metric === 'throughput' && result.throughput < threshold) return false;
    }
    return true;
  }

  generateTestMaterials(count) {
    const materials = [];
    const categories = ['concrete', 'brick', 'stone', 'aluminum'];
    
    for (let i = 0; i < count; i++) {
      materials.push({
        id: `test_material_${i}`,
        category: categories[i % categories.length],
        name: `Test Material ${i}`,
        properties: {
          surface_finish: 'test finish',
          color: 'test color',
          pattern: 'test pattern',
          scale: '1 meter'
        }
      });
    }
    
    return materials;
  }
}

module.exports = PerformanceTestFramework;