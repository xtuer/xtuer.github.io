Spring Boot 使用 MyBatis 主要为以下 4 步:

1. 引入 MyBatis 依赖
2. 配置数据源
3. 编写 Mapper
4. 使用 Mapper
5. 编写 Mapper XML
6. MyBatis 配置

详细说明请参考官方文档 [What is MyBatis-Spring-Boot-Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)。

## 引入 MyBatis 依赖

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:2.1.1'
runtime('mysql:mysql-connector-java:5.1.46')
```

## 配置数据源

配置 application.properties:

```ini
spring.datasource.username = root
spring.datasource.password = root
spring.datasource.url      = jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true&useSSL=false
spring.datasource.driver-class-name = com.mysql.jdbc.Driver
```

## 编写 Mapper

使用注解 `@Mapper` 自动生成 Mapper 对象:

```java
package com.xtuer.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface UserMapper {
    @Select("SELECT * FROM user WHERE username=#{username}")
    Map findUserByUsername(String username);
}
```

## 使用 Mapper

使用 `@Autowired` 装配 mapper:

```java
package com.xtuer.controller;

import com.xtuer.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HelloController {
    @Autowired
    private UserMapper userMapper;

    @GetMapping("/hello")
    public Map hello(@RequestParam String username) {
        return userMapper.findUserByUsername(username);
    }
}
```

## Mapper XML

上面的 SQL 语句写在了 Mapper 中，更多时候是希望写到 xml 文件方便管理以及修改。

在 application.properties 中加上:

```ini
# Mapper XML 文件的路径
mybatis.mapper-locations = classpath:mapper/*.xml
# 不需要写类的全路径了，例如 com.xtuer.bean.User 在 Mapper XML 中可省去包名，简写为 User
mybatis.type-aliases-package = com.xtuer.bean
mybatis.configuration.map-underscore-to-camel-case = true
```

在 resources 目录下创建目录 mapper，创建文件 UserMapper.xml:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<!-- namespace 非常重要：必须是 Mapper 类的全路径 -->
<mapper namespace="com.xtuer.mapper.UserMapper">
    <select id="findUserByUsername" parameterType="string" resultType="User">
        SELECT id, username, password FROM user WHERE username = #{username}
    </select>
</mapper>
```

> 注: UserMapper 中的 @Select 去掉，再写一个 User bean，就不在此赘述了.

## MyBatis 配置

MyBatis 的一些配置可以在 application.properties 中配置，也可以使用 MyBatis 的配置文件:

```ini
mybatis.config-location = classpath:mybatis-config.xml
```

## 事务管理

[启用事务需要手动使用注解 @EnableTransactionManagement 吗？](https://stackoverflow.com/questions/40724100/enabletransactionmanagement-in-spring-boot)在 Spring Boot 中，当我们使用了 spring-boot-starter-jdbc 或 spring-boot-starter-data-jpa 依赖的时候，框架会自动默认分别注入 DataSourceTransactionManager 或 JpaTransactionManager。所以不需要任何额外配置就可以用 `@Transactional` 注解使用事务。[Spring Boot 中的事务管理](http://blog.didispace.com/springboottransactional/)写得不错，可以参考下。

```java
@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    @Transactional(rollbackFor = Exception.class)
    public void updateUsername(String username) {
        userMapper.updateUsername(username);
        // throw new RuntimeException();
    }
}
```

