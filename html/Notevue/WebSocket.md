Web Socket 使用 [vue-native-websocket](https://github.com/nathantsoi/vue-native-websocket)，结合 Vuex 一起使用更简洁，具体的使用说明请阅读官方帮助文档，这里只列出项目中使用的代码并作简单的介绍，新项目中拿来即用即可。

## 安装依赖

```js
yarn add vue-native-websocket
```

## main.js

在 main.js 中导入 VueNativeWebSocket。如果 WebSocket 只是某几个页面使用，那么就没有必要打开页面的时候就连接服务器，而是在需要的页面中再手动连接。

```js
import store from './store';
import VueNativeSock from 'vue-native-websocket';

Vue.use(VueNativeSock, 'ws://localhost:3721', {
    store,
    format: 'json',             // SOCKET_ONMESSAGE(state, message) 收到的消息 message 为 JSON 对象
    connectManually     : true, // 手动调用 connect() 连接服务器
    reconnection        : true, // (Boolean) whether to reconnect automatically (false)
    reconnectionAttempts: 5,    // (Number) number of reconnection attempts before giving up (Infinity),
    reconnectionDelay   : 5000, // (Number) how long to initially wait before attempting a new (1000)
});
```

> format 为 'json' 时服务器端返回 JSON 格式的消息。

## store.js

VueNativeWebSocket 的文档里已经列出与 Vuex 一起使用的代码，我们只需要进行微调即可:

* 事件监听: 当 WebSocket 事件发生时，下面 mutations 中相应的方法会被调用，例如收到消息时 `SOCKET_ONMESSAGE(state, message)` 就会被调用，我们可以在这里根据消息的类型进行处理

* 消息发送: 推荐调用 action  `this.$store.dispatch('sendMessage', message)` 发送消息。可以把它混入到 Vue，方便调用:

  ```js
  // 调用 this.sendMessage(message) 发送消息
  Vue.prototype.sendMessage = function(message) {
      this.$store.dispatch('sendMessage', message);
  };
  ```

* 心跳消息: 很多服务器都会进行心跳检测，设定时间内没有收到任何消息就会把客户端连接断开，所以在连接成功时启动计时器定时发送心跳，连接断开时关闭定时发送心跳的计时器 (所谓的心跳消息，其实是个消息就行，没有什么要求)

```js
import Vue from 'vue';
import Vuex from 'vuex';
import Message from '@/../public/static/js/Message';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        socket: {
            message: {},
            connected: false,
            reconnectError: false,
            heartBeatTimer: 0,
            heartBeatInterval: 2000,
        }
    },
    mutations: {
        // 收到服务器发送来的消息
        SOCKET_ONMESSAGE(state, message) {
            state.socket.message = message;
        },
        // 连接成功
        SOCKET_ONOPEN(state, event) {
            Vue.prototype.$socket = event.currentTarget;
            state.socket.connected = true;

            // 连接成功时启动定时发送心跳消息，避免被服务器断开连接
            state.socket.heartBeatTimer = setInterval(() => {
                const message = Message.createHeartbeatMessage();
                state.socket.connected && Vue.prototype.$socket.sendObj(message);
            }, state.socket.heartBeatInterval);

            console.log('消息系统连接成功: ' + new Date());
        },
        // 连接关闭
        SOCKET_ONCLOSE(state, event) {
            state.socket.connected = false;

            // 连接关闭时停掉心跳消息
            clearInterval(state.socket.heartBeatTimer);
            state.socket.heartBeatTimer = 0;

            console.log('消息系统连接已断开: ' + new Date());
        },
        // 发生错误
        SOCKET_ONERROR(state, event) {
            console.error(state, event);
        },
        // 自动重连
        SOCKET_RECONNECT(state, count) {
            console.info('消息系统重连中...', state, count);
            Vue.prototype.$Message.warning('消息系统重连中...');
        },
        // 重连错误
        SOCKET_RECONNECT_ERROR(state) {
            state.socket.reconnectError = true;
        },
        // 发送消息
        SOCKET_SEND_MESSAGE(state, message) {
            state.socket.connected && Vue.prototype.$socket.sendObj(message);
        },
    },
    actions: {
        // 发送消息: this.$store.dispatch('sendMessage', message)
        sendMessage: function(context, message) {
            context.commit('SOCKET_SEND_MESSAGE', message);
        }
    },
});

// 调用 this.sendMessage(message) 发送消息
Vue.prototype.sendMessage = function(message) {
    this.$store.dispatch('sendMessage', message);
};
```

## 使用 WebSocket 的页面

注意以下几点:

* 在 `mounted` 的时候调用 `connect` 连接服务器
* 在 `beforeDestroy` 的时候和服务器断开连接
* 调用 `this.sendMessage(message)` 发送消息
* 定义一个 computed 属性 `message` 为 `this.$store.state.socket.message`，并且对其使用 watch 监听，这样当收到服务器的消息时，监听函数就会被调用，可以在这里执行各种消息对应的操作

```js
<template>
    <div class="about">
        连接状态: <Badge :status="connected ? 'success' : 'error'" /><br>
        最新消息: {{ message }}<br><br>

        <Button @click="joinInGroup">加入小组</Button>
    </div>
</template>

<script>
import Message from '@/../public/static/js/Message';

export default {
    data() {
        return {};
    },
    mounted() {
        // 连接到服务器，参数为用户信息 (根据服务器实现决定使用参数)
        this.$connect('ws://localhost:3721?userId=100&username=biao');
    },
    beforeDestroy() {
        // 断开连接
        this.$disconnect();
    },
    methods: {
        joinInGroup() {
            let message = Message.createJoinInGroupMessage(1234567, 'Hello');
            this.sendMessage(message);
        }
    },
    computed: {
        message() {
            return this.$store.state.socket.message;
        },
        connected() {
            return this.$store.state.socket.connected;
        }
    },
    watch: {
        // 收到消息，根据消息的类型进行处理
        message() {
            switch (this.message.type) {
            case Message.types.GROUP_JOIN:
                console.log(`${this.message.fromUsername} 加入小组 ${this.message.to}`);
                break;
            default:
                console.log('不支持的消息', this.message);
            }
        }
    }
};
</script>
```

## Message.js

消息类，为了简化各种消息的创建:

```js
/**
 * 消息
 *
 * @param from 发送者，一般为 userId
 * @param to   接收者
 *             群发消息时为小组名 groupName
 *             私人消息时为接收者的 userId
 * @param type 消息类型
 * @param content 消息的内容
 */
function Message(from, to, type, content) {
    this.from = from;
    this.to   = to;
    this.type = type;
    this.content = content;
}

// 消息转为 JSON 字符串
Message.prototype.toJson = function() {
    var temp = {
        from   : this.from,
        to     : this.to,
        type   : this.type,
        content: this.content
    };

    return JSON.stringify(temp);
};

// 消息类型
Message.types = {
    GROUP_JOIN     : 'GROUP_JOIN',      // 加入小组
    GROUP_LEAVE    : 'GROUP_LEAVE',     // 离开小组
    GROUP_MESSAGE  : 'GROUP_MESSAGE',   // 发送小组消息
    GROUP_USERS    : 'GROUP_USERS',     // 获取小组成员
    GROUP_HISTORY  : 'GROUP_HISTORY',   // 小组历史消息
    PRIVATE_MESSAGE: 'PRIVATE_MESSAGE', // 发送私有消息
    PRIVATE_HISTORY: 'PRIVATE_HISTORY', // 私有历史消息
    HEARTBEAT      : 'HEARTBEAT',       // 心跳消息
    ERROR          : 'ERROR',           // 错误消息
};

// 创建加入小组消息: 消息的 content 为用户名字
Message.createJoinInGroupMessage = function(userId, groupName) {
    return new Message(userId, groupName, Message.types.GROUP_JOIN, '');
};

// 创建小组消息
Message.createGroupMessage = function(userId, groupName, content) {
    return new Message(userId, groupName, Message.types.GROUP_MESSAGE, content);
};

// 创建获取小组成员列表消息
Message.createGetGroupUsersMessage = function(userId, groupName) {
    return new Message(userId, groupName, Message.types.GROUP_USERS, '');
};

// 创建获取小组历史消息的消息
Message.createGroupHistoryMessage = function(userId, groupName, page = 1) {
    return new Message(userId, groupName, Message.types.GROUP_HISTORY, page); // content 为 page
};

// 创建私人消息
Message.createPrivateMessage = function(userId, receiverId, content) {
    return new Message(userId, receiverId, Message.types.PRIVATE_MESSAGE, content);
};

// 创建关闭消息，WebSocket 中关闭的消息为空的内容
Message.createCloseMessage = function() {
    return '';
};

// 创建心跳消息
Message.createHeartbeatMessage = function() {
    return new Message('', '', Message.types.HEARTBEAT, '');
};

// 默认导出
export default Message;
```

## 多模块使用 WebSocket

Vuex 提供了[多模块 Module](https://vuex.vuejs.org/zh/guide/modules.html) 的方式，避免单个 store.js 过于臃肿，我们可以把 WebSocket 的内容放到 store-socket.js 中，然后加入到 Vuex 的 modules 里，代码的其他部分不需要改动。

### store.js

```js
import Vue from 'vue';
import Vuex from 'vuex';
import socket from './store-socket';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        // 提示: state 中的属性按照无原来无前缀的方式访问，如 this.$store.state.count
        count: 0,
    },
    modules: {
        // 提示:
        // 1. 模块 socket 中 state 的属性通过 this.$store.state.socket 访问，socket 后面不能带 state，
        //    例如 this.$store.state.socket.connected
        // 2. 模块中的 mutations, actions, getters 等注册在全局命名空间，访问时无 socket 前缀，
        //    例如 this.$store.dispatch('sendMessage', message)
        socket,
    },
    mutations: {
        // 提示: this.$store.dispatch('increase')
        increase(state) {
            state.count += 1;
        }
    }
});
```

### store-socket.js

```js
import Vue from 'vue';
import Message from '@/../public/static-p/js/Message';

export default {
    state: () => ({
        message: {},
        connected: false,
        reconnectError: false,
        heartBeatTimer: 0,
        heartBeatInterval: 2000,
    }),
    mutations: {
        // 收到服务器发送来的消息
        SOCKET_ONMESSAGE(state, message) {
            state.message = message;
        },
        // 连接成功
        SOCKET_ONOPEN(state, event) {
            Vue.prototype.$socket = event.currentTarget;
            state.connected = true;

            // 连接成功时启动定时发送心跳消息，避免被服务器断开连接
            state.heartBeatTimer = setInterval(() => {
                const message = Message.createHeartbeatMessage();
                state.connected && Vue.prototype.$socket.sendObj(message);
            }, state.heartBeatInterval);

            console.log('消息系统连接成功: ' + new Date());
        },
        // 连接关闭
        SOCKET_ONCLOSE(state, event) {
            state.connected = false;

            // 连接关闭时停掉心跳消息
            clearInterval(state.heartBeatTimer);
            state.heartBeatTimer = 0;

            console.log('消息系统连接已断开: ' + new Date());
        },
        // 发生错误
        SOCKET_ONERROR(state, event) {
            console.error(state, event);
        },
        // 自动重连
        SOCKET_RECONNECT(state, count) {
            console.info('消息系统重连中...', state, count);
            Vue.prototype.$Message.warning('消息系统重连中...');
        },
        // 重连错误
        SOCKET_RECONNECT_ERROR(state) {
            state.reconnectError = true;
        },
        // 发送消息
        SOCKET_SEND_MESSAGE(state, message) {
            state.connected && Vue.prototype.$socket.sendObj(message);
        },
    },
    actions: {
        // 发送消息: this.$store.dispatch('sendMessage', message)
        sendMessage: function(context, message) {
            context.commit('SOCKET_SEND_MESSAGE', message);
        }
    },
};

// 调用 this.sendMessage(message) 发送消息
Vue.prototype.sendMessage = function(message) {
    this.$store.dispatch('sendMessage', message);
};
```

