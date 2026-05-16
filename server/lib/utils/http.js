export const buildCorsHeaders = (allowHeaders = 'Content-Type') => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': allowHeaders,
})
