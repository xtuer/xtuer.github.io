使用 VS Code 的编辑器 Monaco Editor 实现语法高亮、输入自动提示的编辑器。自动提示内容包括:

* SQL 关键字
* SQL 运算符
* SQL 内置函数
* 表名: 创建编辑器的时候从服务器异步加载表名
* 列名: 表名后面输入 `.` 弹出提示框，内容为此表的列名，第一次提示时从服务器异步加载
* 基于用户已经输入的内容

文中主要介绍:

* 页面中直接使用 Monaco Editor
* Webpack 中使用 Monaco Editor
* SQL Editor 实现，使用的文件有
  * sql.js
  * dbmetamoc.js
  * SqlEditor.vue
* 常用 API

## 页面中直接使用 Monaco Editor
使用 `<script>` 引入 Monaco Editor 参考 <https://github.com/microsoft/monaco-editor/blob/main/samples/browser-script-editor/index.html>:
1. 随意创建一个目录，在其中执行 `yarn add monaco-editor` 下载 Monaco
2. 把 `node_modules/monaco-editor` 复制到项目的静态文件的目录中，例如访问路径为 `/static-p/lib/monaco-editor/...`
3. 在页面的 html 中引入相关的 css 和 js:
   ```html
    <head>
    <meta charset="utf-8">
   
    <link rel="stylesheet"
          data-name="vs/editor/editor.main"
          href="/static-p/lib/monaco-editor/min/vs/editor/editor.main.css"
    />
    </head>
    
    <script src="/static-p/lib/monaco-editor/min/vs/loader.js"></script>
    <script src="/static-p/lib/monaco-editor/min/vs/editor/editor.main.nls.js"></script>
    <script src="/static-p/lib/monaco-editor/min/vs/editor/editor.main.js"></script>
    <script src="/static-p/lib/monaco-editor/min/vs/basic-languages/sql/sql.js"></script> <!-- 需要使用的语言 -->
   ```
4. 创建 editor 的 element: `<div id="container" style="height: 400px; border: 1px solid #ddd; margin-top: 10px;"></div>`
5. 创建 editor:
   ```js
        // 此部分可选，没有的话控制台会报错，但仍然可以使用
        let base = let base = window.location.origin; // 例如 http://localhost:8888
        let proxy = URL.createObjectURL(new Blob([`
            self.MonacoEnvironment = {
                baseUrl: '${base}/static-p/lib/monaco-editor/min'
            };
            importScripts('${base}/static-p/lib/monaco-editor/min/vs/base/worker/workerMain.js');
        `], { type: 'text/javascript' }));
        window.MonacoEnvironment = { getWorkerUrl: () => proxy };
        
        // 创建 editor
        this.editor = monaco.editor.create(document.getElementById('container'), {
            value: ['select * from user where id > 10;'].join('\n'),
            language: 'sql',
            scrolLBeyondLastLine: false,
            minimap: {
                enabled: false // 编辑器右侧的缩略图
            }
        });
   
        // 监听内容变化
        this.editor.onDidChangeModelContent(() => {
            console.log(this.editor.getValue()); // Debounce 保存到 LocalStorage
        });
   ```

## Webpack 中使用 Monaco Editor
Vue2 不支持最新的 Monaco Editor，版本要求:
* `"monaco-editor": "0.30.1"`
* `"monaco-editor-webpack-plugin": "6.0.0"`

然后参考 [vue2.x 中 monaco-editor 的使用](https://blog.csdn.net/qq_38157825/article/details/124158538)。

## 自动提示
```js
monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: function(model, position) {
        // [1] 取消自动提示
        return null;

        // [2] 自动提示内容
        return {
            [
                { label: xxx, insertText: xxx, kind: monaco.languages.CompletionItemKind.Keyword },
            ]
        };
    }
```

## sql.js

主要内容为 SQL 的关键字、运算符、内置函数等，用于自动补全提示。

```js
const keywords = ['ABORT', 'ABSOLUTE', 'ACTION', 'ADA', 'ADD', 'AFTER', 'ALL', 'ALLOCATE', 'ALTER', 'ALWAYS', 'ANALYZE', 'ARE', 'AS', 'ASC', 'ASSERTION', 'AT', 'ATTACH', 'AUTHORIZATION', 'AUTOINCREMENT', 'AVG', 'BACKUP', 'BEFORE', 'BEGIN', 'BIT', 'BIT_LENGTH', 'BOTH', 'BREAK', 'BROWSE', 'BULK', 'BY', 'CASCADE', 'CASCADED', 'CASE', 'CAST', 'CATALOG', 'CHAR', 'CHARACTER', 'CHARACTER_LENGTH', 'CHAR_LENGTH', 'CHECK', 'CHECKPOINT', 'CLOSE', 'CLUSTERED', 'COALESCE', 'COLLATE', 'COLLATION', 'COLUMN', 'COMMIT', 'COMPUTE', 'CONFLICT', 'CONNECT', 'CONNECTION', 'CONSTRAINT', 'CONSTRAINTS', 'CONTAINSTABLE', 'CONTINUE', 'CONVERT', 'CORRESPONDING', 'COUNT', 'CREATE', 'CURRENT', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR', 'DATABASE', 'DATE', 'DAY', 'DBCC', 'DEALLOCATE', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFERRABLE', 'DEFERRED', 'DELETE', 'DENY', 'DESC', 'DESCRIBE', 'DESCRIPTOR', 'DETACH', 'DIAGNOSTICS', 'DISCONNECT', 'DISK', 'DISTINCT', 'DISTRIBUTED', 'DO', 'DOMAIN', 'DOUBLE', 'DROP', 'DUMP', 'EACH', 'ELSE', 'END', 'END-EXEC', 'ERRLVL', 'ESCAPE', 'EXCEPTION', 'EXCLUDE', 'EXCLUSIVE', 'EXEC', 'EXECUTE', 'EXIT', 'EXPLAIN', 'EXTERNAL', 'EXTRACT', 'FAIL', 'FALSE', 'FETCH', 'FILE', 'FILLFACTOR', 'FILTER', 'FIRST', 'FLOAT', 'FOLLOWING', 'FOR', 'FOREIGN', 'FORTRAN', 'FOUND', 'FREETEXTTABLE', 'FROM', 'FUNCTION', 'GENERATED', 'GET', 'GLOB', 'GLOBAL', 'GO', 'GOTO', 'GRANT', 'GROUP', 'GROUPS', 'HAVING', 'HOLDLOCK', 'HOUR', 'IDENTITY', 'IDENTITYCOL', 'IDENTITY_INSERT', 'IF', 'IGNORE', 'IMMEDIATE', 'INCLUDE', 'INDEX', 'INDEXED', 'INDICATOR', 'INITIALLY', 'INPUT', 'INSENSITIVE', 'INSERT', 'INSTEAD', 'INT', 'INTEGER', 'INTERVAL', 'INTO', 'ISNULL', 'ISOLATION', 'KEY', 'KILL', 'LANGUAGE', 'LAST', 'LEADING', 'LEVEL', 'LIMIT', 'LINENO', 'LOAD', 'LOCAL', 'LOWER', 'MATCH', 'MATERIALIZED', 'MAX', 'MERGE', 'MIN', 'MINUTE', 'MODULE', 'MONTH', 'NAMES', 'NATIONAL', 'NATURAL', 'NCHAR', 'NEXT', 'NO', 'NOCHECK', 'NONCLUSTERED', 'NONE', 'NOTHING', 'NOTNULL', 'NULLIF', 'NULLS', 'NUMERIC', 'OCTET_LENGTH', 'OF', 'OFF', 'OFFSET', 'OFFSETS', 'ON', 'ONLY', 'OPEN', 'OPENDATASOURCE', 'OPENQUERY', 'OPENROWSET', 'OPENXML', 'OPTION', 'ORDER', 'OTHERS', 'OUTPUT', 'OVER', 'OVERLAPS', 'PAD', 'PARTIAL', 'PARTITION', 'PASCAL', 'PERCENT', 'PLAN', 'POSITION', 'PRAGMA', 'PRECEDING', 'PRECISION', 'PREPARE', 'PRESERVE', 'PRIMARY', 'PRINT', 'PRIOR', 'PRIVILEGES', 'PROC', 'PROCEDURE', 'PUBLIC', 'QUERY', 'RAISE', 'RAISERROR', 'RANGE', 'READ', 'READTEXT', 'REAL', 'RECONFIGURE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELATIVE', 'RELEASE', 'RENAME', 'REPLACE', 'REPLICATION', 'RESTORE', 'RESTRICT', 'RETURN', 'RETURNING', 'REVERT', 'REVOKE', 'ROLLBACK', 'ROW', 'ROWCOUNT', 'ROWGUIDCOL', 'ROWS', 'RULE', 'SAVE', 'SAVEPOINT', 'SCHEMA', 'SCROLL', 'SECOND', 'SECTION', 'SECURITYAUDIT', 'SELECT', 'SEMANTICKEYPHRASETABLE', 'SEMANTICSIMILARITYDETAILSTABLE', 'SEMANTICSIMILARITYTABLE', 'SESSION', 'SESSION_USER', 'SET', 'SETUSER', 'SHUTDOWN', 'SIZE', 'SMALLINT', 'SPACE', 'SQL', 'SQLCA', 'SQLCODE', 'SQLERROR', 'SQLSTATE', 'SQLWARNING', 'STATISTICS', 'SUBSTRING', 'SUM', 'SYSTEM_USER', 'TABLE', 'TABLESAMPLE', 'TEMP', 'TEMPORARY', 'TEXTSIZE', 'THEN', 'TIES', 'TIME', 'TIMESTAMP', 'TIMEZONE_HOUR', 'TIMEZONE_MINUTE', 'TO', 'TOP', 'TRAILING', 'TRAN', 'TRANSACTION', 'TRANSLATE', 'TRANSLATION', 'TRIGGER', 'TRIM', 'TRUE', 'TRUNCATE', 'TRY_CONVERT', 'TSEQUAL', 'UNBOUNDED', 'UNIQUE', 'UNKNOWN', 'UPDATE', 'UPDATETEXT', 'UPPER', 'USAGE', 'USE', 'USER', 'USING', 'VACUUM', 'VALUE', 'VALUES', 'VARCHAR', 'VARYING', 'VIEW', 'VIRTUAL', 'WAITFOR', 'WHEN', 'WHENEVER', 'WHERE', 'WHILE', 'WINDOW', 'WITH', 'WITHIN GROUP', 'WITHOUT', 'WORK', 'WRITE', 'WRITETEXT', 'YEAR', 'ZONE', 'BIGINT', 'NUMBER'];
const operators = ['ALL', 'AND', 'ANY', 'BETWEEN', 'EXISTS', 'IN', 'LIKE', 'NOT', 'OR', 'SOME', 'EXCEPT', 'INTERSECT', 'UNION', 'APPLY', 'CROSS', 'FULL', 'INNER', 'JOIN', 'LEFT', 'OUTER', 'RIGHT', 'CONTAINS', 'FREETEXT', 'IS', 'NULL', 'PIVOT', 'UNPIVOT', 'MATCHED'];
const builtinFunctions = ['AVG', 'CHECKSUM_AGG', 'COUNT', 'COUNT_BIG', 'GROUPING', 'GROUPING_ID', 'MAX', 'MIN', 'SUM', 'STDEV', 'STDEVP', 'VAR', 'VARP', 'CUME_DIST', 'FIRST_VALUE', 'LAG', 'LAST_VALUE', 'LEAD', 'PERCENTILE_CONT', 'PERCENTILE_DISC', 'PERCENT_RANK', 'COLLATE', 'COLLATIONPROPERTY', 'TERTIARY_WEIGHTS', 'FEDERATION_FILTERING_VALUE', 'CAST', 'CONVERT', 'PARSE', 'TRY_CAST', 'TRY_CONVERT', 'TRY_PARSE', 'ASYMKEY_ID', 'ASYMKEYPROPERTY', 'CERTPROPERTY', 'CERT_ID', 'CRYPT_GEN_RANDOM', 'DECRYPTBYASYMKEY', 'DECRYPTBYCERT', 'DECRYPTBYKEY', 'DECRYPTBYKEYAUTOASYMKEY', 'DECRYPTBYKEYAUTOCERT', 'DECRYPTBYPASSPHRASE', 'ENCRYPTBYASYMKEY', 'ENCRYPTBYCERT', 'ENCRYPTBYKEY', 'ENCRYPTBYPASSPHRASE', 'HASHBYTES', 'IS_OBJECTSIGNED', 'KEY_GUID', 'KEY_ID', 'KEY_NAME', 'SIGNBYASYMKEY', 'SIGNBYCERT', 'SYMKEYPROPERTY', 'VERIFYSIGNEDBYCERT', 'VERIFYSIGNEDBYASYMKEY', 'CURSOR_STATUS', 'DATALENGTH', 'IDENT_CURRENT', 'IDENT_INCR', 'IDENT_SEED', 'IDENTITY', 'SQL_VARIANT_PROPERTY', 'CURRENT_TIMESTAMP', 'DATEADD', 'DATEDIFF', 'DATEFROMPARTS', 'DATENAME', 'DATEPART', 'DATETIME2FROMPARTS', 'DATETIMEFROMPARTS', 'DATETIMEOFFSETFROMPARTS', 'DAY', 'EOMONTH', 'GETDATE', 'GETUTCDATE', 'ISDATE', 'MONTH', 'SMALLDATETIMEFROMPARTS', 'SWITCHOFFSET', 'SYSDATETIME', 'SYSDATETIMEOFFSET', 'SYSUTCDATETIME', 'TIMEFROMPARTS', 'TODATETIMEOFFSET', 'YEAR', 'CHOOSE', 'COALESCE', 'IIF', 'NULLIF', 'ABS', 'ACOS', 'ASIN', 'ATAN', 'ATN2', 'CEILING', 'COS', 'COT', 'DEGREES', 'EXP', 'FLOOR', 'LOG', 'LOG10', 'PI', 'POWER', 'RADIANS', 'RAND', 'ROUND', 'SIGN', 'SIN', 'SQRT', 'SQUARE', 'TAN', 'APP_NAME', 'APPLOCK_MODE', 'APPLOCK_TEST', 'ASSEMBLYPROPERTY', 'COL_LENGTH', 'COL_NAME', 'COLUMNPROPERTY', 'DATABASE_PRINCIPAL_ID', 'DATABASEPROPERTYEX', 'DB_ID', 'DB_NAME', 'FILE_ID', 'FILE_IDEX', 'FILE_NAME', 'FILEGROUP_ID', 'FILEGROUP_NAME', 'FILEGROUPPROPERTY', 'FILEPROPERTY', 'FULLTEXTCATALOGPROPERTY', 'FULLTEXTSERVICEPROPERTY', 'INDEX_COL', 'INDEXKEY_PROPERTY', 'INDEXPROPERTY', 'OBJECT_DEFINITION', 'OBJECT_ID', 'OBJECT_NAME', 'OBJECT_SCHEMA_NAME', 'OBJECTPROPERTY', 'OBJECTPROPERTYEX', 'ORIGINAL_DB_NAME', 'PARSENAME', 'SCHEMA_ID', 'SCHEMA_NAME', 'SCOPE_IDENTITY', 'SERVERPROPERTY', 'STATS_DATE', 'TYPE_ID', 'TYPE_NAME', 'TYPEPROPERTY', 'DENSE_RANK', 'NTILE', 'RANK', 'ROW_NUMBER', 'PUBLISHINGSERVERNAME', 'OPENDATASOURCE', 'OPENQUERY', 'OPENROWSET', 'OPENXML', 'CERTENCODED', 'CERTPRIVATEKEY', 'CURRENT_USER', 'HAS_DBACCESS', 'HAS_PERMS_BY_NAME', 'IS_MEMBER', 'IS_ROLEMEMBER', 'IS_SRVROLEMEMBER', 'LOGINPROPERTY', 'ORIGINAL_LOGIN', 'PERMISSIONS', 'PWDENCRYPT', 'PWDCOMPARE', 'SESSION_USER', 'SESSIONPROPERTY', 'SUSER_ID', 'SUSER_NAME', 'SUSER_SID', 'SUSER_SNAME', 'SYSTEM_USER', 'USER', 'USER_ID', 'USER_NAME', 'ASCII', 'CHAR', 'CHARINDEX', 'CONCAT', 'DIFFERENCE', 'FORMAT', 'LEFT', 'LEN', 'LOWER', 'LTRIM', 'NCHAR', 'PATINDEX', 'QUOTENAME', 'REPLACE', 'REPLICATE', 'REVERSE', 'RIGHT', 'RTRIM', 'SOUNDEX', 'SPACE', 'STR', 'STUFF', 'SUBSTRING', 'UNICODE', 'UPPER', 'BINARY_CHECKSUM', 'CHECKSUM', 'CONNECTIONPROPERTY', 'CONTEXT_INFO', 'CURRENT_REQUEST_ID', 'ERROR_LINE', 'ERROR_NUMBER', 'ERROR_MESSAGE', 'ERROR_PROCEDURE', 'ERROR_SEVERITY', 'ERROR_STATE', 'FORMATMESSAGE', 'GETANSINULL', 'GET_FILESTREAM_TRANSACTION_CONTEXT', 'HOST_ID', 'HOST_NAME', 'ISNULL', 'ISNUMERIC', 'MIN_ACTIVE_ROWVERSION', 'NEWID', 'NEWSEQUENTIALID', 'ROWCOUNT_BIG', 'XACT_STATE', 'TEXTPTR', 'TEXTVALID', 'COLUMNS_UPDATED', 'EVENTDATA', 'TRIGGER_NESTLEVEL', 'UPDATE', 'CHANGETABLE', 'CHANGE_TRACKING_CONTEXT', 'CHANGE_TRACKING_CURRENT_VERSION', 'CHANGE_TRACKING_IS_COLUMN_IN_MASK', 'CHANGE_TRACKING_MIN_VALID_VERSION', 'CONTAINSTABLE', 'FREETEXTTABLE', 'SEMANTICKEYPHRASETABLE', 'SEMANTICSIMILARITYDETAILSTABLE', 'SEMANTICSIMILARITYTABLE', 'FILETABLEROOTPATH', 'GETFILENAMESPACEPATH', 'GETPATHLOCATOR', 'PATHNAME', 'GET_TRANSMISSION_STATUS'];

// 所有关键字
const ALL_TOKENS = [...keywords, ...operators, ...builtinFunctions];

export default {
    keywords,
    operators,
    builtinFunctions,
    ALL_TOKENS,
};
```

## dbmetamoc.js

内容为模拟数据库的表信息，在开发的时候不直接取数据库查询，而是使用模拟的数据方便开发。

```js
const tableMeta = [
    {
        tableName: 'user',
        columns: ['id', 'username', 'password', 'email', 'age', 'create_at'],
    },
    {
        tableName: 'role',
        columns: ['name', 'label', 'value'],
    },
    {
        tableName: 'customer',
        columns: ['customer_id', 'customer_sn', 'name', 'region', 'remark']
    },
    {
        tableName: 'stock',
        columns: ['product_item_id', 'batch', 'count', 'created_at', 'updated_at'],
    }
];

export default {
    tableMeta,
};
```

## SQL Editor

```html
<template>
    <div class="sql-editor">
        <div id="container" style="height: 400px; border: 1px solid #ddd; margin-top: 10px;"></div>
    </div>
</template>

<script>

import SQL from './sql'; // SQL 关键字等
import DBMeta from './dbmeta-moc'; // 表的数据，开发使用

// 获取文本中的所有单词
function getTokens(code) {
    let identifier = /[a-zA-Z_]\w+/g; // 单词的正则
    let tokens = [];
    let array;

    // eslint-disable-next-line no-cond-assign
    while ((array = identifier.exec(code)) !== null) {
        tokens.push(array[0]);
    }

    return tokens;
}

export default {
    data() {
        return {
            editor: null,

            // 数据库表的元数据 Map
            //   key: table name
            //   Value: { columns: ['col1', 'col2', 'col3'], state: 0|1|2 }，其中 state 为 0 表示未初始化，1 加载中，2 已加载
            tableMetaMap: new Map(),
        };
    },
    mounted() {
        this.loadTableNames();
        this.createEditor();
    },
    beforeDestroy() {
        this.editor.dispose();
    },
    methods: {
        // 加载数据库当前 schema 的所有表名
        loadTableNames() {
            setTimeout(() => {
                for (let tm of DBMeta.tableMeta) {
                    this.tableMetaMap.set(tm.tableName, { columns: [], state: 0 });
                }
            }, 200);
        },
        // 加载表的列，返回 Promise
        loadTableColumns(tableName) {
            return new Promise((resolve, reject) => {
                // 模拟从服务器加载列名，加载完成后标记为已加载状态
                setTimeout(() => {
                    for (let tm of DBMeta.tableMeta) {
                        if (tm.tableName === tableName) {
                            let meta = this.tableMetaMap.get(tableName);

                            if (meta) {
                                meta.columns = [...tm.columns];
                                meta.state = 2; // 标记为已加载
                            } else {
                                this.tableMetaMap.set(tableName, { columns: ['表不存在'], state: 2 });
                            }

                            resolve();
                            break;
                        }
                    }
                }, 500);
            });
        },
        // 创建编辑器
        createEditor() {
            // [可选]
            let base = window.location.origin; // 例如 http://localhost:8888
            let proxy = URL.createObjectURL(new Blob([`
                self.MonacoEnvironment = {
                    baseUrl: '${base}/static-p/lib/monaco-editor/min'
                };
                importScripts('${base}/static-p/lib/monaco-editor/min/vs/base/worker/workerMain.js');
            `], { type: 'text/javascript' }));
            window.MonacoEnvironment = { getWorkerUrl: () => proxy };

            // 创建编辑器对象
            this.editor = monaco.editor.create(document.getElementById('container'), {
                value: ['select * from user where id > 10;\n\n'].join('\n'), // 初始时编辑器的内容
                language: 'sql',
                scrolLBeyondLastLine: false,
                fontSize: 16,
                minimap: {
                    enabled: false // 编辑器右侧的缩略图
                }
            });

            // 监听内容变化: 可使用 debounce 进行自动保存到 local storage，用于后续恢复编辑器内容
            this.editor.onDidChangeModelContent(() => {
                // console.log(this.editor.getValue());
            });

            const self = this;

            // 自动补全提示
            monaco.languages.registerCompletionItemProvider('sql', {
                provideCompletionItems: function(model, position) {
                    /*
                     自动补全提示逻辑:
                     1. 获取触发自动提示的文本
                     2. 触发的文本不为空则说明是普通的触发，自动提示的内容为:
                        2.1 SQL 内置关键字、运算符、函数
                        2.2 已经输入的内容
                        2.3 表名
                     3. 触发的文本为空则说明是由 triggerCharacters 指定的字符触发的自动补全，也即 '.'，自动提示为表的列
                        3.1 取光标处 . 前面的单词，即表名
                        3.2 查找表的信息，不存在则返回
                        3.3 获取表的列:
                            3.3.1 未加载，提示加载中，并加载表的列，加载完成后再次触发自动提示
                            3.3.2 加载中，提示加载中
                            3.3.3 已加载，自动提示为表的列
                     */

                    // [1] 获取触发自动提示的文本
                    var word = model.getWordUntilPosition(position);
                    let triggerText = word.word;

                    if (triggerText) {
                        // [2] 触发的文本不为空则说明是普通的触发，自动提示的内容为
                        let tokens = [];
                        let suggestions = []; // 自定义的补全内容

                        // [2.1] SQL 内置关键字、运算符、函数
                        tokens.push(...SQL.ALL_TOKENS);

                        // [2.2] 用于已经输入的内容
                        tokens.push(...getTokens(model.getValue()));

                        // [2.3] 表名
                        tokens.push(...self.tableMetaMap.keys());

                        // 去重，创建提示列表 (Editor 会从提示列表里进行过滤，下拉提示中只显示需要的)
                        tokens = Array.from(new Set(tokens));

                        for (let token of tokens) {
                            suggestions.push({
                                label: token,
                                insertText: token,
                                kind: monaco.languages.CompletionItemKind.Keyword,
                            });
                        }

                        return {
                            suggestions
                        };
                    }

                    // [3] 触发的文本为空则说明是由 triggerCharacters 指定的字符触发的自动补全，也即 '.'，自动提示为表的列
                    // [3.1] 取光标处 . 前面的单词，即表名
                    let tableName = model.getWordUntilPosition({ lineNumber: position.lineNumber, column: position.column - 1 }).word;
                    let meta = self.tableMetaMap.get(tableName);
                    console.log('表名: ' + tableName);

                    if (!meta) {
                        return null;
                    }

                    const loadingSuggestions = [{ label: '加载中...', insertText: '', kind: monaco.languages.CompletionItemKind.Function }];

                    if (meta.state === 0) {
                        // [3.3.1] 未加载，提示加载中，并加载表的列，加载完成后再次触发自动提示
                        self.loadTableColumns(tableName).then(() => {
                            self.editor.trigger('anything', 'editor.action.triggerSuggest', {});
                        });

                        return { suggestions: loadingSuggestions };
                    } else if (meta.state === 1) {
                        // [3.3.2] 加载中，提示加载中
                        return { suggestions: loadingSuggestions };
                    } else if (meta.state === 2) {
                        // [3.3.3] 已加载，自动提示为表的列
                        const tableColumnSuggestions = [];

                        for (let column of meta.columns) {
                            tableColumnSuggestions.push({
                                label: column,
                                insertText: column,
                                kind: monaco.languages.CompletionItemKind.Keyword,
                            });
                        }

                        return { suggestions: tableColumnSuggestions };
                    } else {
                        return null;
                    }
                },
                triggerCharacters: ['.'], // 按下 . 后触发自动补全提示
            });
        },
        format() {
            this.editor.getAction(['editor.action.formatDocument']).run();
        }
    }
};
</script>

<style lang="scss">

</style>
```

## 常用 API
```js
editor.getModel();
model.getValue(); // 输入框内容
model.getLineContent(line); // 获取当前输入行的所有内容
model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
model.getWordUntilPosition({ lineNumber: position.lineNumber, column: position.column - 1 }); // 光标处的单词
model.getWordAtPosition(...);

// 销毁编辑器
editor.dispose();

// 格式化
editor.getAction(['editor.action.formatDocument']).run() 

// 弹出补全提示框
editor.trigger('anything', 'editor.action.triggerSuggest', {});
```