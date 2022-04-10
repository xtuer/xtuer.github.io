一般不会在 Spring Boot 应用上直接启用 Https，而是 Spring Boot 继续提供 Http 服务，Nginx 把 Https 请求作为 Http 请求转发到 Spring Boot，Nginx 部分的配置可参考 [Nginx + Tomcat 使用 Https](https://qtdebug.com/java-tomcat-nginx-https/)，也可参考 [SpringBoot + Nginx + Https 下 Redirect 问题](https://blog.csdn.net/yucharlie/article/details/77547754)，Spring Boot 部分需要在 application.properties 增加下面的配置:

```ini
server.tomcat.remote_ip_header = x-forwarded-for
server.tomcat.protocol_header  = x-forwarded-proto
server.tomcat.port-header      = X-Forwarded-Port
server.use-forward-headers     = true
```

如果配置不对，redirect 站内地址会使用 HTTP 的端口如 80 而非 HTTPS 的端口 443。
