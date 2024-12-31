import opentelemetry, { SpanStatusCode } from '@opentelemetry/api';
import { Span, Tracer } from '@opentelemetry/api';
import {
  ATTR_CODE_COLUMN,
  ATTR_CODE_FILEPATH,
  ATTR_CODE_LINENO,
  ATTR_TEST_CASE_NAME,
  ATTR_TEST_CASE_RESULT_STATUS,
  ATTR_TEST_SUITE_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
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
      // Tests which are skipped or whose result status matches the expected
      // status are considered passing.
      const isPassing =
        result.status === 'skipped' || result.status === test.expectedStatus;

      testSpan.setAttributes({
        [ATTR_TEST_CASE_NAME]: formatTestTitle(this.config, test),
        [ATTR_TEST_CASE_RESULT_STATUS]: isPassing ? 'pass' : 'fail',
        [ATTR_TEST_SUITE_NAME]: test.parent.title,
        [ATTR_CODE_FILEPATH]: test.location.file,
        [ATTR_CODE_LINENO]: test.location.line,
        [ATTR_CODE_COLUMN]: test.location.column,
      });

      test.annotations.forEach((annotation) => {
        if (annotation.type.startsWith(TEST_ANNOTATION_SCOPE)) {
          const attrLabel = annotation.type.replace(TEST_ANNOTATION_SCOPE, '');
          testSpan.setAttribute(attrLabel, annotation.description);
        }
      });

      if (!isPassing) {
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
        'test.step.category': step.category,
        'test.step.name': step.title,
      });
      if (step.location) {
        stepSpan.setAttributes({
          [ATTR_CODE_FILEPATH]: step.location.file,
          [ATTR_CODE_LINENO]: step.location.line,
          [ATTR_CODE_COLUMN]: step.location.column,
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

/**
 * Prefix required for any annotation to be converted into a span attribute.
 */
export const TEST_ANNOTATION_SCOPE = 'pw_otel_reporter.';

/**
 * Utility function to generate an annotation label which this reporter will
 * use to tag spans.
 *
 * @param label {string} the label to use
 * @returns {string} the label with the required prefix added
 */
export function annotationLabel(label: string): string {
  return `${TEST_ANNOTATION_SCOPE}${label}`;
}
