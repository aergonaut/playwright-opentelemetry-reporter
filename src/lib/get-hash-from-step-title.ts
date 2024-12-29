import { createHash } from 'crypto';

import { FullConfig, TestCase, TestStep } from '@playwright/test/reporter';

import { formatTestTitle } from './format-test-title';

/**
 * Creates a hash from the title of a test step.
 *
 * @param {TestStep} step - The test step whose title should be hashed.
 * @returns {string} A hexadecimal representation of the hash value.
 */
export function getHashFromStepTitle(
  test: TestCase,
  step: TestStep,
  config: FullConfig
): string {
  const fullTitle = formatTestTitle(config, test, step);
  const hash = createHash('sha256').update(fullTitle).digest('hex');
  return hash;
}
