Spring Boot 启动时如果发现 ApplicationContext 中某个 Bean 的类继承了 `org.springframework.core.convert.converter.Converter`，则会自动的把它注册为 Converter。

例如前端传一个字符串格式的日期，Controller 中想自动转换为 java.time.LocalDate 对象，像下面这样做就可以了:

```java
package com.xtuer.converter;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class DateConverter implements Converter<String, LocalDate> {
    @Override
    public LocalDate convert(String date) {
        return LocalDate.parse(date, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}
```

<!--more-->

## 测试用例

Controller 中添加下面的方法:

```java
@GetMapping("/api/string2date")
@ResponseBody
public String string2date(@RequestParam LocalDate date) { // 自动把字符串的日期转为了 LocalDate
    System.out.println(date);
    return "OK";
}
```

浏览器里访问 <http://localhost:8080/api/string2date?date=2019-08-19>，查看控制台输出。

## 与 ConfigurationProperties 一起使用

ConfigurationProperties 可以把 application.properties 中的配置生成对象，想要 Converter 与 ConfigurationProperties 一起使用的话，需要在 Converter 上增加注解 `@ConfigurationPropertiesBinding`:

```java
...
@Component
@ConfigurationPropertiesBinding
public class DateConverter implements Converter<String, LocalDate> {
    @Override
    public LocalDate convert(String date) {
        return LocalDate.parse(date, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}
```

