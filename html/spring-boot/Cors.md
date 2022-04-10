配置 Cors 允许跨域:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            // registry.addMapping("/**").allowedMethods("*");
            registry.addMapping("/greeting-javaconfig").allowedOrigins("http://localhost:9000");
        }
    };
}
```

更多配置请参考类 `CorsRegistration` 的注释，请参考 [Enabling Cross Origin Requests for a RESTful Web Service](https://spring.io/guides/gs/rest-service-cors/#_enabling_cors) 进行学习。