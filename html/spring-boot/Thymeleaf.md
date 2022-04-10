Spring Boot 使用 [Thymeleaf](https://www.thymeleaf.org):

1. 引入 Thymeleaf 依赖
2. 配置 Thymeleaf
3. 编写 Thymeleaf 模板文件
4. 控制器中返回模板的路径

## 引入 Thymeleaf 依赖

```groovy
implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
```

## 配置 Thymeleaf

配置 application.properties:

```ini
spring.thymeleaf.mode         = HTML
spring.thymeleaf.cache        = false
spring.thymeleaf.suffix       = .html
spring.thymeleaf.encoding     = UTF-8
spring.thymeleaf.content-type = text/html
```

## 编写 Thymeleaf 模板文件

在 resources/templates 目录中创建文件 hello.html:

```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8"/>
</head>

<body>
    <span th:text="${username}">Thymeleaf</span>
</body>

</html>
```

## 控制器中返回模板的路径

```java
package com.xtuer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class XController {
    @GetMapping("/hello")
    public String hello(ModelMap model) {
        model.put("username", "Alice");
        return "hello.html";
    }
}
```

访问 http://localhost:8080/hello 就可以看到页面了。