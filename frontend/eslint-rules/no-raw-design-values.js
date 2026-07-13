// Local eslint rule enforcing the token law (spec 03.4): a raw hex color or
// raw px numeric literal in component code (.tsx/.ts, excluding the token
// source itself and generated files) is an error. Values must flow through
// CSS variables (var(--graphite-...)) sourced from src/tokens/tokens.ts.

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const PX_RE = /^-?\d+(\.\d+)?px$/;

/** @type {import('eslint').Rule.RuleModule} */
export const noRawDesignValues = {
  meta: {
    type: 'problem',
    docs: {
      description: 'ban raw hex colors and raw px literals outside the token source (spec 03.4)',
    },
    schema: [],
    messages: {
      hex: 'Raw hex color literal "{{value}}" is banned -- add/use a token in src/tokens/tokens.ts and reference it via a CSS variable instead.',
      px: 'Raw px literal "{{value}}" is banned -- use a spacing/size token from src/tokens/tokens.ts instead.',
    },
  },
  create(context) {
    function checkLiteral(node, raw) {
      if (typeof raw !== 'string') return;
      if (HEX_RE.test(raw)) {
        context.report({ node, messageId: 'hex', data: { value: raw } });
        return;
      }
      if (PX_RE.test(raw.trim())) {
        context.report({ node, messageId: 'px', data: { value: raw } });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string') checkLiteral(node, node.value);
      },
      TemplateElement(node) {
        checkLiteral(node, node.value.raw);
      },
    };
  },
};

export default { rules: { 'no-raw-design-values': noRawDesignValues } };
