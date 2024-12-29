import opentelemetry, { SpanStatusCode } from '@opentelemetry/api';
import { Span, Tracer } from '@opentelemetry/api';
import {
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

import { getHashFromStepTitle } from './get-hash-from-step-title';

class OpenTelemetryReporter implements Reporter {
  private testSpans: { [key in string]: Span } = {};
  private stepSapns: { [key in string]: Span } = {};
  private tracer: Tracer;

  constructor() {
    this.tracer = opentelemetry.trace.getTracer('playwright');
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const testSpan = this.tracer.startSpan(test.titlePath().join(' > '), {
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
      testSpan.end();
    }
  }

  onStepBegin(test: TestCase, _result: TestResult, step: TestStep): void {
    const parent = this.testSpans[test.id];

    const stepHash = getHashFromStepTitle(step);

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

  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void {
    const stepSpan = this.stepSapns[getHashFromStepTitle(step)];
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
      stepSpan.end();
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default OpenTelemetryReporter;
