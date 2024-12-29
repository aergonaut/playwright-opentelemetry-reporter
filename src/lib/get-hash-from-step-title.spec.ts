import { TestStep } from '@playwright/test/reporter';
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

test('getHashFromStepTitle computes sha256 of titlePath', (t) => {
  t.is(
    getHashFromStepTitle(step),
    'c8687a08aa5d6ed2044328fa6a697ab8e96dc34291e8c2034ae8c38e6fcc6d65'
  );
});
