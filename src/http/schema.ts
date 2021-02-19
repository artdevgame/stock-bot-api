export const createApiKeySchema = {
  type: 'object',
  required: ['authKey'],
  properties: {
    authKey: { type: 'string' },
  },
};
