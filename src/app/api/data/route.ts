import { NextResponse } from 'next/server';
import { dataGenerator } from '@/utils/dataGenerator';

export async function GET() {
  // Return an initial dataset of 2000 points
  const initial = dataGenerator.generateInitialDataset(2000);
  return NextResponse.json({ data: initial });
}
