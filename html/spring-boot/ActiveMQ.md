使用 ActiveMQ 的步骤:

* 引入 ActiveMQ 依赖
* 配置 ActiveMQ
* 创建 Producer 发送消息
* 创建 Consumer 接收消息

官方文档请阅读 [ActiveMQ Support](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-activemq)，其他:

* 传统 Spring MVC 中使用 ActiveMQ 可参考 [JMS + ActiveMQ](https://qtdebug.com/misc-jms-activemq/)
* [Spring Boot 10.A.8. Integration properties](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#integration-properties)  
* [Spring Boot Embedded ActiveMQ Configuration Example](https://memorynotfound.com/spring-boot-embedded-activemq-configuration-example/)
* [Spring Boot ActiveMQ 配置](https://www.jianshu.com/p/d8d73c872665)

## 引入 ActiveMQ 依赖

```groovy
implementation 'org.springframework.boot:spring-boot-starter-activemq'
```

```groovy
# 配置 spring.activemq.pool.enabled=true 时使用连接池需要引入
implementation 'org.messaginghub:pooled-jms'
```

## 配置 ActiveMQ

在 application.properties 中配置 ActiveMQ:

```ini
spring.activemq.broker-url = tcp://localhost:61616
```

## 创建 Producer 发送消息

```java
package com.xtuer.mq;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class Producer {
    @Autowired
    private JmsTemplate jmsTemplate;

    public void send(String message) {
        jmsTemplate.convertAndSend("queen", message);
    }
}
```

> 向队列 queen 中发射消息，如果队列不存在则会自动创建。

## 创建 Consumer 接收消息

```java
package com.xtuer.mq;

import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
public class Consumer {
    @JmsListener(destination = "queen")
    public void receive(String message) {
        System.out.println("收到消息: " + message);
    }
}
```

## 测试

```java
import com.xtuer.Application;
import com.xtuer.mq.Consumer;
import com.xtuer.mq.Producer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = {Application.class})
public class ActiveMQTest {
    @Autowired
    private Producer producer;

    @Test
    public void sendMessage() {
        int size = 1000;

        long start = System.currentTimeMillis();
        for (int i = 0; i < size; i++) {
            producer.send(System.currentTimeMillis() + "");
        }
        long end = System.currentTimeMillis();
        System.out.printf("发送 %d 条消息使用了 %d 毫秒", size, (end-start));
    }
}
```

启动 ActiveMQ，然后运行上面的程序，可以看到控制台消费者接收到消息的输出，效率为大概每秒 200 个左右。

## 效率

ActiveMQ 默认使用持久化写入，效率很低，设置 `spring.jms.template.delivery-mode=non_persistent` 使用非持久化的方式写入可以达到每秒 10000 个，可是一重启 ActiveMQ 后消息就没了，很不安全。

需要高安全性的同时还要高效率，放弃 ActiveMQ 吧，建议使用 [Apache RocketMQ](http://rocketmq.apache.org) 或者 [Kafka](http://kafka.apache.org)。

