如果把项目需要用到的所有 JS | CSS 都在 `${subpage}.html` 中引入，会导致首页加载太多暂时用不到的文件 (可以使用 defer async 进行优化)，导致首页加载慢不少。有些文件只是某个功能使用，其他地方都不会用到，在首页一次性加载没有必要，这样的文件可以在需要使用的时候动态加载，[用 RequireJS 统一管理 JS 和 CSS](https://www.qtdebug.com/fe-requirejs/) 是最专业的动态加载和管理 JS 与 CSS 的方式之一，但是如果只是为了简单的加载文件，没有必要引入 RequireJS (require.js 在 vue 项目中会遇到 define 函数被占用的问题)，我们自己实现了异步动态加载 JS 和 CSS:

* 加载  JS 文件: `Utils.loadJs` 
* 加载 CSS 文件: `Utils.loadCss` 

## 思路

资源加载是一个耗时操作，需要充分的考虑效率:

* 每个资源对应一个加载任务，任务有 4 中状态，根据状态判定加载的情况
* 使用 Promise 异步加载资源
* 同一资源的多次加载请求实际只执行一次加载，避免重复加载
* 资源加载请求者放到对应任务的请求队列中，资源加载完成后通知队列中的所有请求者 (调用 Promise 的 resolve 和 reject 函数)

## 实现

```js
/**
 * 异步加载 JS
 *
 * @param {String} url JS 的 URL
 * @param {String} id  JS <style> 的 ID，可选值，默认为 url 对应的文件名
 * @returns 返回 Promise
 */
Utils.loadJs = function(url, id) {
    return LoadTask.start(url, id, 'js');
};

/**
 * 异步加载 CSS
 *
 * @param {String} url CSS 的 URL
 * @param {String} id  CSS <link> 的 ID，可选值，默认为 url 对应的文件名
 * @returns 返回 Promise
 */
Utils.loadCss = function(url, id) {
    return LoadTask.start(url, id, 'css');
};

/**
 * 异步动态加载 JS 和 CSS 的任务类，如果同一个 ID 指定的资源已经加载过则不进行重复加载。
 */
class LoadTask {
    static STATE_INIT    = 0; // 初始化
    static STATE_LOADING = 1; // 加载中
    static STATE_SUCCESS = 2; // 加载成功
    static STATE_ERROR   = 3; // 加载失败

    /**
     * @param {String} url    JS 或者 CSS 的路径
     * @param {String} taskId 任务的 id
     */
    constructor(url, taskId) {
        this.id    = taskId;
        this.url   = url;
        this.state = LoadTask.STATE_INIT;
        this.queue = []; // 任务加载请求者队列，实际保存的是 Promise 的回调函数 { resolve, reject }
    }

    // 请求者入队
    add(requester) {
        this.queue.push(requester);
    }

    // 加载成功的回调函数
    loadSuccess() {
        this.state = LoadTask.STATE_SUCCESS;
        this.queue.forEach(p => p.resolve());
        this.queue = [];
    }

    // 加载失败的回调函数
    loadError() {
        this.state = LoadTask.STATE_ERROR;
        this.queue.forEach(p => p.reject());
        this.queue = [];
    }

    // 任务状态为初始化返回 true，否则返回 false
    isInit() {
        return this.state === LoadTask.STATE_INIT;
    }

    // 任务状态为加载中返回 true，否则返回 false
    isLoading() {
        return this.state === LoadTask.STATE_LOADING;
    }

    // 任务状态为加载成功返回 true，否则返回 false
    isSuccess() {
        return this.state === LoadTask.STATE_SUCCESS;
    }

    // 任务状态为加载失败返回 true，否则返回 false
    isError() {
        return this.state === LoadTask.STATE_ERROR;
    }

    /**
     * 开始加载
     *
     * @param {String} url  JS 或者 CSS 的 URL
     * @param {String} id   任务的 ID，同一个资源建议使用相同的 ID，避免重复加载
     * @param {String} type 加载类型，值为 'js' 或者 'css'
     * @returns 返回 Promise 对象，加载成功时回调它的 resolve 函数，失败时回调它的 reject 函数
     */
    static start(url, id, type) {
        // 1. 从全局的任务队列中获取 id 对应的任务，如果不存在则创建
        // 2. 开始加载，把任务的 Promise 加入任务的 queue，当加载完成后进行回调

        // [1] 从全局的任务队列中获取 id 对应的任务，如果不存在则创建
        window.loadingTasksMap = window.loadingTasksMap || new Map();
        const taskId = type + '-' + (id || Utils.getFilename(url)).replace(/\./g, '-'); // 替换名字中的 . 为 -，如: jquery.js 输出 jquery-js
        const task   = window.loadingTasksMap.get(taskId) || new LoadTask(url, taskId);
        window.loadingTasksMap.set(taskId, task);

        // [2] 开始加载，把任务的 Promise 加入任务的 queue，当加载完成后进行回调
        return new Promise((resolve, reject) => {
            task.add({ resolve, reject });
            task.doLoad(type);
        });
    }

    // 执行加载
    doLoad(type) {
        // 如果已经加载成功或者失败，调用相应的回调行数，加载中直接返回，避免重复加载
        if (this.isSuccess()) {
            this.loadSuccess();
            return;
        } else if (this.isError()) {
            this.loadError();
            return;
        } else if (this.isLoading()) {
            return;
        }

        // 初始化状态时开始加载
        this.state   = LoadTask.STATE_LOADING;
        const id     = this.id;
        const url    = this.url;
        const src    = url.includes('?') ? `${url}&_t=${id}` : `${url}?_t=${id}`;
        const source = document.createElement(type === 'js' ? 'script' : 'link');

        console.log('开始加载: ' + src);

        // 加载成功
        if (source.readyState) {
            // IE
            source.onreadystatechange = () => {
                if (source.readyState === 'loaded' || source.readyState === 'complete') {
                    source.onreadystatechange = null;
                    this.loadSuccess();
                    console.log('加载完成: ' + src);
                }
            };
        } else {
            // Other Browsers
            source.onload = () => {
                this.loadSuccess();
                console.log('加载完成: ' + src);
            };
        }

        // 加载失败
        source.onerror = () => {
            this.loadError();
            console.error('加载失败: ' + src);
        };

        if (type === 'js') {
            source.type = 'text/javascript';
            source.id   = id;
            source.src  = src;
            document.getElementsByTagName('head').item(0).appendChild(source);
        } else {
            source.rel  = 'stylesheet';
            source.id   = id;
            source.href = src;
            document.getElementsByTagName('head').item(0).appendChild(source);
        }
    }
}

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
```

## 测试

```js
// 懒加载 TinyMCE
Utils.loadJs('/static-p/lib/tinymce/tinymce.min.js').then(() => {
    this.initEditor();
});
```

```html
<template>
    <div class="about">
        <Button @click="load">Loading</Button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            js: 'http://cdn.bootcss.com/jquery/1.9.1/jquery.min.js',
            css: 'http://cdn.staticfile.org/layer/2.3/skin/layer.css',
        };
    },
    mounted() {
        // [1] 成功: 从服务器加载，因为是第一次加载
        Utils.loadJs(this.js).then(() => {
            console.log('Hi', Date.now());
        });

        // [2] 成功: 与上面是同一个资源 (id 相同)，不重复加载
        Utils.loadJs(this.js).then(() => {
            console.log('Go', Date.now());
        });

        // [3] 成功: 从服务器加载，因为是第一次加载
        Utils.loadCss(this.css).then(() => {
            console.log('To', Date.now());
        });
    },
    methods: {
        load() {
            // [4] 成功: 从服务器加载，因为 id 和已经加载的 js 不同
            // 当再次点击按钮加载时，不再从服务器加载，因为此 id 的资源已经存在
            Utils.loadJs(this.js, 'aloha').then(() => {
                console.log('js', Date.now());
            });

            // [5] 成功: 不重复加载
            Utils.loadCss(this.css).then(() => {
                console.log('css', Date.now());
            });

            // [6] 失败: 从服务器加载失败，因为 url 对应的资源不存在
            Utils.loadCss(this.css + 'x').then(() => {
                console.log('css', Date.now());
            }).catch(() => {
                console.log('Error...');
            });
        }
    }
};
</script>
```

