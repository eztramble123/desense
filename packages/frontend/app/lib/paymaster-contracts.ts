// Paymaster contract addresses - set these after deployment
export const PAYMASTER_CONTRACTS = {
  entryPoint: (process.env.NEXT_PUBLIC_PAYMASTER_ENTRYPOINT || "0x0000000071727De22E5E9d8BAf0edAc6f37da032") as `0x${string}`,
  nativePaymaster: (process.env.NEXT_PUBLIC_PAYMASTER_NATIVE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  erc20Paymaster: (process.env.NEXT_PUBLIC_PAYMASTER_ERC20 || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  accountFactory: (process.env.NEXT_PUBLIC_PAYMASTER_ACCOUNT_FACTORY || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  mockToken: (process.env.NEXT_PUBLIC_PAYMASTER_MOCK_TOKEN || "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

// NativePaymaster ABI
export const NATIVE_PAYMASTER_ABI = [
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "sponsorSigner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "getDeposit", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "senderSpendLimit", inputs: [{ name: "sender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "senderSpent", inputs: [{ name: "sender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "setSponsorSigner", inputs: [{ name: "signer", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setSpendLimit", inputs: [{ name: "sender", type: "address" }, { name: "limit", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "deposit", inputs: [], outputs: [], stateMutability: "payable" },
  { type: "event", name: "SponsorSignerUpdated", inputs: [{ name: "oldSigner", type: "address", indexed: true }, { name: "newSigner", type: "address", indexed: true }] },
] as const;

// ERC20Paymaster ABI
export const ERC20_PAYMASTER_ABI = [
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "token", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "tokenPriceMarkup", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nativeToTokenRate", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getDeposit", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getTokenCostForGas", inputs: [{ name: "gasCost", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "setToken", inputs: [{ name: "token", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setTokenPriceMarkup", inputs: [{ name: "markup", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setNativeToTokenRate", inputs: [{ name: "rate", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "deposit", inputs: [], outputs: [], stateMutability: "payable" },
] as const;

// SimpleAccountFactory ABI
export const ACCOUNT_FACTORY_ABI = [
  { type: "function", name: "createAccount", inputs: [{ name: "owner", type: "address" }, { name: "salt", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "nonpayable" },
  { type: "function", name: "getAddress", inputs: [{ name: "owner", type: "address" }, { name: "salt", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "event", name: "AccountCreated", inputs: [{ name: "account", type: "address", indexed: true }, { name: "owner", type: "address", indexed: true }] },
] as const;
