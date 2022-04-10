Spring Boot 默认使用 Jackson 进行序列化，有些默认的序列化行为可能满足不了我们的需求，例如:

* 时间: 
  * 默认: 数字的时间戳
  * 希望: `yyyy-MM-dd HH:mm:ss`
* null 值默认都输出 null，希望:
  * 字符串: ""
  * 数组: []
  * 集合: []
  * 布尔: false
  * 数值: 0
  * 其他: null
* 长整数 long, Long, BigInteger (JS 只支持最大 54 bits 的长整数):
  * 默认: 数字
  * 希望: 字符串
* 等等...

为了满足上面这些需求，可以自定义的 ObjectMapper 的序列化行为，摘抄自 [SpringBoot Jackson 将 null 转字符串 "" ，List、Array 转 []，Int 转 0](https://blog.csdn.net/qq_38132283/article/details/89339817?utm_medium=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-BlogCommendFromMachineLearnPai2-1.nonecase)。

## 一、自定义 MappingJackson2HttpMessageConverter

```java
package com.xtuer.converter;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.BeanPropertyWriter;
import com.fasterxml.jackson.databind.ser.BeanSerializerModifier;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.List;

/**
 * 使用 Jackson 的 MessageConverter，主要是定制各种类型的 null 值的输出，时间格式等
 */
public class JacksonHttpMessageConverter extends MappingJackson2HttpMessageConverter {
    public JacksonHttpMessageConverter() {
        JacksonHttpMessageConverter.setupObjectMapper(getObjectMapper());
    }

    /**
     * 设置 objectMapper 的输出格式、属性处理方式等
     *
     * @param objectMapper Jackson ObjectMapper
     */
    public static void setupObjectMapper(ObjectMapper objectMapper) {
        // Long to String
        SimpleModule simpleModule = new SimpleModule();
        simpleModule.addSerializer(Long.class, ToStringSerializer.instance);
        simpleModule.addSerializer(Long.TYPE, ToStringSerializer.instance);
        objectMapper.registerModule(simpleModule);

        // Data Format
        objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));

        // 忽略未知的属性
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Null value
        objectMapper.setSerializerFactory(objectMapper.getSerializerFactory().withSerializerModifier(new NullValueSerializerModifier()));
    }

    /**
     * 处理数组类型的 null 值
     */
    public static class NullArrayJsonSerializer extends JsonSerializer<Object> {
        @Override
        public void serialize(Object value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            if (value == null) {
                gen.writeStartArray();
                gen.writeEndArray();
            }
        }
    }

    /**
     * 处理字符串类型的 null 值
     */
    public static class NullStringJsonSerializer extends JsonSerializer<Object> {
        @Override
        public void serialize(Object o, JsonGenerator gen, SerializerProvider serializerProvider) throws IOException {
            gen.writeString("");
        }
    }

    /**
     * 处理数字类型的 null 值
     */
    public static class NullNumberJsonSerializer extends JsonSerializer<Object> {
        @Override
        public void serialize(Object o, JsonGenerator gen, SerializerProvider serializerProvider) throws IOException {
            gen.writeNumber(0);
        }
    }

    /**
     * 处理布尔类型的 null 值
     */
    public static class NullBooleanJsonSerializer extends JsonSerializer<Object> {
        @Override
        public void serialize(Object o, JsonGenerator gen, SerializerProvider serializerProvider) throws IOException {
            gen.writeBoolean(false);
        }
    }

    /**
     * 注册空值的序列化器
     */
    public static class NullValueSerializerModifier extends BeanSerializerModifier {
        @Override
        public List<BeanPropertyWriter> changeProperties(SerializationConfig config, BeanDescription beanDesc, List<BeanPropertyWriter> beanProperties) {
            // 循环所有的 beanPropertyWriter
            for (Object beanProperty : beanProperties) {
                BeanPropertyWriter writer = (BeanPropertyWriter) beanProperty;

                // 判断字段的类型，如果是 array，list，set 则注册 nullSerializer
                if (isArrayType(writer)) {
                    // 给 writer 注册一个自己的 nullSerializer
                    writer.assignNullSerializer(new NullArrayJsonSerializer());
                } else if (isNumberType(writer)) {
                    writer.assignNullSerializer(new NullNumberJsonSerializer());
                } else if (isBooleanType(writer)) {
                    writer.assignNullSerializer(new NullBooleanJsonSerializer());
                } else if (isStringType(writer)) {
                    writer.assignNullSerializer(new NullStringJsonSerializer());
                }
            }

            return beanProperties;
        }

        /**
         * 是否是数组
         */
        private boolean isArrayType(BeanPropertyWriter writer) {
            Class<?> clazz = writer.getType().getRawClass();
            return clazz.isArray() || Collection.class.isAssignableFrom(clazz);
        }

        /**
         * 是否是 String
         */
        private boolean isStringType(BeanPropertyWriter writer) {
            Class<?> clazz = writer.getType().getRawClass();
            return CharSequence.class.isAssignableFrom(clazz) || Character.class.isAssignableFrom(clazz);
        }

        /**
         * 是否是 int
         */
        private boolean isNumberType(BeanPropertyWriter writer) {
            Class<?> clazz = writer.getType().getRawClass();
            return Number.class.isAssignableFrom(clazz);
        }

        /**
         * 是否是 Boolean
         */
        private boolean isBooleanType(BeanPropertyWriter writer) {
            Class<?> clazz = writer.getType().getRawClass();
            return clazz.equals(Boolean.class);
        }
    }
}
```

## 二、创建 HttpMessageConverters

```java
@Configuration
public class WebConfig {
    /**
     * 启用 Jackson 为 HttpMessageConverter，转换对象为 JSON 字符串
     */
    @Bean
    public HttpMessageConverters jacksonHttpMessageConverters() {
        JacksonHttpMessageConverter jacksonHttpMessageConverter = new JacksonHttpMessageConverter();
        return new HttpMessageConverters(jacksonHttpMessageConverter);
    }
}
```

> 放弃 Fastjson 是因为 `List<Long>` 转换为 JSON 后 Long 不会变为字符串。