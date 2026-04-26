const KNOWN_COMMANDS = new Set(["dev", "build", "export", "lint", "help"]);
const PASS_THROUGH_FLAGS = new Set(["--help", "-h", "--version", "-V"]);

export function normalizeArgv(userArgs: readonly string[]): string[] {
  if (userArgs.length === 0) {
    return ["dev"];
  }

  const first = userArgs[0];
  if (KNOWN_COMMANDS.has(first)) {
    return [...userArgs];
  }
  if (PASS_THROUGH_FLAGS.has(first)) {
    return [...userArgs];
  }

  return ["dev", ...userArgs];
}
