import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';
import { MCPManager } from './mcp-manager.js';
import { MCPIntegrator } from './mcp-integrator.js';
import { MCPAnalytics } from './mcp-analytics.js';

const execAsync = promisify(exec);

export class MCPService {
  private mcpManager: MCPManager;
  private mcpIntegrator: MCPIntegrator;
  private mcpAnalytics: MCPAnalytics;
  private isInitialized = false;

  constructor() {
    this.mcpManager = new MCPManager();
    this.mcpIntegrator = new MCPIntegrator();
    this.mcpAnalytics = new MCPAnalytics();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize MCP Manager
      await this.mcpManager.initialize();
      
      // Initialize MCP Integrator
      await this.mcpIntegrator.initialize();
      
      // Initialize MCP Analytics
      await this.mcpAnalytics.initialize();
      
      this.isInitialized = true;
      logger.info('MCP Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  // Get all available MCP servers
  async getAvailableServers(): Promise<MCPServerInfo[]> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    return await this.mcpManager.getAvailableServers();
  }

  // Execute MCP tool with enhanced capabilities
  async executeTool(serverName: string, toolName: string, parameters: any): Promise<MCPToolResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    try {
      // Validate server and tool
      const server = await this.mcpManager.getServer(serverName);
      if (!server) {
        throw new Error(`MCP Server '${serverName}' not found`);
      }

      // Execute tool
      const result = await this.mcpManager.executeTool(serverName, toolName, parameters);
      
      // Enhance result with AI analysis
      const enhancedResult = await this.enhanceResultWithAI(result, toolName, parameters);
      
      // Track analytics
      await this.mcpAnalytics.trackToolExecution(serverName, toolName, parameters, enhancedResult);
      
      return enhancedResult;
    } catch (error) {
      logger.error(`Failed to execute tool ${toolName} on server ${serverName}:`, error);
      throw error;
    }
  }

  // Execute multiple tools in sequence or parallel
  async executeWorkflow(workflow: MCPWorkflow): Promise<MCPWorkflowResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    try {
      const results = [];
      const startTime = Date.now();

      if (workflow.execution === 'parallel') {
        // Execute tools in parallel
        const promises = workflow.steps.map(step => 
          this.executeTool(step.server, step.tool, step.parameters)
        );
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
      } else {
        // Execute tools sequentially
        for (const step of workflow.steps) {
          const result = await this.executeTool(step.server, step.tool, step.parameters);
          results.push(result);
          
          // Check if we should continue based on result
          if (step.condition && !this.evaluateCondition(step.condition, result)) {
            break;
          }
        }
      }

      const executionTime = Date.now() - startTime;
      
      // Generate workflow report
      const report = await this.generateWorkflowReport(workflow, results, executionTime);
      
      return {
        workflowId: workflow.id,
        results,
        executionTime,
        report,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Workflow execution failed:', error);
      throw error;
    }
  }

  // Enhanced SQL injection scanning with multiple tools
  async enhancedSQLInjectionScan(target: string, options: SQLInjectionScanOptions): Promise<EnhancedScanResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    try {
      const scanResults = [];
      
      // Use sqlmap for primary scanning
      const sqlmapResult = await this.executeTool('sqlmap-server', 'scan_target', {
        url: target,
        method: options.method || 'GET',
        level: options.level || 3,
        risk: options.risk || 2,
        threads: options.threads || 5
      });
      
      scanResults.push({
        tool: 'sqlmap',
        result: sqlmapResult,
        confidence: sqlmapResult.confidence || 0.8
      });

      // Use quake-server for additional reconnaissance
      if (options.includeReconnaissance) {
        const quakeResult = await this.executeTool('quake-server', 'search_assets', {
          query: target,
          limit: 100
        });
        
        scanResults.push({
          tool: 'quake',
          result: quakeResult,
          confidence: 0.6
        });
      }

      // Generate comprehensive report
      const report = await this.generateComprehensiveReport(scanResults, target, options);
      
      return {
        target,
        scanResults,
        overallRisk: this.calculateOverallRisk(scanResults),
        recommendations: report.recommendations,
        report: report.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Enhanced SQL injection scan failed:', error);
      throw error;
    }
  }

  // Enhanced document processing with AI
  async enhancedDocumentProcessing(content: string, options: DocumentProcessingOptions): Promise<EnhancedDocumentResult> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    try {
      // Process document with doc-processor
      const docResult = await this.executeTool('doc-processor', 'convert_to_word', {
        markdown: content,
        style: options.style || 'default',
        format: options.format || 'docx'
      });

      // Enhance with AI analysis if requested
      let aiEnhancements = null;
      if (options.includeAIAnalysis) {
        aiEnhancements = await this.analyzeDocumentWithAI(content, docResult);
      }

      return {
        originalContent: content,
        processedDocument: docResult,
        aiEnhancements,
        processingOptions: options,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Enhanced document processing failed:', error);
      throw error;
    }
  }

  // Get MCP service analytics
  async getAnalytics(timeRange: string = '7d'): Promise<MCPServiceAnalytics> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    return await this.mcpAnalytics.getAnalytics(timeRange);
  }

  // Health check for all MCP servers
  async healthCheck(): Promise<MCPHealthStatus[]> {
    if (!this.isInitialized) {
      throw new Error('MCP Service not initialized');
    }

    return await this.mcpManager.healthCheck();
  }

  // Private helper methods
  private async enhanceResultWithAI(result: any, toolName: string, parameters: any): Promise<MCPToolResult> {
    try {
      // Add AI-powered insights based on tool and parameters
      const enhancedResult = { ...result };
      
      // Add confidence scoring
      enhancedResult.confidence = this.calculateConfidence(result, toolName);
      
      // Add risk assessment
      enhancedResult.riskAssessment = this.assessRisk(result, toolName);
      
      // Add recommendations
      enhancedResult.recommendations = await this.generateToolRecommendations(result, toolName, parameters);
      
      return enhancedResult;
    } catch (error) {
      logger.warn('Failed to enhance result with AI, returning original result:', error);
      return result;
    }
  }

  private calculateConfidence(result: any, toolName: string): number {
    // Implement confidence calculation logic based on tool type and result quality
    let confidence = 0.7; // Base confidence
    
    switch (toolName) {
      case 'scan_target':
        confidence = result.vulnerabilities?.length > 0 ? 0.9 : 0.8;
        break;
      case 'search_assets':
        confidence = result.assets?.length > 0 ? 0.85 : 0.7;
        break;
      case 'convert_to_word':
        confidence = result.success ? 0.95 : 0.6;
        break;
      default:
        confidence = 0.7;
    }
    
    return Math.min(confidence, 1.0);
  }

  private assessRisk(result: any, toolName: string): RiskAssessment {
    // Implement risk assessment logic
    const riskLevel = this.calculateRiskLevel(result, toolName);
    
    return {
      level: riskLevel,
      score: this.calculateRiskScore(result, toolName),
      factors: this.identifyRiskFactors(result, toolName),
      recommendations: this.generateRiskRecommendations(riskLevel, toolName)
    };
  }

  private calculateRiskLevel(result: any, toolName: string): 'low' | 'medium' | 'high' | 'critical' {
    // Implement risk level calculation
    if (toolName === 'scan_target' && result.vulnerabilities?.length > 0) {
      const criticalVulns = result.vulnerabilities.filter((v: any) => v.severity === 'critical').length;
      if (criticalVulns > 0) return 'critical';
      if (result.vulnerabilities.length > 5) return 'high';
      return 'medium';
    }
    
    return 'low';
  }

  private calculateRiskScore(result: any, toolName: string): number {
    // Implement risk score calculation (0-100)
    let score = 0;
    
    if (toolName === 'scan_target') {
      const vulns = result.vulnerabilities || [];
      score += vulns.filter((v: any) => v.severity === 'critical').length * 25;
      score += vulns.filter((v: any) => v.severity === 'high').length * 15;
      score += vulns.filter((v: any) => v.severity === 'medium').length * 10;
      score += vulns.filter((v: any) => v.severity === 'low').length * 5;
    }
    
    return Math.min(score, 100);
  }

  private identifyRiskFactors(result: any, toolName: string): string[] {
    const factors = [];
    
    if (toolName === 'scan_target') {
      if (result.vulnerabilities?.length > 0) {
        factors.push(`Found ${result.vulnerabilities.length} vulnerabilities`);
      }
      if (result.sqlInjection) {
        factors.push('SQL injection vulnerability detected');
      }
    }
    
    return factors;
  }

  private generateRiskRecommendations(riskLevel: string, toolName: string): string[] {
    const recommendations = [];
    
    if (riskLevel === 'critical') {
      recommendations.push('Immediate action required');
      recommendations.push('Notify security team immediately');
      recommendations.push('Implement emergency patches');
    } else if (riskLevel === 'high') {
      recommendations.push('High priority remediation needed');
      recommendations.push('Schedule security review');
    } else if (riskLevel === 'medium') {
      recommendations.push('Medium priority remediation');
      recommendations.push('Update security policies');
    }
    
    return recommendations;
  }

  private async generateToolRecommendations(result: any, toolName: string, parameters: any): Promise<string[]> {
    // Implement tool-specific recommendations
    const recommendations = [];
    
    if (toolName === 'scan_target') {
      if (result.vulnerabilities?.length > 0) {
        recommendations.push('Implement input validation');
        recommendations.push('Use parameterized queries');
        recommendations.push('Update vulnerable dependencies');
      } else {
        recommendations.push('Continue regular security monitoring');
        recommendations.push('Implement automated scanning');
      }
    }
    
    return recommendations;
  }

  private evaluateCondition(condition: any, result: any): boolean {
    // Implement condition evaluation logic
    if (condition.type === 'vulnerability_count') {
      const vulnCount = result.vulnerabilities?.length || 0;
      return vulnCount <= condition.maxCount;
    }
    
    return true; // Default to continue
  }

  private async generateWorkflowReport(workflow: MCPWorkflow, results: any[], executionTime: number): Promise<WorkflowReport> {
    // Implement workflow report generation
    return {
      summary: `Workflow ${workflow.id} completed in ${executionTime}ms`,
      steps: workflow.steps.map((step, index) => ({
        step: step.tool,
        result: results[index],
        status: 'completed'
      })),
      recommendations: this.generateWorkflowRecommendations(results)
    };
  }

  private generateWorkflowRecommendations(results: any[]): string[] {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    const hasVulnerabilities = results.some(r => r.vulnerabilities?.length > 0);
    
    if (hasVulnerabilities) {
      recommendations.push('Implement comprehensive security review');
      recommendations.push('Establish incident response procedures');
    }
    
    return recommendations;
  }

  private calculateOverallRisk(scanResults: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const riskScores = scanResults.map(r => {
      if (r.result.vulnerabilities?.length > 0) {
        const criticalVulns = r.result.vulnerabilities.filter((v: any) => v.severity === 'critical').length;
        if (criticalVulns > 0) return 4; // critical
        if (r.result.vulnerabilities.length > 5) return 3; // high
        return 2; // medium
      }
      return 1; // low
    });
    
    const maxRisk = Math.max(...riskScores);
    
    switch (maxRisk) {
      case 4: return 'critical';
      case 3: return 'high';
      case 2: return 'medium';
      default: return 'low';
    }
  }

  private async generateComprehensiveReport(scanResults: any[], target: string, options: any): Promise<ComprehensiveReport> {
    // Implement comprehensive report generation
    return {
      content: `Comprehensive security scan report for ${target}`,
      recommendations: this.generateComprehensiveRecommendations(scanResults),
      executiveSummary: this.generateExecutiveSummary(scanResults),
      technicalDetails: this.generateTechnicalDetails(scanResults)
    };
  }

  private generateComprehensiveRecommendations(scanResults: any[]): string[] {
    const recommendations = [];
    
    // Analyze all scan results and generate recommendations
    const hasVulnerabilities = scanResults.some(r => r.result.vulnerabilities?.length > 0);
    
    if (hasVulnerabilities) {
      recommendations.push('Implement immediate security patches');
      recommendations.push('Conduct security awareness training');
      recommendations.push('Establish regular security assessments');
    }
    
    return recommendations;
  }

  private generateExecutiveSummary(scanResults: any[]): string {
    const totalVulns = scanResults.reduce((sum, r) => sum + (r.result.vulnerabilities?.length || 0), 0);
    
    if (totalVulns === 0) {
      return 'No vulnerabilities detected. Security posture is good.';
    } else if (totalVulns <= 3) {
      return `Low number of vulnerabilities detected (${totalVulns}). Remediation recommended.`;
    } else {
      return `Multiple vulnerabilities detected (${totalVulns}). Immediate action required.`;
    }
  }

  private generateTechnicalDetails(scanResults: any[]): any {
    return {
      totalVulnerabilities: scanResults.reduce((sum, r) => sum + (r.result.vulnerabilities?.length || 0), 0),
      criticalVulnerabilities: scanResults.reduce((sum, r) => 
        sum + (r.result.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0), 0),
      scanTools: scanResults.map(r => r.tool),
      confidence: scanResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / scanResults.length
    };
  }

  private async analyzeDocumentWithAI(content: string, docResult: any): Promise<any> {
    // Implement AI document analysis
    return {
      summary: 'AI analysis of document content',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1', 'Recommendation 2']
    };
  }

  // Get service status
  getStatus(): MCPServiceStatus {
    return {
      isInitialized: this.isInitialized,
      availableServers: this.mcpManager.getServerCount(),
      healthStatus: this.mcpManager.getHealthStatus(),
      analyticsEnabled: this.mcpAnalytics.isEnabled()
    };
  }
}

// Types
export interface MCPServerInfo {
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  tools: string[];
  lastHealthCheck: string;
}

export interface MCPToolResult {
  success: boolean;
  data: any;
  confidence: number;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  executionTime: number;
  timestamp: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
}

export interface MCPWorkflow {
  id: string;
  name: string;
  description: string;
  execution: 'sequential' | 'parallel';
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  server: string;
  tool: string;
  parameters: any;
  condition?: any;
}

export interface MCPWorkflowResult {
  workflowId: string;
  results: MCPToolResult[];
  executionTime: number;
  report: WorkflowReport;
  status: string;
  timestamp: string;
}

export interface WorkflowReport {
  summary: string;
  steps: WorkflowStepResult[];
  recommendations: string[];
}

export interface WorkflowStepResult {
  step: string;
  result: any;
  status: string;
}

export interface SQLInjectionScanOptions {
  method?: 'GET' | 'POST';
  level?: number;
  risk?: number;
  threads?: number;
  includeReconnaissance?: boolean;
}

export interface EnhancedScanResult {
  target: string;
  scanResults: any[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  report: string;
  timestamp: string;
}

export interface DocumentProcessingOptions {
  style?: string;
  format?: string;
  includeAIAnalysis?: boolean;
}

export interface EnhancedDocumentResult {
  originalContent: string;
  processedDocument: any;
  aiEnhancements: any;
  processingOptions: DocumentProcessingOptions;
  timestamp: string;
}

export interface ComprehensiveReport {
  content: string;
  recommendations: string[];
  executiveSummary: string;
  technicalDetails: any;
}

export interface MCPServiceAnalytics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  toolUsage: Record<string, number>;
  errorRate: number;
  timeRange: string;
}

export interface MCPHealthStatus {
  serverName: string;
  status: 'healthy' | 'unhealthy' | 'error';
  lastCheck: string;
  responseTime: number;
  errorMessage?: string;
}

export interface MCPServiceStatus {
  isInitialized: boolean;
  availableServers: number;
  healthStatus: string;
  analyticsEnabled: boolean;
}

// Export singleton instance
export const mcpService = new MCPService();

// Initialize function
export async function initializeMCPServers(): Promise<void> {
  await mcpService.initialize();
}