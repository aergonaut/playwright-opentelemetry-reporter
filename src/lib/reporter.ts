import opentelemetry from '@opentelemetry/api';
import { Span, Tracer } from '@opentelemetry/api';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

class OpenTelemetryReporter implements Reporter {
  private config: FullConfig | undefined;
  private suite: Suite | undefined;

  private testSpans: { [key in string]: Span } = {};
  private tracer: Tracer;

  constructor() {
    this.tracer = opentelemetry.trace.getTracer('playwright');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const testSpan = this.tracer.startSpan(test.titlePath().join(' > '), {
      startTime: result.startTime,
    });
    this.testSpans[test.id] = testSpan;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testSpan = this.testSpans[test.id];
    testSpan.end();
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default OpenTelemetryReporter;
