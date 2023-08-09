介绍 Spring Boot 的简单使用，使用各种库的基本配置手册，至于相关知识需要大家自行搜索学习了，下面列出几个学习的网址:

* [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-documentation)
* [Spring Boot Tutorial](https://www.tutorialspoint.com/spring_boot/index.htm)
* [ Spring Boot 基础教程](https://github.com/ityouknow/spring-boot-leaning)
* [Starters](https://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#using-boot-starter) are a set of convenient dependency descriptors that you can include in your application
  * [Spring Boot Starter 依赖库的版本](https://github.com/spring-projects/spring-boot/tree/master/spring-boot-project/spring-boot-starters)
  * [自定义 Spring Boot Starter 1](https://juejin.im/entry/58d37630570c350058c2c15c)
  * [自定义 Spring Boot Starter 2](https://www.jianshu.com/p/4735fe7ae921)
* [Spring Boot Gradle Plugin Reference Guide](https://docs.spring.io/spring-boot/docs/2.3.0.GRADLE-SNAPSHOT/gradle-plugin/reference/html/)

常用命令:

* 运行:
  * `gradle bootRun`
  * `gradle bootRun --debug`
  * `gradle bootRun --args='--spring.profiles.active=dev'`
  * `java -jar -Dfile.encoding=UTF-8 demo.jar --spring.profiles.active=dev --logging.level.com.xtuer=DEBUG`
  
* [调试](https://docs.spring.io/spring-boot/docs/1.5.21.RELEASE/reference/html/howto-build.html#howto-remote-debug-gradle-run):

  * 方式一:  `gradle bootRun --debug-jvm`

  * 方式二: build.gradle 中配置:

    ```js
    bootRun {
        jvmArgs += "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
    }
    ```

* 打包: `gradle build`，会执行测试

* 打包: `gradle assemble`，不会执行测试

