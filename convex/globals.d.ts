/* eslint-disable @typescript-eslint/no-explicit-any */

// Convex actions run in a runtime that supports these globals
declare const fetch: typeof globalThis.fetch;
declare const atob: (data: string) => string;
declare const FormData: typeof globalThis.FormData;
declare const Blob: typeof globalThis.Blob;
