require("@testing-library/jest-dom");

// Restore native Node.js Web APIs that jsdom may have removed
const apis = globalThis.__nodeWebAPIs || {};
if (apis.Request) global.Request = apis.Request;
if (apis.Response) global.Response = apis.Response;
if (apis.Headers) global.Headers = apis.Headers;
if (apis.fetch) global.fetch = apis.fetch;
