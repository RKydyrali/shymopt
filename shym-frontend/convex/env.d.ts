declare namespace NodeJS {
  interface ProcessEnv {
    TELEGRAM_BOT_TOKEN?: string;
    ALEM_SPEECH_TO_TEXT_KEY?: string;
    ALEM_KAZAKH_LLM_KEY?: string;
    ALEM_RUSSIAN_LLM_KEY?: string;
  }
}

declare global {
  function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  function atob(data: string): string;
}
