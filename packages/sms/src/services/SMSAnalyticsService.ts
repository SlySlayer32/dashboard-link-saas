import {
  SMSMessageStats,
  SMSCostStats,
  SMSDeliveryStats,
  SMSResult
} from '@dashboard-link/shared';

/**
 * Date range filter
 */
export interface DateRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

/**
 * Failure analysis result
 */
export interface FailureAnalysisResult {
  totalFailures: number;
  byErrorType: Record<string, number>;
  byProvider: Record<string, number>;
  topFailureReasons: { reason: string; count: number }[];
  failureRate: number; // percentage
}

/**
 * Cost optimization result
 */
export interface CostOptimizationResult {
  currentCost: number;
  projectedCost: number;
  potentialSavings: number;
  recommendations: string[];
  optimalProvider: string;
}

/**
 * Provider performance result
 */
export interface ProviderPerformanceResult {
  provider: string;
  totalSent: number;
  successRate: number;
  averageResponseTime: number;
  averageCost: number;
  reliability: number; // 0-100 score
}

/**
 * Peak usage result
 */
export interface PeakUsageResult {
  peakHour: { hour: number; messages: number };
  peakDay: { day: string; messages: number };
  peakWeek: { week: string; messages: number };
  hourlyDistribution: { hour: number; messages: number }[];
  dailyDistribution: { day: string; messages: number }[];
}

/**
 * SMS Analytics Service
 * Provides comprehensive analytics and reporting capabilities
 * Following Zapier's data-driven approach
 */
export class SMSAnalyticsService {
  private messageHistory: SMSResult[] = [];
  private readonly MAX_HISTORY_SIZE = 10000;

  /**
   * Record a message result for analytics
   */
  recordMessage(result: SMSResult): void {
    this.messageHistory.push(result);
    
    // Maintain history size limit
    if (this.messageHistory.length > this.MAX_HISTORY_SIZE) {
      this.messageHistory.shift();
    }
  }

  /**
   * Get message statistics for a date range
   */
  async getMessageStats(dateRange: DateRange): Promise<SMSMessageStats> {
    const messages = this.filterByDateRange(dateRange);
    
    const totalSent = messages.length;
    const totalDelivered = messages.filter(m => 
      m.success && m.deliveryReport?.status === 'delivered'
    ).length;
    const totalFailed = messages.filter(m => !m.success).length;

    // Calculate average delivery time
    const deliveredMessages = messages.filter(m => 
      m.success && m.deliveryReport?.deliveredAt
    );
    
    let totalDeliveryTime = 0;
    for (const msg of deliveredMessages) {
      if (msg.deliveryReport?.deliveredAt && msg.timestamp) {
        const sent = new Date(msg.timestamp).getTime();
        const delivered = new Date(msg.deliveryReport.deliveredAt).getTime();
        totalDeliveryTime += (delivered - sent) / 1000 / 60; // minutes
      }
    }

    const averageDeliveryTime = deliveredMessages.length > 0 
      ? totalDeliveryTime / deliveredMessages.length 
      : 0;

    // Count by provider
    const byProvider: Record<string, number> = {};
    for (const msg of messages) {
      byProvider[msg.provider] = (byProvider[msg.provider] || 0) + 1;
    }

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      averageDeliveryTime,
      byProvider
    };
  }

  /**
   * Get cost statistics by provider
   */
  async getCostByProvider(dateRange: DateRange): Promise<SMSCostStats> {
    const messages = this.filterByDateRange(dateRange);
    
    const costByProvider: Record<string, number> = {};
    let totalCost = 0;

    for (const msg of messages) {
      if (msg.cost) {
        costByProvider[msg.provider] = (costByProvider[msg.provider] || 0) + msg.cost;
        totalCost += msg.cost;
      }
    }

    const averageCostPerMessage = messages.length > 0 
      ? totalCost / messages.length 
      : 0;

    return {
      totalCost,
      costByProvider,
      averageCostPerMessage,
      currency: 'USD' // Should be configurable
    };
  }

  /**
   * Get delivery rate statistics
   */
  async getDeliveryRates(dateRange: DateRange): Promise<SMSDeliveryStats> {
    const messages = this.filterByDateRange(dateRange);
    
    const totalMessages = messages.length;
    const deliveredMessages = messages.filter(m => 
      m.success && m.deliveryReport?.status === 'delivered'
    ).length;

    const overallDeliveryRate = totalMessages > 0 
      ? (deliveredMessages / totalMessages) * 100 
      : 0;

    // Delivery rate by provider
    const deliveryRateByProvider: Record<string, number> = {};
    const providerStats: Record<string, { sent: number; delivered: number }> = {};

    for (const msg of messages) {
      if (!providerStats[msg.provider]) {
        providerStats[msg.provider] = { sent: 0, delivered: 0 };
      }
      
      providerStats[msg.provider].sent++;
      
      if (msg.success && msg.deliveryReport?.status === 'delivered') {
        providerStats[msg.provider].delivered++;
      }
    }

    for (const [provider, stats] of Object.entries(providerStats)) {
      deliveryRateByProvider[provider] = stats.sent > 0 
        ? (stats.delivered / stats.sent) * 100 
        : 0;
    }

    // Failure reasons
    const failureReasons: Record<string, number> = {};
    for (const msg of messages) {
      if (!msg.success && msg.error) {
        failureReasons[msg.error] = (failureReasons[msg.error] || 0) + 1;
      }
    }

    // Peak hours analysis
    const hourlyStats: Record<number, number> = {};
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    }

    const peakHours = Object.entries(hourlyStats)
      .map(([hour, messages]) => ({ hour: parseInt(hour), messages }))
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 5);

    return {
      overallDeliveryRate,
      deliveryRateByProvider,
      failureReasons,
      peakHours
    };
  }

  /**
   * Analyze failures in detail
   */
  async getFailureAnalysis(dateRange: DateRange): Promise<FailureAnalysisResult> {
    const messages = this.filterByDateRange(dateRange);
    const failures = messages.filter(m => !m.success);
    
    const totalFailures = failures.length;
    const totalMessages = messages.length;

    // By error type
    const byErrorType: Record<string, number> = {};
    for (const msg of failures) {
      const errorType = msg.errorType || 'unknown';
      byErrorType[errorType] = (byErrorType[errorType] || 0) + 1;
    }

    // By provider
    const byProvider: Record<string, number> = {};
    for (const msg of failures) {
      byProvider[msg.provider] = (byProvider[msg.provider] || 0) + 1;
    }

    // Top failure reasons
    const reasonCounts: Record<string, number> = {};
    for (const msg of failures) {
      if (msg.error) {
        reasonCounts[msg.error] = (reasonCounts[msg.error] || 0) + 1;
      }
    }

    const topFailureReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const failureRate = totalMessages > 0 ? (totalFailures / totalMessages) * 100 : 0;

    return {
      totalFailures,
      byErrorType,
      byProvider,
      topFailureReasons,
      failureRate
    };
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimization(dateRange: DateRange): Promise<CostOptimizationResult> {
    const costStats = await this.getCostByProvider(dateRange);
    const deliveryStats = await this.getDeliveryRates(dateRange);

    // Calculate cost per successful delivery by provider
    const costPerDelivery: Record<string, number> = {};
    
    for (const [provider, cost] of Object.entries(costStats.costByProvider)) {
      const deliveryRate = deliveryStats.deliveryRateByProvider[provider] || 0;
      const effectiveCost = deliveryRate > 0 ? cost / (deliveryRate / 100) : cost;
      costPerDelivery[provider] = effectiveCost;
    }

    // Find optimal provider (lowest cost per delivery)
    const optimalProvider = Object.entries(costPerDelivery)
      .sort(([, a], [, b]) => a - b)[0]?.[0] || 'unknown';

    const recommendations: string[] = [];
    
    // Generate recommendations
    if (Object.keys(costStats.costByProvider).length > 1) {
      const currentAvg = costStats.averageCostPerMessage;
      const optimalCost = costPerDelivery[optimalProvider];
      
      if (optimalCost < currentAvg) {
        const potentialSavings = ((currentAvg - optimalCost) / currentAvg) * 100;
        recommendations.push(
          `Switch to ${optimalProvider} to save ${potentialSavings.toFixed(1)}% on costs`
        );
      }
    }

    // Check for providers with low delivery rates
    for (const [provider, rate] of Object.entries(deliveryStats.deliveryRateByProvider)) {
      if (rate < 90) {
        recommendations.push(
          `${provider} has low delivery rate (${rate.toFixed(1)}%). Consider switching providers for better reliability.`
        );
      }
    }

    return {
      currentCost: costStats.totalCost,
      projectedCost: costStats.totalCost, // Would calculate based on recommendations
      potentialSavings: 0, // Would calculate based on recommendations
      recommendations,
      optimalProvider
    };
  }

  /**
   * Get provider performance comparison
   */
  async getProviderPerformance(dateRange: DateRange): Promise<ProviderPerformanceResult[]> {
    const messages = this.filterByDateRange(dateRange);
    const providerGroups = this.groupByProvider(messages);

    const results: ProviderPerformanceResult[] = [];

    for (const [provider, msgs] of Object.entries(providerGroups)) {
      const totalSent = msgs.length;
      const successful = msgs.filter(m => m.success).length;
      const successRate = totalSent > 0 ? (successful / totalSent) * 100 : 0;

      // Average response time (would need to track this)
      const averageResponseTime = 0; // Placeholder

      // Average cost
      const totalCost = msgs.reduce((sum, m) => sum + (m.cost || 0), 0);
      const averageCost = totalSent > 0 ? totalCost / totalSent : 0;

      // Reliability score (based on success rate and consistency)
      const reliability = successRate; // Simplified

      results.push({
        provider,
        totalSent,
        successRate,
        averageResponseTime,
        averageCost,
        reliability
      });
    }

    return results.sort((a, b) => b.reliability - a.reliability);
  }

  /**
   * Get peak usage analysis
   */
  async getPeakUsageAnalysis(dateRange: DateRange): Promise<PeakUsageResult> {
    const messages = this.filterByDateRange(dateRange);

    // Hourly distribution
    const hourlyStats: Record<number, number> = {};
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    }

    const hourlyDistribution = Object.entries(hourlyStats)
      .map(([hour, messages]) => ({ hour: parseInt(hour), messages }))
      .sort((a, b) => a.hour - b.hour);

    const peakHour = [...hourlyDistribution].sort((a, b) => b.messages - a.messages)[0] || 
      { hour: 0, messages: 0 };

    // Daily distribution
    const dailyStats: Record<string, number> = {};
    for (const msg of messages) {
      const day = new Date(msg.timestamp).toISOString().split('T')[0];
      dailyStats[day] = (dailyStats[day] || 0) + 1;
    }

    const dailyDistribution = Object.entries(dailyStats)
      .map(([day, messages]) => ({ day, messages }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const peakDay = [...dailyDistribution].sort((a, b) => b.messages - a.messages)[0] || 
      { day: '', messages: 0 };

    return {
      peakHour,
      peakDay,
      peakWeek: { week: '', messages: 0 }, // Would need week calculation
      hourlyDistribution,
      dailyDistribution
    };
  }

  /**
   * Clear analytics history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.messageHistory.length;
  }

  /**
   * Filter messages by date range
   */
  private filterByDateRange(dateRange: DateRange): SMSResult[] {
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();

    return this.messageHistory.filter(msg => {
      const timestamp = new Date(msg.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Group messages by provider
   */
  private groupByProvider(messages: SMSResult[]): Record<string, SMSResult[]> {
    const groups: Record<string, SMSResult[]> = {};
    
    for (const msg of messages) {
      if (!groups[msg.provider]) {
        groups[msg.provider] = [];
      }
      groups[msg.provider].push(msg);
    }

    return groups;
  }
}
