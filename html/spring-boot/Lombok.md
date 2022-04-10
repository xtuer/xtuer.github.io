只需要在 build.gradle 中加上下面 2 句就能够使用 [Lombok](https://projectlombok.org) 了:

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok:1.16.20'
    annotationProcessor 'org.projectlombok:lombok:1.16.20'
}
```

常用的 Lombok 注解有:

```java
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Setter
@Accessors(chain = true)
```

