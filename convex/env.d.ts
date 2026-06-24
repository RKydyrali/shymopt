declare namespace NodeJS {
  interface ProcessEnv {
    TELEGRAM_BOT_TOKEN?: string;
  }
}

declare global {
  function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  function atob(data: string): string;
}
