import fs from "node:fs";
import path from "node:path";
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
      const nextPath = prefix ? `${prefix}.${key}` : key;
      keys.push(nextPath);

      const initializer = unwrap(property.initializer);
      if (ts.isObjectLiteralExpression(initializer)) {
        walk(initializer, nextPath);
      }
    }
  };

  walk(root);
  return new Set(keys);
};

const scanFile = (filePath, knownKeys, missingKeys) => {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) === "t" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const key = node.arguments[0].text;

      if (!knownKeys.has(key)) {
        missingKeys.add(`${key} @ ${filePath}`);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
};

const scanDirectory = (directory, knownKeys, missingKeys) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, knownKeys, missingKeys);
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      scanFile(fullPath, knownKeys, missingKeys);
    }
  }
};

const enKeys = collectKeys("src/i18n/resources/en.ts", "en");
const viKeys = collectKeys("src/i18n/resources/vi.ts", "vi");
const missingKeys = new Set();

scanDirectory("src", enKeys, missingKeys);

const missingInVi = [...missingKeys]
  .map((entry) => entry.split(" @ ")[0])
  .filter((key) => !viKeys.has(key));

for (const key of missingInVi) {
  missingKeys.add(`${key} @ vi resources`);
}

if (missingKeys.size) {
  console.error("Static i18n key usage check failed.");
  console.error([...missingKeys].sort().join("\n"));
  process.exit(1);
}

console.log("Static i18n key usage check PASS.");
