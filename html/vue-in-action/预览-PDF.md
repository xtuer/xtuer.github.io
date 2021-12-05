基于 [pdf.js](https://github.com/mozilla/pdf.js) 实现组件 `Pdf` 用于显示 PDF 文件，效果如下:

<img src="img/pdf.png" width=905>

准备工作 (更详细的信息请阅读[在线预览 PDF](https://qtdebug.com/pdf-online)):

1. 安装依赖: `yarn add pdfjs-dist`
2. 复制 `node_modules/pdfjs-dist/build/pdf.worker.min.js` 到项目的静态资源文件夹下，如 `public/static/lib/pdf.worker.min.js`
3. 访问 [CSS-Element-Queries](http://marcj.github.io/css-element-queries/)，下载得到 ResizeSensor.js，复制到项目的静态资源文件夹下，如 `public/static/lib/ResizeSensor.js`

## 显示 Pdf

```js
<template>
    <div class="about">
        <Pdf url="/static/nx.pdf"/>
    </div>
</template>

<script>
import Pdf from '@/components/Pdf.vue';

export default {
    components: { Pdf },
};
</script>
```

## 组件 Pdf

```js
<template>
    <div ref="container" class="pdf-viewer-container">
        <div ref="viewer" class="pdfViewer"></div>
    </div>
</template>

<script>
import 'pdfjs-dist/web/pdf_viewer.css';
import pdfjsLib from 'pdfjs-dist';
import { PDFViewer } from 'pdfjs-dist/web/pdf_viewer';

// 提示: 如果没有设置 workerSrc，大多数 PDF 都能正常显示，但是某些 PDF 中文字显示不出来
// 需要把 pdf.worker.min.js 放到项目的静态文件目录下
pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/lib/pdf.worker.min.js';

export default {
    props: {
        url: {
            type: String,
            required: true,
        }
    },
    data() {
        return {
            pdf: null,
        };
    },
    mounted() {
        Utils.loadJs('/static/lib/ResizeSensor.js').then(() => {
            this.init();
        });
    },
    methods: {
        init() {
            const pdfContainer = this.$refs.container;
            const pdfViewer = new PDFViewer({
                container: pdfContainer,
                viewer: this.$refs.viewer,
            });

            // PDF 的宽度为 container 的宽度
            pdfContainer.addEventListener('pagesinit', () => {
                pdfViewer.currentScaleValue = 'page-width'; // Change pdfViewer's default scale.
            });
            // eslint-disable-next-line
            new ResizeSensor(pdfContainer, () => {
                pdfViewer.currentScaleValue = 'page-width';
            });

            // Loading PDF document
            pdfjsLib.getDocument({ url: this.url, cMapPacked: true }).then(pdf => {
                this.pdf = pdf;
                pdfViewer.setDocument(pdf);
            });
        }
    },
    computed: {
        pageCount() {
            return this.pdf ? this.pdf.numPages : '0';
        }
    }
};
</script>

<style lang="scss">
.pdf-viewer-container {
    .pdfViewer {
        .page {
            border: none; // 去掉边框
            border-image: none;
            margin-bottom: 40px;

            // 显示页码
            // 每个 .page 上都有页码的属性 data-page-number="3", CSS 中可以通过 attr 读取这个属性
            &::after {
                position: relative;
                display: block;
                width: 100%;
                height: 40px;
                line-height: 40px;
                text-align: center;
                content: '第 ' attr(data-page-number) ' 页';
            }
        }
    }
}
</style>
```

> 注意: 考虑到只是会在某个或者某几个子页面里显示 Pdf，所以没有直接在 `${subpage}.html` 里面引用 ResizeSensor.js，而是使用前面介绍的动态加载 JS 技术加载 ResizeSensor.js。