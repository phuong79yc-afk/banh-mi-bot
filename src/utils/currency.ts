import { readJSON, writeJSON } from './secureFileIO';
import path from 'path';

const COINS_PATH = path.join(process.cwd(), 'data', 'coins.json');

export async function getUserCoins(userId: string): Promise<number> {
  const data = await readJSON<Record<string, number>>(COINS_PATH);
  return data[userId] || 0;
}

export async function addCoins(userId: string, amount: number): Promise<number> {
  const data = await readJSON<Record<string, number>>(COINS_PATH);
  data[userId] = (data[userId] || 0) + amount;
  await writeJSON(COINS_PATH, data);
  return data[userId];
}

export async function removeCoins(userId: string, amount: number): Promise<boolean> {
  const data = await readJSON<Record<string, number>>(COINS_PATH);
  const current = data[userId] || 0;
  if (current < amount) return false;
  data[userId] = current - amount;
  await writeJSON(COINS_PATH, data);
  return true;
}

export async function setCoins(userId: string, amount: number): Promise<number> {
  const data = await readJSON<Record<string, number>>(COINS_PATH);
  data[userId] = amount;
  await writeJSON(COINS_PATH, data);
  return amount;
}

export async function transferCoins(fromId: string, toId: string, amount: number): Promise<boolean> {
  const data = await readJSON<Record<string, number>>(COINS_PATH);
  const fromBalance = data[fromId] || 0;
  if (fromBalance < amount) return false;
  
  data[fromId] = fromBalance - amount;
  data[toId] = (data[toId] || 0) + amount;
  await writeJSON(COINS_PATH, data);
  return true;
}
