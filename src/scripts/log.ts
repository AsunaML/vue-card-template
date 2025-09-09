export default function log(message: string, level?: "info" | "warn" | "error"): void {
  if (level === undefined) {
    level = "info";
  }

  const prefix = "[Vue App]";
  const timestamp = new Date().toLocaleTimeString();
  const fullMessage = `${prefix} [${timestamp}] ${message}`;

  switch (level) {
    case "warn":
      console.warn(fullMessage);
      break;
    case "error":
      console.error(fullMessage);
      break;
    default:
      console.log(fullMessage);
  }
}
