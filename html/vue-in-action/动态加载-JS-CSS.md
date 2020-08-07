如果把项目需要用到的所有 JS | CSS 都在 `${subpage}.html` 中引入，会导致首页加载太多暂时用不到的文件，导致首页加载慢不少。有些文件只是某个功能使用，其他地方都不会用到，在首页一次性加载了比较浪费，这样的文件可以在需要使用的时候动态加载，[用 RequireJS 统一管理 JS 和 CSS](https://www.qtdebug.com/fe-requirejs/) 是最专业的动态加载和管理 JS 与 CSS 的方式之一，但是如果只是为了简单的加载文件，没有必要引入 RequireJS，使用下面的这 2 个函数就可以了:

* `Utils.loadJs` 加载  JS 文件
* `Utils.loadCss` 加载 CSS 文件

```js
/**
 * 获取 URL 中的文件名，
 * 例如 https://www.qtdebug.com/vue-array.html 输出 vue-array.html
 *
 * @param {String} URL 连接
 * @return 返回 URL 的文件名
 */
Utils.getFilename = function(url) {
    var parser  = document.createElement('a');
    parser.href = url;
    const token = parser.pathname.split('/'); // 去掉参数等和文件名无关的部分
    const filename = token[token.length - 1];

    return filename;
};

/**
 * 使用 Promise 异步加载 JS
 *
 * @param  {String} url JS 的路径
 * @param  {String} id  JS 的 <style> 的 ID，如果已经存在则不再重复加载，默认为 JS 文件名
 * @return {Promise} 返回 Promise 对象, resolve 的参数为加载成功的信息 (无多大意义), reject 的参数为错误提示
 */
Utils.loadJs = function(url, id) {
    // 1. 有可能短时间内多次加载同一个 JS，为同一个 id 的 JS 定义一个任务，放入任务队列里
    // 2. 定时检查任务状态，加载结束时清楚定时器，执行对应的 promise 函数
    // 3. 如果是第一个加载任务则从服务器加载，否则返回

    // 加载状态
    var STATUS_LOADING = 1; // 加载中
    var STATUS_SUCCESS = 2; // 加载成功
    var STATUS_ERROR   = 3; // 加载失败

    id = id || Utils.getFilename(url);

    // [1] 有可能短时间内多次加载同一个 JS，为同一个 id 的 JS 定义一个任务，放入任务队列里
    window.jsLoadingTasks = window.jsLoadingTasks || [];      // 所有加载任务 { id, status: 1|2|3 }
    var task  = window.jsLoadingTasks.find(j => j.id === id); // 查找此 id 的任务
    var first = !task; // 是否第一次加载

    // 如果是第一次加载，则创建加载任务
    if (first) {
        task = { id, status: STATUS_LOADING };
        window.jsLoadingTasks.push(task);
    }

    return new Promise(function(resolve, reject) {
        // [2] 定时检查任务状态，加载结束时清楚定时器，执行对应的 promise 函数
        var timer = setInterval(() => {
            if (task.status === STATUS_LOADING) {
                return;
            }

            clearInterval(timer);

            if (task.status === STATUS_SUCCESS) {
                resolve('JS load success: ' + url);
            } else if (task.status === STATUS_ERROR) {
                reject(Error('JS load error: ' + url));
            }
        }, 100);

        // [3] 如果是第一个加载任务则从服务器加载，否则返回
        if (!first) {
            return;
        }

        var script = document.createElement('script');

        if (script.readyState) {  // IE
            script.onreadystatechange = function() {
                if (script.readyState === 'loaded' || script.readyState === 'complete') {
                    script.onreadystatechange = null;
                    task.status = STATUS_SUCCESS;
                }
            };
        } else {  // Other Browsers
            script.onload = function() {
                task.status = STATUS_SUCCESS;
            };
        }

        script.onerror = function() {
            window.dynamicLoading.delete(id);
            task.status = STATUS_ERROR;
        };

        script.type = 'text/javascript';
        script.id   = id;
        script.src  = `${url}?${id}`;
        document.getElementsByTagName('head').item(0).appendChild(script);
    });
};

/**
 * 异步加载 CSS
 *
 * @param  {String} url CSS 路径
 * @param  {String} id  CSS 的 <link> 的 ID，如果已经存在则不再重复加载，默认为 CSS 文件名
 * @return {Promise} 返回 Promise 对象, resolve 的参数为加载成功的信息 (无多大意义), reject 的参数为错误提示
 */
Utils.loadCss = function(url, id) {
    id = id || Utils.getFilename(url);

    // 不会短时间内重复加载同一个 CSS，所以不需要像加载 JS 那样使用任务队列检查加载状态
    return new Promise(function(resolve, reject) {
        // 避免重复加载
        if (document.getElementById(id)) {
            resolve('CSS load success: ' + url);
            return;
        }

        var link = document.createElement('link');

        if (link.readyState) {  // IE
            link.onreadystatechange = function() {
                if (link.readyState === 'loaded' || link.readyState === 'complete') {
                    link.onreadystatechange = null;
                    resolve('CSS load success: ' + url);
                }
            };
        } else {  // Other Browsers
            link.onload = function() {
                resolve('CSS load success: ' + url);
            };
        }

        link.onerror = function() {
            reject(Error('JS load error: ' + url));
        };

        link.rel  = 'stylesheet';
        link.id   = id;
        link.href = `${url}?hash=${id}`;
        document.getElementsByTagName('head').item(0).appendChild(link);
    });
};
```

案例:

```js
// 懒加载 TinyMCE
Utils.loadJs('/static-p/lib/tinymce/tinymce.min.js').then(() => {
    this.initEditor();
});
```

