import glslx from 'glslx';

const code = `
uniform sampler2D texture;
uniform vec4 color;
attribute vec2 position;
varying vec2 coord;;

export void vertex() {
  coord = position;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}

export void colorFragment() {
  gl_FragColor = color;
}

export void textureFragment() {
  gl_FragColor = texture2D(texture, coord);
}
`;

console.log(glslx.compileIDE(code).diagnostics)

export default {
  meta: {
    docs: {
      description: 'Ensure cross-browser API compatibility',
      category: 'Compatibility',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context: Context): ESLint {
    // Determine lowest targets from browserslist config, which reads user's
    // package.json config section. Use config from eslintrc for testing purposes
    const browserslistConfig: BrowserListConfig =
      context.settings.browsers ||
      context.settings.targets;

    const browserslistTargets = Versioning(DetermineTargetsFromConfig(browserslistConfig));

    function lint(node: ESLintNode) {
      const { isValid, rule, unsupportedTargets } = Lint(
        node,
        browserslistTargets,
        context.settings.polyfills
          ? new Set(context.settings.polyfills)
          : undefined
      );

      if (!isValid) {
        context.report({
          node,
          message: [
            generateErrorName(rule),
            'is not supported in',
            unsupportedTargets.join(', ')
          ].join(' ')
        });
      }
    }

    return {
      // HACK: Ideally, rules will be generated at runtime. Each rule will have
      //       have the ability to register itself to run on specific AST
      //       nodes. For now, we're using the `CallExpression` node since
      //       its what most rules will run on
      CallExpression: lint,
      MemberExpression: lint,
      NewExpression: lint
    };
  }
};
