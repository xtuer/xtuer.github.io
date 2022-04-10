Lombok 能够简化 POJO 类的实现，极大的提高了生产力，只需要在 build.gradle 中加上下面 2 句就能够使用 [Lombok](https://projectlombok.org) 了:

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok:1.18.22'
    annotationProcessor 'org.projectlombok:lombok:1.18.22'
}
```

Lombok 的注解非常多，但是如果什么都用，会增加代码的复杂程度，推荐只使用下面几个常用的注解:

```java
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;

@Data
@Getter
@Setter

// 生成 Logger 对象: private static final Logger log = LoggerFactory.getLogger(Test.class);
@Slf4j

// 可链式调用设置属性: new User().setId(1).setUsername("Alice").setPassword("Passw0rd");
@Accessors(chain = true)
```

绝大多数时候使用 [@Data](https://projectlombok.org/features/Data) 即可:

> All together now: A shortcut for `@ToString`, `@EqualsAndHashCode`, `@Getter` on all fields, `@Setter` on all non-final fields, and `@RequiredArgsConstructor`!

[@RequiredArgsConstructor](https://projectlombok.org/features/constructor) 指的是属性使用 `@lombok.NonNull` 注解后，就会在构造函数中注入他们，如果没有 `@NonNull` 的属性，则生成默认的构造函数，但别乱用 `@NonNull`，避免增加理解的复杂度。

