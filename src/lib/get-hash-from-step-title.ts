import { createHash } from 'crypto';

import { TestStep } from '@playwright/test/reporter';

/**
 * Creates a hash from the title of a test step.
 *
 * @param {TestStep} step - The test step whose title should be hashed.
 * @returns {string} A hexadecimal representation of the hash value.
 */
export function getHashFromStepTitle(step: TestStep): string {
  const hash = createHash('sha256')
    .update(step.titlePath().join(' '))
    .digest('hex');
  return hash;
}
