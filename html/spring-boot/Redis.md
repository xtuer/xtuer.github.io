这里我们使用阿里的 [JetCache](https://github.com/alibaba/jetcache) 访问 Redis:

1. 引入 JetCache 依赖
2. 配置 JetCache
3. 启用 JetCache
4. 使用 JetCache 访问 Redis
5. 关闭 JetCache

详细的使用帮助请参考 [JetCache Wiki](https://github.com/alibaba/jetcache/wiki)。

## 引入 JetCache 依赖

```groovy
implementation 'com.alicp.jetcache:jetcache-starter-redis:2.5.14'
implementation 'redis.clients:jedis:2.9.0'
```

> jetcache-starter-redis 依赖的 redis client 版本太高，启动程序的时候报错 `jetcache ClassNotFoundException: redis.clients.util.Pool`，解决这个问题的办法就是使用低版本的 redis client。

## 配置 JetCache

配置 application.properties:

```ini
jetcache.statIntervalMinutes                = 15
jetcache.areaInCacheName                    = false
jetcache.local.default.type                 = linkedhashmap
jetcache.local.default.keyConvertor         = fastjson
jetcache.remote.default.type                = redis
jetcache.remote.default.keyConvertor        = fastjson
jetcache.remote.default.valueEncoder        = kryo
jetcache.remote.default.valueDecoder        = kryo
jetcache.remote.default.poolConfig.minIdle  = 5
jetcache.remote.default.poolConfig.maxIdle  = 20
jetcache.remote.default.poolConfig.maxTotal = 50
jetcache.remote.default.host                = 127.0.0.1
jetcache.remote.default.port                = 6379
jetcache.remote.default.expireAfterWriteInMillis = 3600000
jetcache.local.default.expireAfterWriteInMillis  = 3600000
```

## 启用 JetCache

应用的启动类中启用 JetCache:

```java
package com.xtuer;

import com.alicp.jetcache.anno.config.EnableCreateCacheAnnotation;
import com.alicp.jetcache.anno.config.EnableMethodCache;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableMethodCache(basePackages = "com.xtuer.service")
@EnableCreateCacheAnnotation
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

> 提示:
>
> * basePackages 为要使用 JetCache 的包名
> * 禁用 JetCache 只需要把 basePackages 修改为不存在的包名即可

## 使用 JetCache 访问 Redis

使用 `@Cached` 标注从 Redis 读取数据，`@CacheInvalidate` 从 Redis 中删除数据:

```java
@Cached(name = "user:", key = "#userId")
public User findUser(long userId) {
    return userMapper.findUserById(userId);
}

@CacheInvalidate(name = "user:", key = "#userId")
public void updateUserNickname(long userId, String nickname) {
    userMapper.updateUserNickname(userId, nickname);
}
```

## 关闭 JetCache

有些时候为了方便测试，不从 Redis 中获取数据，可参考下面 2 中方法:

* 修改 `@EnableMethodCache(basePackages = "com.xtuer.service")` 中的 basePackages 为不存在的包名
* 关闭 Redis，使用到 JetCache 的地方只会有个错误日志，但是程序还能够继续正常运行