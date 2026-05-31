import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const NETWORK = (import.meta.env.VITE_SUI_NETWORK as "testnet" | "mainnet") ?? "testnet";

export const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
