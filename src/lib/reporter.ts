import opentelemetry, { SpanStatusCode } from '@opentelemetry/api';
import { Span, Tracer } from '@opentelemetry/api';
import {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

import { formatTestTitle } from './format-test-title';
import { getHashFromStepTitle } from './get-hash-from-step-title';
import { name as PKG_NAME, version as PKG_VERSION } from './version';

class OpenTelemetryReporter implements Reporter {
  private config: FullConfig;

  private testSpans: { [key in string]: Span } = {};
  private stepSapns: { [key in string]: Span } = {};
  private tracer: Tracer;

  constructor() {
    this.tracer = opentelemetry.trace.getTracer(PKG_NAME, PKG_VERSION);
  }

  onBegin(config: FullConfig): void {
    this.config = config;
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const testSpan = this.tracer.startSpan(formatTestTitle(this.config, test), {
      startTime: result.startTime,
    });
    this.testSpans[test.id] = testSpan;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testSpan = this.testSpans[test.id];
    if (testSpan) {
      testSpan.setAttributes({
        'test.status': result.status,
        'test.outcome': test.outcome(),
        'test.title': test.title,
        'test.location.file': test.location.file,
        'test.location.line': test.location.line,
        'test.location.column': test.location.column,
        'test.retry': result.retry,
        'test.workerIndex': result.workerIndex,
      });
      if (result.error) {
        testSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: result.error?.message || '',
        });
      }
      testSpan.end(result.startTime.getTime() + result.duration);
    }
  }

  onStepBegin(test: TestCase, _result: TestResult, step: TestStep): void {
    const parent =
      step.parent === undefined
        ? this.testSpans[test.id]
        : this.stepSapns[getHashFromStepTitle(test, step.parent, this.config)];

    const stepHash = getHashFromStepTitle(test, step, this.config);

    const ctx = opentelemetry.trace.setSpan(
      opentelemetry.context.active(),
      parent
    );

    const stepSpan = this.tracer.startSpan(
      `Step: ${step.title}`,
      {
        startTime: step.startTime,
      },
      ctx
    );

    this.stepSapns[stepHash] = stepSpan;
  }

  onStepEnd(test: TestCase, _result: TestResult, step: TestStep): void {
    const stepSpan =
      this.stepSapns[getHashFromStepTitle(test, step, this.config)];
    if (stepSpan) {
      stepSpan.setAttributes({
        'step.category': step.category,
        'step.title': step.title,
      });
      if (step.location) {
        stepSpan.setAttributes({
          'step.location.file': step.location.file,
          'step.location.line': step.location.line,
          'step.location.column': step.location.column,
        });
      }
      if (step.error) {
        stepSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: step.error?.message || '',
        });
      }
      stepSpan.end(step.startTime.getTime() + step.duration);
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default OpenTelemetryReporter;
