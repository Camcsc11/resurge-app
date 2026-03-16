import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.CREATOR_JWT_SECRET || 'default-secret-key'
);

export interface CreatorTokenPayload {
  creator_id: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function signCreatorToken(
  payload: CreatorTokenPayload
): Promise<string> {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}

export async function verifyCreatorToken(
  token: string
): Promise<CreatorTokenPayload | null> {
  try {
    const verified = await jose.jwtVerify(token, secret);
    return verified.payload as CreatorTokenPayload;
  } catch (error) {
    return null;
  }
}
