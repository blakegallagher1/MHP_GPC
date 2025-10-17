export interface MetricLabels {
  [key: string]: string | number | boolean | undefined;
}

export interface HistogramOptions {
  name: string;
  description?: string;
  buckets?: number[];
}

export interface CounterOptions {
  name: string;
  description?: string;
}

export interface HistogramMetric {
  record(value: number, labels?: MetricLabels): void;
}

export interface CounterMetric {
  increment(value?: number, labels?: MetricLabels): void;
}

class InMemoryHistogram implements HistogramMetric {
  public readonly values: Array<{ value: number; labels?: MetricLabels }> = [];

  record(value: number, labels?: MetricLabels): void {
    this.values.push({ value, labels });
  }
}

class InMemoryCounter implements CounterMetric {
  public count = 0;
  public readonly values: Array<{ value: number; labels?: MetricLabels }> = [];

  increment(value = 1, labels?: MetricLabels): void {
    this.count += value;
    this.values.push({ value, labels });
  }
}

export class MetricsRegistry {
  private histograms = new Map<string, InMemoryHistogram>();
  private counters = new Map<string, InMemoryCounter>();

  histogram(options: HistogramOptions): HistogramMetric {
    if (!this.histograms.has(options.name)) {
      this.histograms.set(options.name, new InMemoryHistogram());
    }
    return this.histograms.get(options.name)!;
  }

  counter(options: CounterOptions): CounterMetric {
    if (!this.counters.has(options.name)) {
      this.counters.set(options.name, new InMemoryCounter());
    }
    return this.counters.get(options.name)!;
  }

  getHistogramValues(name: string): Array<{ value: number; labels?: MetricLabels }> {
    return this.histograms.get(name)?.values ?? [];
  }

  getCounterValue(name: string): number {
    return this.counters.get(name)?.count ?? 0;
  }
}

export const metricsRegistry = new MetricsRegistry();
