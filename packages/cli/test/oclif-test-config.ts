// Minimal oclif Config for command unit tests: since oclif 3, Command.parse() runs the "preparse" hook
export const oclifTestConfig = {
  runHook: async (): Promise<{ successes: unknown[]; failures: unknown[] }> => ({ successes: [], failures: [] }),
} as any;
