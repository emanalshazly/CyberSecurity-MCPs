import { OpenAI } from 'openai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import * as tf from '@tensorflow/tfjs-node';
import { logger } from '../../utils/logger.js';
import { ThreatAnalyzer } from './threat-analyzer.js';
import { RiskScorer } from './risk-scorer.js';
import { ReportGenerator } from './report-generator.js';
import { PatternDetector } from './pattern-detector.js';

export class AIService {
  private openai: OpenAI;
  private chatModel: ChatOpenAI;
  private threatAnalyzer: ThreatAnalyzer;
  private riskScorer: RiskScorer;
  private reportGenerator: ReportGenerator;
  private patternDetector: PatternDetector;
  private isInitialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.chatModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4',
      temperature: 0.1,
    });

    this.threatAnalyzer = new ThreatAnalyzer(this.openai);
    this.riskScorer = new RiskScorer();
    this.reportGenerator = new ReportGenerator(this.chatModel);
    this.patternDetector = new PatternDetector();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize TensorFlow
      await tf.ready();
      logger.info('TensorFlow initialized successfully');

      // Load pre-trained models
      await this.loadModels();
      
      this.isInitialized = true;
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  private async loadModels(): Promise<void> {
    try {
      // Load threat detection model
      await this.patternDetector.loadModel();
      
      // Load risk assessment model
      await this.riskScorer.loadModel();
      
      logger.info('AI models loaded successfully');
    } catch (error) {
      logger.warn('Some AI models failed to load, continuing with basic functionality:', error);
    }
  }

  // Enhanced threat analysis with AI
  async analyzeThreat(data: any): Promise<ThreatAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    try {
      // Multi-layered analysis
      const [aiAnalysis, patternAnalysis, riskScore] = await Promise.all([
        this.threatAnalyzer.analyze(data),
        this.patternDetector.detectPatterns(data),
        this.riskScorer.calculateRisk(data)
      ]);

      // Combine results for comprehensive analysis
      const combinedAnalysis = this.combineAnalysisResults(aiAnalysis, patternAnalysis, riskScore);
      
      // Generate intelligent recommendations
      const recommendations = await this.generateRecommendations(combinedAnalysis);

      return {
        ...combinedAnalysis,
        recommendations,
        confidence: this.calculateConfidence(combinedAnalysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Threat analysis failed:', error);
      throw error;
    }
  }

  // Generate intelligent security reports
  async generateSecurityReport(data: any, format: 'markdown' | 'pdf' | 'html' = 'markdown'): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    try {
      const analysis = await this.analyzeThreat(data);
      return await this.reportGenerator.generate(analysis, format);
    } catch (error) {
      logger.error('Report generation failed:', error);
      throw error;
    }
  }

  // Real-time threat monitoring with AI
  async monitorThreats(stream: any): Promise<ThreatMonitoringResult> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    try {
      const threats = [];
      let riskLevel = 'low';

      for await (const chunk of stream) {
        const analysis = await this.analyzeThreat(chunk);
        threats.push(analysis);

        // Update overall risk level
        if (analysis.riskLevel === 'high') {
          riskLevel = 'high';
        } else if (analysis.riskLevel === 'medium' && riskLevel !== 'high') {
          riskLevel = 'medium';
        }
      }

      return {
        threats,
        overallRiskLevel: riskLevel,
        totalThreats: threats.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Threat monitoring failed:', error);
      throw error;
    }
  }

  // AI-powered vulnerability assessment
  async assessVulnerabilities(target: string): Promise<VulnerabilityAssessment> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    try {
      const assessment = await this.threatAnalyzer.assessVulnerabilities(target);
      const enhancedAssessment = await this.enhanceWithAI(assessment);
      
      return enhancedAssessment;
    } catch (error) {
      logger.error('Vulnerability assessment failed:', error);
      throw error;
    }
  }

  // Generate AI-powered security recommendations
  private async generateRecommendations(analysis: any): Promise<SecurityRecommendation[]> {
    try {
      const prompt = `
        Based on the following cybersecurity analysis, provide specific, actionable recommendations:
        
        Analysis: ${JSON.stringify(analysis, null, 2)}
        
        Please provide:
        1. Immediate actions (high priority)
        2. Short-term improvements (medium priority)
        3. Long-term strategies (low priority)
        4. Specific tools or techniques to implement
        
        Format as JSON with fields: priority, action, description, tools, estimatedEffort
      `;

      const response = await this.chatModel.call([
        new SystemMessage('You are a cybersecurity expert providing actionable recommendations.'),
        new HumanMessage(prompt)
      ]);

      return JSON.parse(response.content as string);
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  // Combine multiple analysis results
  private combineAnalysisResults(aiAnalysis: any, patternAnalysis: any, riskScore: number): CombinedAnalysis {
    return {
      threatLevel: this.calculateThreatLevel(aiAnalysis, patternAnalysis, riskScore),
      riskLevel: this.calculateRiskLevel(riskScore),
      confidence: this.calculateConfidence({ aiAnalysis, patternAnalysis, riskScore }),
      details: {
        ai: aiAnalysis,
        patterns: patternAnalysis,
        riskScore
      }
    };
  }

  // Calculate threat level based on multiple factors
  private calculateThreatLevel(aiAnalysis: any, patternAnalysis: any, riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    const factors = [
      aiAnalysis.confidence || 0,
      patternAnalysis.matchScore || 0,
      riskScore / 100
    ];

    const averageScore = factors.reduce((a, b) => a + b, 0) / factors.length;
    
    if (averageScore >= 0.8) return 'critical';
    if (averageScore >= 0.6) return 'high';
    if (averageScore >= 0.4) return 'medium';
    return 'low';
  }

  // Calculate risk level
  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  // Calculate overall confidence
  private calculateConfidence(analysis: any): number {
    // Implementation for confidence calculation
    return 0.85; // Placeholder
  }

  // Enhance assessment with AI insights
  private async enhanceWithAI(assessment: any): Promise<any> {
    try {
      const prompt = `
        Enhance this vulnerability assessment with additional insights:
        
        Assessment: ${JSON.stringify(assessment, null, 2)}
        
        Provide:
        1. Additional attack vectors to consider
        2. Potential impact scenarios
        3. Mitigation strategies
        4. Industry best practices
      `;

      const response = await this.chatModel.call([
        new SystemMessage('You are a cybersecurity expert enhancing vulnerability assessments.'),
        new HumanMessage(prompt)
      ]);

      return {
        ...assessment,
        aiEnhancements: response.content
      };
    } catch (error) {
      logger.error('Failed to enhance assessment with AI:', error);
      return assessment;
    }
  }

  // Get service status
  getStatus(): AIServiceStatus {
    return {
      isInitialized: this.isInitialized,
      modelsLoaded: this.patternDetector.isModelLoaded() && this.riskScorer.isModelLoaded(),
      openaiStatus: !!process.env.OPENAI_API_KEY,
      tensorflowStatus: tf.ready ? 'ready' : 'not ready'
    };
  }
}

// Types
export interface ThreatAnalysisResult {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  details: any;
  recommendations: SecurityRecommendation[];
  timestamp: string;
}

export interface SecurityRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  tools: string[];
  estimatedEffort: string;
}

export interface ThreatMonitoringResult {
  threats: ThreatAnalysisResult[];
  overallRiskLevel: 'low' | 'medium' | 'high';
  totalThreats: number;
  timestamp: string;
}

export interface VulnerabilityAssessment {
  target: string;
  vulnerabilities: any[];
  riskScore: number;
  recommendations: string[];
  aiEnhancements?: string;
}

export interface CombinedAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  details: any;
}

export interface AIServiceStatus {
  isInitialized: boolean;
  modelsLoaded: boolean;
  openaiStatus: boolean;
  tensorflowStatus: string;
}

// Export singleton instance
export const aiService = new AIService();

// Initialize function
export async function initializeAIServices(): Promise<void> {
  await aiService.initialize();
}