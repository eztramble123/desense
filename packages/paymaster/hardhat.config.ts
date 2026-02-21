import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync";
import "dotenv/config";
import path from "path";

const config: HardhatUserConfig = {
  defaultNetwork: "adiTestnet",
  networks: {
    hardhat: {
      zksync: true,
    },
    adiTestnet: {
      url: "https://rpc.ab.testnet.adifoundation.ai/",
      ethNetwork: "sepolia",
      zksync: true,
      chainId: 99999,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    inMemoryNode: {
      url: "http://127.0.0.1:8011",
      ethNetwork: "localhost",
      zksync: true,
    },
  },
  zksolc: {
    settings: {
      enableEraVMExtensions: false,
      codegen: "evmla",
      compilerPath: path.join(__dirname, "../contracts/cache/zksolc/zksolc-v1.5.12"),
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
};

export default config;
