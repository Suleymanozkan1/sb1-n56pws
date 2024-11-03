import { ethers } from 'ethers';
import { setupLogger } from '../utils/logger.js';

const logger = setupLogger();

export class EthTokenScanner {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
    this.knownTokens = new Set();
  }

  async getNewTokens() {
    try {
      // Get the latest block
      const latestBlock = await this.provider.getBlockNumber();
      const fromBlock = latestBlock - 1000; // Look back ~1000 blocks

      // ERC20 Transfer event topic
      const transferTopic = ethers.id('Transfer(address,address,uint256)');
      
      // Get logs for Transfer events
      const logs = await this.provider.getLogs({
        fromBlock,
        toBlock: latestBlock,
        topics: [transferTopic]
      });

      const newTokens = [];
      const processedAddresses = new Set();

      for (const log of logs) {
        const tokenAddress = log.address.toLowerCase();
        
        // Skip if already processed
        if (processedAddresses.has(tokenAddress) || this.knownTokens.has(tokenAddress)) {
          continue;
        }

        processedAddresses.add(tokenAddress);

        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            [
              'function name() view returns (string)',
              'function symbol() view returns (string)',
              'function totalSupply() view returns (uint256)',
              'function decimals() view returns (uint8)'
            ],
            this.provider
          );

          const [name, symbol, totalSupply, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.totalSupply(),
            tokenContract.decimals()
          ]);

          const tokenInfo = {
            address: tokenAddress,
            name,
            symbol,
            totalSupply: totalSupply.toString(),
            decimals,
            blockNumber: log.blockNumber,
            timestamp: (await this.provider.getBlock(log.blockNumber)).timestamp * 1000
          };

          newTokens.push(tokenInfo);
          this.knownTokens.add(tokenAddress);
          
          logger.info(`Found new token on Ethereum:`, tokenInfo);
        } catch (error) {
          continue; // Skip invalid contracts
        }
      }

      return newTokens;
    } catch (error) {
      logger.error(`Error scanning Ethereum tokens: ${error.message}`);
      return [];
    }
  }
}