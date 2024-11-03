import fetch from 'node-fetch';
import { setupLogger } from '../utils/logger.js';

const logger = setupLogger();

export class EthTokenAnalyzer {
  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  }

  async analyzeToken(tokenInfo) {
    try {
      const metrics = {
        contractMetrics: await this.analyzeContract(tokenInfo.address),
        liquidityMetrics: await this.analyzeLiquidity(tokenInfo),
        holderMetrics: await this.analyzeHolders(tokenInfo.address),
      };

      const totalScore = this.calculateTotalScore(metrics);
      return { ...metrics, totalScore };
    } catch (error) {
      logger.error(`Error analyzing token ${tokenInfo.address}: ${error.message}`);
      return null;
    }
  }

  async analyzeContract(address) {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`
      );
      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch contract data');
      }

      const contractData = data.result[0];
      return {
        isVerified: contractData.CompilerVersion !== '',
        hasProxy: contractData.Proxy === '1',
        contractName: contractData.ContractName,
        score: this.calculateContractScore(contractData)
      };
    } catch (error) {
      logger.error(`Contract analysis error: ${error.message}`);
      return { isVerified: false, hasProxy: false, contractName: '', score: 0 };
    }
  }

  async analyzeLiquidity(tokenInfo) {
    // For demo purposes, returning simulated liquidity metrics
    return {
      hasLiquidity: true,
      liquidityScore: 0.8,
      score: 0.8
    };
  }

  async analyzeHolders(address) {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${address}&apikey=${this.etherscanApiKey}`
      );
      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch holder data');
      }

      const holders = data.result;
      return {
        totalHolders: holders.length,
        topHolderConcentration: this.calculateHolderConcentration(holders),
        score: this.calculateHolderScore(holders)
      };
    } catch (error) {
      logger.error(`Holder analysis error: ${error.message}`);
      return { totalHolders: 0, topHolderConcentration: 1, score: 0 };
    }
  }

  calculateContractScore(contractData) {
    let score = 0;
    if (contractData.CompilerVersion !== '') score += 0.5;
    if (contractData.Proxy !== '1') score += 0.3;
    if (contractData.ContractName !== '') score += 0.2;
    return score;
  }

  calculateHolderScore(holders) {
    if (!holders || holders.length === 0) return 0;
    const concentration = this.calculateHolderConcentration(holders);
    return Math.max(0, 1 - concentration);
  }

  calculateHolderConcentration(holders) {
    if (!holders || holders.length === 0) return 1;
    const totalSupply = holders.reduce((sum, holder) => sum + Number(holder.TokenHolderQuantity), 0);
    const topHolder = holders[0];
    return topHolder ? Number(topHolder.TokenHolderQuantity) / totalSupply : 1;
  }

  calculateTotalScore(metrics) {
    const weights = {
      contract: 0.4,
      liquidity: 0.3,
      holders: 0.3
    };

    return (
      metrics.contractMetrics.score * weights.contract +
      metrics.liquidityMetrics.score * weights.liquidity +
      metrics.holderMetrics.score * weights.holders
    );
  }
}