使用 MongoDB 的步骤:

* 引入 MongoDB 依赖
* 配置 MongoDB
* 注入 MongoTemplate
* 使用 MongoTemplate

官方文档请阅读 [Spring Boot MongoDB](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#boot-features-mongodb)。

## 引入 MongoDB 依赖

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
```

## 配置 MongoDB

在 application.properties 中配置 MongoDB:

```ini
# 无账号
spring.data.mongodb.uri = mongodb://localhost/test

# 使用账号，以及集群
spring.data.mongodb.uri = mongodb://<user>:<secret>@mongo1.example.com:12345,mongo2.example.com:23456/dbName
```

还可以配置 MongoDB 的连接参数，例如 maxPoolSize、waitQueueMultiple 等，例如:

```ini
spring.data.mongodb.uri = mongodb://exam:exam@localhost:27017/exam?connectTimeoutMS=30000&minPoolSize=0&maxPoolSize=100&maxIdleTimeMS=900000&waitQueueMultiple=70
```

具体的可使用的参数请参考 [Connection String Options](https://docs.mongodb.com/manual/reference/connection-string/#connection-string-options)，最好是根据压测的实际情况进行配置。

## 注入 MongoTemplate

Spring Boot 会自动的创建一个 MongoTemplate 对象，我们只需要在程序里直接使用。

> [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb) provides a [`MongoTemplate`](https://docs.spring.io/spring-data/mongodb/docs/2.2.3.RELEASE/api/org/springframework/data/mongodb/core/MongoTemplate.html) class that is very similar in its design to Spring’s `JdbcTemplate`. As with `JdbcTemplate`, Spring Boot auto-configures a bean for you to inject the template。

```java
import org.springframework.data.mongodb.core.MongoTemplate;

public class XController {
    @Autowired
    private MongoTemplate mongoTemplate;
}
```

## 使用 MongoTemplate

```java
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

public class XController {
    @Autowired
    private MongoTemplate mongoTemplate;
  
    @GetMapping("/api/mongo")
    public List<HashMap> mongo() {
        Query query = Query.query(new Criteria());
        List<HashMap> r = mongoTemplate.find(query, HashMap.class, "exam_question_answer");

        return r;
    }
}
```

更多 MongoTemplate 的使用可参考 [MongoDB 初接触](https://qtdebug.com/mac-mongodb)。