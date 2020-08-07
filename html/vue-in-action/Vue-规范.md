## 代码缩进

代码缩进使用 4 个空格，元素使用多行显示时，第一个属性显示在第一行，其他属性换行并与第一个属性对齐或者使用 8 个空格缩进。

正例：

```js
<PaperModelEditAttribute v-show="step===1" 
                         ref="paperModelEditAttribute" 
                         :paperModel="paperModel">
    <span>Hello</span>
</PaperModelEditAttribute>

<PaperModelEditAttribute v-show="step===1" 
        ref="paperModelEditAttribute" 
        :paperModel="paperModel">
    <span>Hello</span>
</PaperModelEditAttribute>
```

反例：

```js
<PaperModelEditAttribute 
    v-show="step===1" 
    ref="paperModelEditAttribute" 
    :paperModel="paperModel">
    <span>Hello</span>
</PaperModelEditAttribute>

<PaperModelEditAttribute 
    v-show="step===1" 
    ref="paperModelEditAttribute" 
    :paperModel="paperModel"
>
    <span>Hello</span>
</PaperModelEditAttribute>
```

## 文件夹名

文件夹的名字由多个单词组成时，单词小写，单词间使用 `-` 分割，例如下面的文件夹名 `paper-model`:

```js
.
├── Questions.vue
└── paper-model
    ├── PaperModelEdit.vue
    ├── PaperModelEditAttribute.vue
    ├── PaperModelEditInner.vue
    ├── PaperModelEditInnerQuestion.vue
    ├── PaperModelEditOutter.vue
    └── PaperModels.vue
```

## 自定义组件

大多时候都需要开发自定义组件，注意以下规范:

* 尽量根据功能独立为组件，单独保存为文件，尤其是在复杂的设计中分模块尤其重要
* 组件文件名使用驼峰命名规则 (camel case)，且首字母大写
* 组件名应该倾向于完整单词而不是缩写
* 和父组件紧密耦合的子组件应该以父组件名作为前缀命名，如果一个组件只在某个父组件的场景下有意义，这层关系应该体现在其名字上: `Todos, TodoItem,TodoList, TodoListItem`
* 组件名中的单词顺序，应该以高级别的 (通常是一般化描述的) 单词开头，以描述性的修饰词结尾。编辑器通常会按字母顺序组织文件，所以这样做可以把相关联的文件排在一起
* 组件放置位置:
  * 多个地方复用的组件，放到 `src/components` 文件夹下，用 `@` 的路径导入: `import Xxx from '@/components/Xxx.vue'`
  * 只是某个 View 使用，可以和 View 的文件放在同一个文件下，用相对路径导入: `import Xxx from './Xxx.vue'`
* 属性名: 
  * 定义组件时，在 props 中使用 camel case 命名规则规则定义: `userId`
  * 使用组件时，使用 keba case 规则绑定属性: `<User :user-id="userId"/>`
  * 属性名有动词时，动词在尾部，例如隐藏 footer 的属性用 `footer-hide` 而不是 `hide-footer`，参考 iView 的帮助文档
* 事件名: 以 `on` 开头，使用 keba case 规则命名: 
  * 定义组件时: `this.$emit('on-save')`
  * 使用组件时: `<User :user-id="userId" @on-save="saved"/>`
* 在组件开头进行注释说明，看到就能明白怎么使用

正例：

```js
components
    |- TodoList.vue
    |- TodoListItem.vue
    |- TodoListItemButton.vue

components
    |- SearchSidebar.vue
    |- SearchSidebarNavigation.vue
```

反例：

```js
components
    |- todoList.vue
    |- todo-list.vue
    |- SearchSidebar.vue
    |- NavigationForSearchSidebar.vue
```

正例：

```js
<!--
功能: 编辑用户信息的组件

属性:
user-id: 用户 ID，类型为整型，必要参数

事件:
on-save: 保存时触发，参数为被保存的 user 对象

Slot: 无

示例:
<User :user-id="1234" @on-save="saved"/>
-->
<template>
    <div class="user-edit">
        ...
    </div>
</template>

<script>
export default {
    props: {
        userId: { type: Number, required: true }
    },
    data() {
        return { 
            user: {},
        };
    },
    methods: {
        save() {
            this.$emit('on-save', user);
        }
    }
};
</script>
```

## Prop 定义

Prop 定义应该尽量详细，至少需要指定其类型。

正例：

```js
props: {
    status: String
}

// 更好的做法！
props: {
    status: {
        type: String, required: true, validator: value => {
            return ['syncing', 'synced'].indexOf(value) !== -1;
        }
    }
}
```

反例：

```js
props: ['status']
```

## 避免 v-if 和 v-for 用在一起

永远不要把 v-if 和 v-for 同时用在同一个元素上，一般我们在两种常见的情况下会倾向于这样做：

* 为了过滤一个列表中的项目 (比如 `v-for="user in users" v-if="user.isActive"`):
  * 要么将 users 替换为一个计算属性 (比如 activeUsers)，让其返回过滤后的列表
  * 要么放在子元素上使用 `v-if`
  * 要么使用 `<template v-for="user in users">`
* 为了避免渲染本应该被隐藏的列表 (比如 `v-for="user in users" v-if="shouldShowUsers"`)，请将 `v-if` 移动至容器元素上 (比如 ul, ol)

正例：

```js
<ul v-if="shouldShowUsers">
    <li v-for="user in users" :key="user.id">
        {{ user.name }}
    </li>
</ul>
```

反例：

```js
<ul>
    <li v-for="user in users" v-if="shouldShowUsers" :key="user.id">
        {{ user.name }}
    </li>
</ul>
```

## 为组件样式设置作用域

对于应用来说，顶级 App 组件和布局组件中的样式可以是全局的，但是其它所有组件都应该是有作用域的:

* 给每个组件定义一个唯一的 class
* 使用 scoped 特性，但不推荐，原因请参考 [Vue 尽量不用 scoped](https://www.qtdebug.com/fe-vue-scoped/)

正例：

```js
<template>
    <div class="paper-model-edit">
    </div>
</template>

<style lang="scss">
.paper-model-edit {
    ...
}
</style>
```

反例：

```js
<template>
    <div></div>
</template>
```

## 指令缩写

都用指令缩写 (用 : 表示 v-bind: 和用 @ 表示 v-on:)。

正例：

```js
<input @input="onInput" @focus="onFocus">
```

反例：

```js
<input v-bind:value="newTodoText" :placeholder="newTodoInstructions">
```

> 但是 `v-bind="user"` 绑定全部属性例外。

## 隐性的父子组件通信

应该优先通过 prop 和事件进行父子组件之间的通信，而不是 this.$parent 或改变 prop。

正例：

```js
Vue.component('TodoItem', {
    props: {
        todo: { type: Object, required: true }
    },
    template: `
        <input :value="todo.text" @input="$emit('input', $event.target.value)">
    `
    }
)
```

反例：

```js
Vue.component('TodoItem', {
    props: {
        todo: { type: Object, required: true }
    },
    methods: {
        removeTodo () {
            var vm = this
            vm.$parent.todos = vm.$parent.todos.filter(function (todo) {
                return todo.id !== vm.todo.id
            })
        }
    },
    template: `
        <span>
            {{ todo.text }}
            <button @click="removeTodo">X</button>
        </span>
    `
    }
)
```

## 全局状态管理

应该优先通过 Vuex 管理全局状态，而不是通过 `this.$root` 或一个全局事件总线。

## 参考资料

* [Vue 前端开发规范](https://www.toutiao.com/i6737161959776469511/)
* [Vue 尽量不用 scoped](https://www.qtdebug.com/fe-vue-scoped/)