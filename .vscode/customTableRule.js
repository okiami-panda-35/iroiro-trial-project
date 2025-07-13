module.exports = {
  names: ["custom-table-format"],
  description: "AI用およびGit差分管理用のMarkdownテーブルのカスタムlintおよびformatルール。",
  tags: ["format", "markdown", "table"],
  parser: "micromark",
  function: (params, onError) => {
    const tables = params.parsers.micromark.tokens.filter(
      (token) => token.type === "table"
    );

    for (const table of tables) {
      const tableLines = params.lines.slice(table.startLine - 1, table.endLine);
      const headerLine = tableLines[0];
      const separatorLine = tableLines[1];
      const bodyLines = tableLines.slice(2);

      // ヘッダーセルの数を取得
      const headerCells = headerLine.split("|").slice(1, -1);
      const numColumns = headerCells.length;

      // 1. ヘッダー行のフォーマットチェックと修正
      const formattedHeaderCells = headerCells.map(cell => ` ${String(cell).trim()} `);
      const expectedHeaderLine = `|${formattedHeaderCells.join("|")}|`;

      if (headerLine !== expectedHeaderLine) {
        onError({
          lineNumber: table.startLine,
          detail: "テーブルのヘッダ行のセルは、先頭および末尾に1つのみ半角スペースを設定してください。",
          context: headerLine,
          fixInfo: {
            lineNumber: table.startLine,
            editColumn: 1,
            deleteCount: headerLine.length,
            insertText: expectedHeaderLine,
          },
        });
      }

      // 2. 区切り行のフォーマットチェックと修正
      const expectedSeparator = `|${Array(numColumns).fill(" --- ").join("|")}|`;
      if (separatorLine !== expectedSeparator) {
        onError({
          lineNumber: table.startLine + 1,
          detail: "テーブルの区切り行のセルは、先頭および末尾に1つのみ半角スペースを設定し、かつハイフンは3文字のみとしてください。",
          context: separatorLine,
          fixInfo: {
            lineNumber: table.startLine + 1,
            editColumn: 1,
            deleteCount: separatorLine.length,
            insertText: expectedSeparator,
          },
        });
      }

      // 3. ボディ行のフォーマットチェックと修正
      bodyLines.forEach((line, index) => {
        const currentLineNumber = table.startLine + 2 + index;
        if (!line || !line.includes("|")) {
            return;
        }
        const cells = line.split("|").slice(1, -1);

        if (cells.length !== numColumns) {
          return;
        }

        const formattedCells = cells.map(cell => ` ${String(cell).trim()} `);
        const expectedLine = `|${formattedCells.join("|")}|`;

        if (line !== expectedLine) {
          onError({
            lineNumber: currentLineNumber,
            detail: "テーブルのボディ行のセルは、先頭および末尾に1つのみ半角スペースを設定してください。",
            context: line,
            fixInfo: {
              lineNumber: currentLineNumber,
              editColumn: 1,
              deleteCount: line.length,
              insertText: expectedLine,
            },
          });
        }
      });
    }
  },
};
