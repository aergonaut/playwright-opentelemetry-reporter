# Playwright OpenTelemetry Reporter

Simple reporter that generates OpenTelemetry traces from Playwright test runs. You can then export these traces to your
vendor of choice.

## Usage

### Dependencies

Install the package with your favorite package manager:

```
$ npm install @aergonaut/playwright-opentelemetry-reporter --save-dev
```

You will also need to install the OpenTelemetry Node SDK and any other packages required by your vendor to export traces.

```
$ npm install @opentelemetry/sdk-trace-node --save-dev
```

### Initialize the SDK

To collect traces, you must initialize the OpenTelemetry SDK before Playwright begins running your tests. The easiest
way to do this is through `globalSetup`. For example:

```ts
// global-setup.ts
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
});

export default async function globalSetup(_config: FullConfig) {
  sdk.start();

  return async () => {
    await sdk.shutdown();
  };
}
```

N.b. ensure your `globalSetup` functions returns a function that calls `sdk.shutdown()`. This will ensure that traces
are exported before Playwright exits.

### Configure Playwright

Configure Playwright to use your `global-setup.ts` and the reporter:

```ts
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve("./global-setup.ts"),
  reporter: "@aergonaut/playwright-opentelemetry-reporter",
})
```

## Lcense

MIT.
