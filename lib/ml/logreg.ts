// Logistic Regression Implementation for FORGE Calibration
// ============================================

import type { TrainingExample, TrainedModel } from "@/lib/types"

interface FitOptions {
  lr?: number // learning rate, default 0.1
  l2?: number // L2 regularization, default 0.01
  iters?: number // iterations, default 1000
}

interface FitResult {
  weights: number[]
  bias: number
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    n: number
  }
}

// Seeded random for deterministic shuffle
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  const rand = seededRandom(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function sigmoid(z: number): number {
  // Clamp to avoid overflow
  if (z > 20) return 1
  if (z < -20) return 0
  return 1 / (1 + Math.exp(-z))
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

export function fit(examples: TrainingExample[], options: FitOptions = {}): FitResult {
  const { lr = 0.1, l2 = 0.01, iters = 1000 } = options

  if (examples.length === 0) {
    return {
      weights: [],
      bias: 0,
      metrics: { accuracy: 0, precision: 0, recall: 0, f1: 0, n: 0 },
    }
  }

  const nFeatures = examples[0].features.length
  const weights = new Array(nFeatures).fill(0)
  let bias = 0

  // Shuffle and split if enough data
  const shuffled = shuffle(examples, 42)
  const splitIdx = examples.length >= 20 ? Math.floor(examples.length * 0.8) : examples.length
  const train = shuffled.slice(0, splitIdx)
  const test = examples.length >= 20 ? shuffled.slice(splitIdx) : train

  // Gradient descent
  for (let iter = 0; iter < iters; iter++) {
    for (const { features, label } of train) {
      const z = dotProduct(features, weights) + bias
      const pred = sigmoid(z)
      const error = pred - label

      // Update weights with L2 regularization
      for (let i = 0; i < nFeatures; i++) {
        weights[i] -= lr * (error * features[i] + l2 * weights[i])
      }
      bias -= lr * error
    }
  }

  // Compute metrics on test set
  const metrics = computeMetrics(test, weights, bias)

  return { weights, bias, metrics }
}

export function predictProba(features: number[], model: { weights: number[]; bias: number }): number {
  const z = dotProduct(features, model.weights) + model.bias
  return sigmoid(z)
}

export function predict(features: number[], model: { weights: number[]; bias: number }, threshold = 0.5): 0 | 1 {
  return predictProba(features, model) >= threshold ? 1 : 0
}

function computeMetrics(
  examples: TrainingExample[],
  weights: number[],
  bias: number,
): { accuracy: number; precision: number; recall: number; f1: number; n: number } {
  if (examples.length === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, n: 0 }
  }

  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0

  for (const { features, label } of examples) {
    const pred = predict(features, { weights, bias })
    if (pred === 1 && label === 1) tp++
    else if (pred === 1 && label === 0) fp++
    else if (pred === 0 && label === 0) tn++
    else fn++
  }

  const accuracy = (tp + tn) / examples.length
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  return { accuracy, precision, recall, f1, n: examples.length }
}

export function createTrainedModel(
  fitResult: FitResult,
  featureOrder: string[],
  versionPrefix = "calib",
): TrainedModel {
  return {
    version: `${versionPrefix}_v${Date.now()}`,
    trainedAt: new Date().toISOString(),
    weights: fitResult.weights,
    bias: fitResult.bias,
    featureOrder,
    metrics: fitResult.metrics,
  }
}
