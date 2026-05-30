/**
 * zkLogin 流程工具。
 *
 * 封装 Sui zkLogin 的完整登录流程：临时密钥 → nonce → Google OAuth →
 * JWT → 派生地址 → zkProof。
 *
 * 依赖：@mysten/sui （SuiClient、zklogin、ed25519）
 * 配置见环境变量 VITE_GOOGLE_CLIENT_ID / VITE_ZK_PROVER_URL / VITE_SALT_SERVICE_URL。
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
} from "@mysten/sui/zklogin";

const NETWORK = (import.meta.env.VITE_SUI_NETWORK as "testnet" | "mainnet") ?? "testnet";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const PROVER_URL =
  (import.meta.env.VITE_ZK_PROVER_URL as string) ??
  "https://prover-dev.mystenlabs.com/v1";
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

export interface EphemeralSession {
  ephemeralPrivateKey: string; // base64，存 sessionStorage
  ephemeralPublicKey: string;
  maxEpoch: number;
  randomness: string;
  nonce: string;
}

const SESSION_KEY = "evo_zklogin_session";

/** 第一步：准备临时密钥 + nonce，返回 Google OAuth 跳转 URL。 */
export async function beginLogin(): Promise<string> {
  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  const { epoch } = await client.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 2; // 临时密钥有效 2 个 epoch

  const ephemeralKeypair = Ed25519Keypair.generate();
  const randomness = generateRandomness();
  const nonce = generateNonce(
    ephemeralKeypair.getPublicKey(),
    maxEpoch,
    randomness,
  );

  const session: EphemeralSession = {
    ephemeralPrivateKey: ephemeralKeypair.getSecretKey(),
    ephemeralPublicKey: ephemeralKeypair.getPublicKey().toBase64(),
    maxEpoch,
    randomness,
    nonce,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "id_token",
    scope: "openid email",
    nonce,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** 从回调 URL 的 fragment 中取出 id_token(JWT)。 */
export function extractJwtFromCallback(): string | null {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return fragment.get("id_token");
}

export function loadSession(): EphemeralSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as EphemeralSession) : null;
}

/**
 * 第二步：用 JWT + salt 派生 zkLogin 地址。
 * salt 生产环境应来自 salt 服务；Demo 可用固定 salt。
 */
export function deriveAddress(jwt: string, salt: string): string {
  return jwtToAddress(jwt, salt);
}

/** 第三步：向 prover 请求 zkProof（签名交易时使用）。 */
export async function requestZkProof(params: {
  jwt: string;
  session: EphemeralSession;
  salt: string;
}): Promise<unknown> {
  const { jwt, session, salt } = params;
  const ephemeralKeypair = Ed25519Keypair.fromSecretKey(session.ephemeralPrivateKey);
  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
    ephemeralKeypair.getPublicKey(),
  );

  const resp = await fetch(PROVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey,
      maxEpoch: session.maxEpoch,
      jwtRandomness: session.randomness,
      salt,
      keyClaimName: "sub",
    }),
  });
  if (!resp.ok) {
    throw new Error(`zkProof 请求失败: ${resp.status}`);
  }
  return resp.json();
}
