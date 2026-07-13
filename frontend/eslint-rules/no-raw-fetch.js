// Local eslint rule enforcing the dedup law (spec 04.2 / 02.2): all server
// calls go through the single typed api/client.ts; a bare fetch() call
// anywhere else is an error.

/** @type {import('eslint').Rule.RuleModule} */
export const noRawFetch = {
  meta: {
    type: 'problem',
    docs: {
      description: 'ban raw fetch() outside src/api/client.ts (spec 02.2/04.2)',
    },
    schema: [],
    messages: {
      fetch:
        'Raw fetch() is banned outside src/api/client.ts -- add a typed hook to the api layer instead.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          context.report({ node, messageId: 'fetch' });
        }
      },
    };
  },
};

export default { rules: { 'no-raw-fetch': noRawFetch } };
