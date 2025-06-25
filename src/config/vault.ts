import { Vault } from '../interfaces/vault';
import { VAULT_ADDR, VAULT_PASS } from './env';

export async function getSecret(path: string): Promise<Vault> {
  if (!path) return {};

  try {
    const VAULT_URL = VAULT_ADDR + path;
    const VAULT_TOKEN = VAULT_PASS;
    const response = await fetch(VAULT_URL, {
      method: 'GET',
      headers: {
        'X-Vault-Token': VAULT_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Vault request failed: ${response.status}`);
    }

    const data = await response.json();
    const secretValue = data?.data?.data;
    return secretValue && typeof secretValue === 'object' ? secretValue : {};
  } catch (error) {
    console.error('Error fetching Vault secret:', error instanceof Error ? error.message : String(error));
    return {};
  }
}