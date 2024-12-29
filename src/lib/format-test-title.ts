import path from 'path';

import { FullConfig } from '@playwright/test';
import { TestCase, TestStep } from '@playwright/test/reporter';

export function formatTestTitle(
  config: FullConfig,
  test: TestCase,
  step?: TestStep,
  omitLocation = false
): string {
  // root, project, file, ...describes, test
  const [, projectName, , ...titles] = test.titlePath();
  let location;
  if (omitLocation) location = `${relativeTestPath(config, test)}`;
  else
    location = `${relativeTestPath(config, test)}:${test.location.line}:${
      test.location.column
    }`;
  const projectTitle = projectName ? `[${projectName}] › ` : '';
  const testTitle = `${projectTitle}${location} › ${titles.join(' › ')}`;
  const extraTags = test.tags.filter((t) => !testTitle.includes(t));
  return `${testTitle}${stepSuffix(step)}${
    extraTags.length ? ' ' + extraTags.join(' ') : ''
  }`;
}

export function relativeFilePath(config: FullConfig, file: string): string {
  return path.relative(config.rootDir, file) || path.basename(file);
}

function relativeTestPath(config: FullConfig, test: TestCase): string {
  return relativeFilePath(config, test.location.file);
}

export function stepSuffix(step: TestStep | undefined) {
  const stepTitles = step ? step.titlePath() : [];
  return stepTitles
    .map((t) => t.split('\n')[0])
    .map((t) => ' › ' + t)
    .join('');
}
