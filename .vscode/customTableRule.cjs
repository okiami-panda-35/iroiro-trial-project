module.exports = {
  names: ["custom-table-format"],
  description: "AI用およびGit差分管理用のMarkdownテーブルのカスタムlintおよびformatルール。",
  tags: ["format", "markdown", "table"],
  parser: "markdownit",
  function: (params, onError) => {
    const tokens = params.parsers.markdownit.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === "table_open") {
        const tableOpen = tokens[i];
        // tableOpen.map は [startLine, endLine] (0-based)
        const tableLines = params.lines.slice(tableOpen.map[0], tableOpen.map[1]);

        // インデントを取得
        const firstLine = tableLines[0];
        const indentMatch = firstLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : "";

        const headerLine = tableLines[0];
        const separatorLine = tableLines[1];
        const bodyLines = tableLines.slice(2);

        // ヘッダーセルの数を取得
        const headerCells = headerLine.trim().split("|").slice(1, -1);
        const numColumns = headerCells.length;

        // 1. ヘッダー行のフォーマットチェックと修正
        const formattedHeaderCells = headerCells.map(cell => ` ${String(cell).trim()} `);
        const expectedHeaderLine = `${indent}|${formattedHeaderCells.join("|")}|`;

        if (headerLine !== expectedHeaderLine) {
          onError({
            lineNumber: tableOpen.map[0] + 1, // lineNumber は 1-based
            detail: "テーブルのヘッダ行のセルは、先頭および末尾に1つのみ半角スペースを設定してください。",
            context: headerLine,
            fixInfo: {
              lineNumber: tableOpen.map[0] + 1,
              editColumn: 1,
              deleteCount: headerLine.length,
              insertText: expectedHeaderLine,
            },
          });
        }

        // 2. 区切り行のフォーマットチェックと修正
        const expectedSeparator = `${indent}|${Array(numColumns).fill(" --- ").join("|")}|`;
        if (separatorLine !== expectedSeparator) {
          onError({
            lineNumber: tableOpen.map[0] + 2,
            detail: "テーブルの区切り行のセルは、先頭および末尾に1つのみ半角スペースを設定し、かつハイフンは3文字のみとしてください。",
            context: separatorLine,
            fixInfo: {
              lineNumber: tableOpen.map[0] + 2,
              editColumn: 1,
              deleteCount: separatorLine.length,
              insertText: expectedSeparator,
            },
          });
        }

        // 3. ボディ行のフォーマットチェックと修正
        bodyLines.forEach((line, index) => {
          const currentLineNumber = tableOpen.map[0] + 3 + index;
          if (!line || !line.includes("|")) {
              return;
          }
          const cells = line.trim().split("|").slice(1, -1);

          // ボディ行の列数がヘッダーと異なる場合はスキップ（GFMテーブルの仕様）
          if (cells.length !== numColumns) {
            return;
          }

          const formattedCells = cells.map(cell => ` ${String(cell).trim()} `);
          const expectedLine = `${indent}|${formattedCells.join("|")}|`;

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

        // 現在のテーブルの処理が終わったので、対応する table_close までインデックスを進める
        while (i < tokens.length && tokens[i].type !== "table_close") {
          i++;
        }
      }
    }
  },
};
