import { FullConfig, TestCase, TestStep } from '@playwright/test/reporter';
import test from 'ava';

import { getHashFromStepTitle } from './get-hash-from-step-title';

const step: TestStep = {
  titlePath: () => ['a', 'b'],
  category: '',
  duration: 0,
  startTime: undefined,
  steps: [],
  title: '',
};

const testCase: TestCase = {
  ok: function (): boolean {
    return true;
  },
  outcome: function (): 'skipped' | 'expected' | 'unexpected' | 'flaky' {
    return 'expected';
  },
  titlePath: function (): Array<string> {
    return ['x', 'y'];
  },
  annotations: [],
  expectedStatus: 'passed',
  id: '',
  location: {
    file: __filename,
    column: 0,
    line: 0,
  },
  parent: undefined,
  repeatEachIndex: 0,
  results: [],
  retries: 0,
  tags: [],
  timeout: 0,
  title: '',
  type: 'test',
};

const config: FullConfig = {
  projects: [],
  reporter: [],
  webServer: undefined,
  forbidOnly: false,
  fullyParallel: false,
  globalSetup: '',
  globalTeardown: '',
  globalTimeout: 0,
  grep: undefined,
  grepInvert: undefined,
  maxFailures: 0,
  metadata: {},
  preserveOutput: 'always',
  quiet: false,
  reportSlowTests: {
    max: 0,
    threshold: 0,
  },
  rootDir: '',
  shard: {
    total: 0,
    current: 0,
  },
  updateSnapshots: 'all',
  version: '',
  workers: 0,
};

test('getHashFromStepTitle computes sha256 of titlePath', (t) => {
  t.is(
    getHashFromStepTitle(testCase, step, config),
    '3737c18f0148c581ba2796a993e4072c00737845f7d5bb3bac698fcb67b41f7b'
  );
});
