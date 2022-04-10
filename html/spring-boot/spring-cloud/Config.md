[Spring Cloud Config](https://cloud.spring.io/spring-cloud-static/Hoxton.SR1/reference/htmlsingle/#spring-cloud-config) 包括 2 个部分: **配置服务器**和**配置客户端**。一组微服务中，可以把配置集中的保存在配置服务器上，微服务应用 (配置客户端) 启动时从配置服务器上读取配置，这样可以统一编排相关配置，例如微服务应用的端口，注册中心的地址等。

配置服务器的职责是只提供配置的读取，不应该再提供其他服务。

当然应用启动前，先要启动配置服务器，否则配置客户端启动时连不上配置服务器，就会使用本地配置进行启动。

Spring Cloud Consul Config 是 [Spring Cloud Config](https://github.com/spring-cloud/spring-cloud-config) 的替代方案，由于我们会使用 Consul 提供的服务治理，所以它也是个很好的选择。不过 Spring Cloud Consul Config 需要在网页中编辑配置，中小型项目时感觉有点麻烦，但是能够实现配置变化后客户端动态加载修改后的配置 (使用 `@ConfigurationProperties` 才行，`@Value` 不行)。

## 配置服务器

创建配置服务器:

1. 创建一个最简单的 Spring Boot 应用
2. 引入配置服务器依赖
3. 启动类上使用注解 `@EnableConfigServer`
4. 配置 application.properties

### 引入配置服务器依赖:

```java
dependencies {
    implementation 'org.springframework.cloud:spring-cloud-config-server'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:Hoxton.SR1"
    }
}
```

### 启动类:

```java
package com.xtuer.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
	public static void main(String[] args) {
		SpringApplication.run(ConfigServerApplication.class, args);
	}
}
```

### 配置 application.properties:

配置文件可以放在多种源中，例如:

* Git 服务器 (默认)
* 数据库
* 配置服务器的本地文件系统中

下面演示放在配置服务器的本地文件系统中，因为很多部署环境里和外网是隔离的，或者访问 Git 服务器太慢:

```ini
server.port = 8000
spring.application.name = config-server

# 配置中心的配置:
# 注意: spring.profiles.active = native 必须有，且只能为 native
spring.profiles.active = native
spring.cloud.config.server.native.search-locations = classpath:/shared
```

其中:

* 因为使用配置文件在本地，所以 `spring.profiles.active = native` 必须有，且只能为 native
* 使用 `spring.cloud.config.server.native.search-locations` 指定配置文件的位置，上面的例子把配置文件放置  resources/shared 目录

配置文件例子 **shared/config-client.properties**:

```ini
server.port = 8001
username = Name in Server
```

## 配置客户端

创建配置客户端:

1. 创建一个最简单的 Spring Boot 应用
2. 引入配置客户端依赖
3. 配置 bootstrap.properties

### 引入配置客户端依赖:

```java
dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-config'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:Hoxton.SR1"
    }
}
```

### 配置 bootstrap.properties:

应用的配置文件不再使用 application.properties，而是 bootstrap.properties 或者 bootstrap.yml:

```ini
username = Bob
password = xxx

# 从配置中心获取配置
spring.application.name = config-client
spring.profiles.active  = default
spring.cloud.config.uri = http://localhost:8000
```

其中:

* 配置 spring.cloud.config.uri 为配置服务器的地址
* 配置文件的名字为 `${spring.application.name}-${spring.profiles.active}.properties|yml`，profile 为 default 时可以省略，此例子的配置文件名为下面的任意一个:
  * config-client.properties
  * config-client.yml
  * config-client-default.properties
  * config-client-default.yml
* 服务器上的配置优先级比本地 bootstrap.properties 的高

