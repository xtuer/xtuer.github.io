Spring Boot 创建入门级 RESTful Web 项目简单到令人发指，下面就来看看怎么用吧:

1. 创建项目的骨架
2. 添加 RestController
3. 启动项目: 
   * 普通模式: `gradle bootRun`
   * 调试模式: `gradle bootRun --debug-jvm`
4. 打包项目: `gradle build` 
5. 服务端口

## 创建项目的骨架

1. 访问 <http://start.spring.io>
2. 选择 Gradle Project，Spring Boot 2.x
3. 填写 Group (项目的包名，例如 com.xtuer) 和 Artifact (可不填)
4. Search for dependencies 输入 **web**
5. 点击 Generate Project，会自动下载项目骨架 demo.zip
6. 解压，如果不需要里面的 gradlew，删除即可<!--more-->

## 添加 RestController

```java
package com.xtuer;

import org.springframework.web.bind.annotation.*;

@RestController
public class XController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello";
    }
}
```

## 启动项目

终端进入项目目录，执行 `gradle bootRun`，输出日志可以看到项目启动成功，然后浏览器访问 <http://localhost:8080/hello>，得到响应的字符串 **Hello**。

```
> Task :bootRun

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.1.3.RELEASE)

2019-03-11 21:33:22.834  INFO 86793 --- [           main] com.xtuer.Application                    : Starting Application on Biao.local with PID 86793 (/Users/Biao/Desktop/demo/build/classes/java/main started by Biao in /Users/Biao/Desktop/demo)
2019-03-11 21:33:22.838  INFO 86793 --- [           main] com.xtuer.Application                    : No active profile set, falling back to default profiles: default
2019-03-11 21:33:23.795  INFO 86793 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2019-03-11 21:33:23.830  INFO 86793 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2019-03-11 21:33:23.830  INFO 86793 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.16]
2019-03-11 21:33:23.842  INFO 86793 --- [           main] o.a.catalina.core.AprLifecycleListener   : The APR based Apache Tomcat Native library which allows optimal performance in production environments was not found on the java.library.path: [/Users/Biao/Library/Java/Extensions:/Library/Java/Extensions:/Network/Library/Java/Extensions:/System/Library/Java/Extensions:/usr/lib/java:.]
2019-03-11 21:33:23.933  INFO 86793 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2019-03-11 21:33:23.933  INFO 86793 --- [           main] o.s.web.context.ContextLoader            : Root WebApplicationContext: initialization completed in 1060 ms
2019-03-11 21:33:24.186  INFO 86793 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2019-03-11 21:33:24.379  INFO 86793 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2019-03-11 21:33:24.382  INFO 86793 --- [           main] com.xtuer.Application                    : Started Application in 16.859 seconds (JVM running for 17.217)
2019-03-11 21:33:34.036  INFO 86793 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
2019-03-11 21:33:34.037  INFO 86793 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2019-03-11 21:33:34.043  INFO 86793 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 6 ms
<=========----> 75% EXECUTING [39s]
```

## 打包项目

终端进入项目目录，执行 `gradle build`，在 `<project>/build/libs` 中得到 jar 包，可以使用 `java -jar xxx.jar` 执行.

默认 build 得到的 jar 包名字包含版本信息，可以如下修改打包出来的 jar 的名字为 hsb.jar:

```groovy
bootJar {
    archiveFileName = 'hsb.jar'
}
```

## 服务端口

Spring Boot 应用默认端口为 8080，当 8080 端口被占用后就需要使用其他端口才能运行了:

* 在 application.properties 中配置 `server.port = 9090`

* 运行时指定端口: `java -jar build/libs/demo.jar --server.port=9090`

推荐在运行时通过参数的方式指定端口。