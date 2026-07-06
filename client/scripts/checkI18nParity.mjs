import fs from "node:fs";
import ts from "typescript";

const unwrap = (node) => {
  let current = node;

  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    (ts.isSatisfiesExpression?.(current) ?? false)
  ) {
    current = current.expression;
  }

  return current;
};

const propertyName = (sourceFile, property) => {
  if (
    ts.isIdentifier(property.name) ||
    ts.isStringLiteral(property.name) ||
    ts.isNumericLiteral(property.name)
  ) {
    return property.name.text;
  }

  return property.name.getText(sourceFile);
};

const findResourceRoot = (filePath, variableName) => {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let root;

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sourceFile) === variableName &&
      node.initializer
    ) {
      const initializer = unwrap(node.initializer);
      if (ts.isObjectLiteralExpression(initializer)) {
        root = initializer;
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (!root) {
    throw new Error(`Could not find ${variableName} object in ${filePath}.`);
  }

  return { root, sourceFile };
};

const collectKeys = (filePath, variableName) => {
  const { root, sourceFile } = findResourceRoot(filePath, variableName);
  const keys = [];

  const walk = (objectNode, prefix = "") => {
    for (const property of objectNode.properties) {
      if (!ts.isPropertyAssignment(property)) {
        continue;
      }

      const key = propertyName(sourceFile, property);
      const path = prefix ? `${prefix}.${key}` : key;
      keys.push(path);

      const initializer = unwrap(property.initializer);
      if (ts.isObjectLiteralExpression(initializer)) {
        walk(initializer, path);
      }
    }
  };

  walk(root);
  return keys.sort();
};

const enKeys = collectKeys("src/i18n/resources/en.ts", "en");
const viKeys = collectKeys("src/i18n/resources/vi.ts", "vi");
const enSet = new Set(enKeys);
const viSet = new Set(viKeys);
const missingInVi = enKeys.filter((key) => !viSet.has(key));
const missingInEn = viKeys.filter((key) => !enSet.has(key));

if (missingInVi.length || missingInEn.length) {
  console.error("EN/VI i18n key parity check failed.");
  console.error(JSON.stringify({ missingInVi, missingInEn }, null, 2));
  process.exit(1);
}

console.log(`EN/VI i18n key parity PASS (${enKeys.length} keys).`);
