// This file runs BEFORE the test environment (jsdom) is set up.
// Capture native Node.js Web API globals before jsdom can overwrite them.
const { Request, Response, Headers, fetch } = globalThis;

// Store them so they can be restored after jsdom setup
globalThis.__nodeWebAPIs = { Request, Response, Headers, fetch };
